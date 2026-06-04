import { AnimatePresence, motion } from "motion/react";
import { BarChart3, Coins, Sparkles, Target, Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getDailyReviewBonus, getDailyReviewRank } from "../../domain/dailyReview";
import type { Player } from "../../domain/player";
import type { Quest } from "../../domain/task";
import { emitVisualEvent } from "../visualPreferences";

type DailyReviewOverlayProps = {
  isOpen: boolean;
  player: Player;
  quests: Quest[];
  date: string;
  onClose: () => void;
  onConfirm: () => Promise<unknown>;
};

export const DailyReviewOverlay = ({ isOpen, player, quests, date, onClose, onConfirm }: DailyReviewOverlayProps) => {
  const [phase, setPhase] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const history = player.dailyHistory.find((entry) => entry.date === date);
  const existingReview = player.dailyReviews.find((review) => review.date === date);
  const completedQuestIds = history?.completedQuestIds ?? [];
  const completedHabitIds = history?.completedHabitIds ?? [];
  const completedTotal = completedQuestIds.length + completedHabitIds.length;
  const xpEarned = history?.xpEarned ?? 0;
  const coinsEarned = history?.coinsEarned ?? 0;
  const completedTitles = [...completedQuestIds, ...completedHabitIds]
    .map((id) => quests.find((quest) => quest.id === id)?.title)
    .filter(Boolean);
  const evidenceItems = [...completedQuestIds, ...completedHabitIds]
    .map((id) => quests.find((quest) => quest.id === id))
    .filter((quest): quest is Quest => Boolean(quest?.evidenceLog?.length))
    .map((quest) => ({ title: quest.title, evidence: quest.evidenceLog?.[0]?.text ?? "" }))
    .slice(0, 4);
  const dayRank = existingReview?.rank ?? getDailyReviewRank(completedTotal);
  const bonus = existingReview?.bonus ?? getDailyReviewBonus(dayRank);

  useEffect(() => {
    if (!isOpen) {
      setPhase(0);
      return;
    }

    emitVisualEvent("ui-popup");

    const timers = [
      window.setTimeout(() => setPhase(1), 650),
      window.setTimeout(() => setPhase(2), 1450),
      window.setTimeout(() => setPhase(3), 2450),
    ];

    return () => timers.forEach(window.clearTimeout);
  }, [isOpen]);

  const handleConfirm = async () => {
    setIsConfirming(true);

    try {
      await onConfirm();
      emitVisualEvent("ui-confirm");
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  const bars = [
    { label: "XP computado", value: xpEarned, max: Math.max(100, xpEarned), Icon: Sparkles },
    { label: "Moedas obtidas", value: coinsEarned, max: Math.max(50, coinsEarned), Icon: Coins },
    { label: "Missoes concluidas", value: completedQuestIds.length, max: Math.max(5, completedQuestIds.length), Icon: Target },
    { label: "Habitos registrados", value: completedHabitIds.length, max: Math.max(5, completedHabitIds.length), Icon: Trophy },
    { label: "Evidencias reais", value: evidenceItems.length, max: Math.max(4, evidenceItems.length), Icon: BarChart3 },
    { label: "Bonus de fechamento", value: bonus.xp + bonus.coins + bonus.skillPoints, max: Math.max(100, bonus.xp + bonus.coins + bonus.skillPoints), Icon: Sparkles },
  ];

  const handleAnimationComplete = () => {
    if (isOpen) {
      emitVisualEvent("daily-review");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.main
          className="daily-review-stage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        >
          <motion.section
            className="daily-review-panel"
            initial={{ opacity: 0, y: 42, scale: 0.92, filter: "blur(14px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -22, scale: 1.04, filter: "blur(18px)" }}
            transition={{ duration: 0.62, ease: "easeOut" }}
            onAnimationComplete={handleAnimationComplete}
          >
            <button className="daily-review-close" type="button" onClick={onClose} title="Fechar revisao">
              <X size={18} />
            </button>
            <div className="daily-review-header">
              <motion.p
                className="eyebrow"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                Daily system report
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                Encerramento do Dia
              </motion.h1>
              <motion.div
                className="daily-rank"
                initial={{ scale: 0.2, rotate: -18, opacity: 0 }}
                animate={{ scale: phase >= 3 ? 1.08 : 1, rotate: 0, opacity: 1 }}
                transition={{ delay: 2.35, type: "spring", stiffness: 180, damping: 12 }}
              >
                Rank {phase >= 3 ? dayRank : "?"}
              </motion.div>
            </div>

            <div className="daily-review-grid">
              {bars.map(({ label, value, max, Icon }, index) => (
                <motion.div
                  className="review-stat"
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.22 }}
                >
                  <div className="review-stat-label">
                    <Icon size={18} />
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                  <div className="review-track">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: phase >= 2 ? `${Math.min(100, (value / max) * 100)}%` : "0%" }}
                      transition={{ delay: index * 0.18, duration: 0.95, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="daily-review-log"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.15 }}
            >
              <div>
                <BarChart3 size={18} />
                <strong>Atividades computadas</strong>
              </div>
              {completedTitles.length === 0 ? (
                <span>Nenhuma conclusao registrada hoje.</span>
              ) : (
                completedTitles.map((title) => <span key={title}>{title}</span>)
              )}
            </motion.div>
            <motion.div
              className="daily-review-log evidence-review-log"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase >= 2 ? 1 : 0 }}
              transition={{ delay: 2.35 }}
            >
              <div>
                <Sparkles size={18} />
                <strong>Provas reais do dia</strong>
              </div>
              {evidenceItems.length === 0 ? (
                <span>Nenhuma evidencia textual registrada hoje.</span>
              ) : (
                evidenceItems.map((item) => (
                  <span key={`${item.title}-${item.evidence}`}>
                    {item.title}: {item.evidence}
                  </span>
                ))
              )}
            </motion.div>
            <motion.div
              className="daily-review-footer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 12 }}
            >
              <div className="daily-review-bonus">
                <span>Bonus</span>
                <strong>+{bonus.xp} XP</strong>
                <strong>+{bonus.coins} moedas</strong>
                <strong>+{bonus.skillPoints} SP</strong>
              </div>
              <button type="button" onClick={handleConfirm} disabled={isConfirming || Boolean(existingReview)}>
                {existingReview ? "Dia ja encerrado" : isConfirming ? "Registrando..." : "Confirmar progresso"}
              </button>
            </motion.div>
          </motion.section>
        </motion.main>
      )}
    </AnimatePresence>
  );
};
