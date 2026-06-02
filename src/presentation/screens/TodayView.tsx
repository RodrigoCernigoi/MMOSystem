import { CheckCircle2, Coins, Compass, PlusCircle, Target, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { calculateHabitStreak } from "../../domain/habitStats";
import { isHabitDoneToday, isQuestForToday, toDateKey } from "../../domain/schedule";
import type { Player } from "../../domain/player";
import type { CompleteQuestInput, Quest } from "../../domain/task";
import { QuestCard } from "../components/QuestCard";
import { QuestDetailModal } from "../components/QuestDetailModal";
import { DailyReviewOverlay } from "../components/DailyReviewOverlay";
import { Metric } from "../components/Metric";
import { Tabs } from "../components/Tabs";
import { useProgressionSystem } from "../useProgressionSystem";

type TodayViewProps = {
  player: Player;
  quests: Quest[];
  onCompleteQuest: (id: string, input?: CompleteQuestInput) => Promise<void>;
  onEndDay: (date: string) => Promise<unknown>;
  onOpenFocus: (id: string) => void;
  reviewRequestId?: number;
};

export const TodayView = ({ player, quests, onCompleteQuest, onEndDay, onOpenFocus, reviewRequestId = 0 }: TodayViewProps) => {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"habits" | "missions" | "projects">("habits");
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const { progression } = useProgressionSystem();
  const today = toDateKey(new Date());
  const todayQuests = quests.filter((quest) => isQuestForToday(quest, today));
  const todayHistory = player.dailyHistory.find((entry) => entry.date === today);
  const todayReview = player.dailyReviews.find((entry) => entry.date === today);
  const pendingHabits = todayQuests.filter((quest) => quest.kind === "habit" && !isHabitDoneToday(quest, today));
  const doneHabits = todayQuests.filter((quest) => quest.kind === "habit" && isHabitDoneToday(quest, today));
  const dueToday = todayQuests.filter((quest) => quest.kind !== "habit");
  const projectQuests = quests.filter((quest) => quest.status === "open" && quest.projectId);
  const completedToday = (todayHistory?.completedQuestIds.length ?? 0) + (todayHistory?.completedHabitIds.length ?? 0);
  const totalToday = pendingHabits.length + doneHabits.length + dueToday.length;
  const progressPercent = totalToday === 0 ? (todayReview ? 100 : 0) : Math.round((completedToday / totalToday) * 100);
  const nextQuest = pendingHabits[0] ?? dueToday[0] ?? projectQuests[0];
  const nextAction = nextQuest
    ? {
        eyebrow: nextQuest.kind === "habit" ? "Proximo check-in" : "Proxima missao",
        title: nextQuest.title,
        detail: nextQuest.importance || "Concluir esta acao move o dia para frente.",
        label: "Concluir agora",
        Icon: Target,
        onClick: () => void onCompleteQuest(nextQuest.id),
      }
    : todayReview
      ? {
          eyebrow: "Dia fechado",
          title: "Progresso registrado",
          detail: `Rank ${todayReview.rank} computado no relatorio diario.`,
          label: "Ver fechamento",
          Icon: CheckCircle2,
          onClick: () => setIsReviewOpen(true),
        }
      : completedToday > 0
        ? {
            eyebrow: "Ritual de fechamento",
            title: "Encerrar o dia",
            detail: "Compute XP, moedas, rank e o resumo do dia.",
            label: "Encerrar dia",
            Icon: Trophy,
            onClick: () => setIsReviewOpen(true),
          }
        : {
            eyebrow: "Sem acoes para hoje",
            title: "Criar uma nova missao",
            detail: "Adicione uma acao simples para manter o sistema vivo.",
            label: "Ir para Criar",
            Icon: PlusCircle,
            onClick: () => setActiveTab("missions"),
          };
  const NextIcon = nextAction.Icon;
  const selectedQuestProjectTitle = selectedQuest?.projectId
    ? progression.projects.find((project) => project.id === selectedQuest.projectId)?.title
    : undefined;

  useEffect(() => {
    if (reviewRequestId > 0) {
      setIsReviewOpen(true);
    }
  }, [reviewRequestId]);

  return (
    <div className="view-grid view-grid-wide">
      <QuestDetailModal
        quest={selectedQuest}
        projectTitle={selectedQuestProjectTitle}
        onClose={() => setSelectedQuest(null)}
        onCompleteQuest={onCompleteQuest}
        onOpenFocus={onOpenFocus}
      />
      <section className="content-panel span-all daily-cockpit">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Hoje</p>
            <h1>Painel diario</h1>
          </div>
          <button type="button" onClick={() => setIsReviewOpen(true)}>
            {todayReview ? "Ver fechamento" : "Encerrar dia"}
          </button>
        </div>
        <div className="daily-cockpit-grid">
          <div className="daily-progress-card">
            <div>
              <p className="eyebrow">Progresso do dia</p>
              <strong>{progressPercent}%</strong>
              <span>
                {completedToday}/{Math.max(totalToday, completedToday)} acoes computadas
              </span>
            </div>
            <div className="daily-progress-ring" style={{ ["--progress" as string]: `${progressPercent}%` }}>
              <span>{progressPercent}</span>
            </div>
            <div className="daily-progress-track">
              <div style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <div className="next-action-card">
            <div className="next-action-icon">
              <NextIcon size={24} />
            </div>
            <div>
              <p className="eyebrow">{nextAction.eyebrow}</p>
              <h2>{nextAction.title}</h2>
              <p>{nextAction.detail}</p>
            </div>
            <button type="button" onClick={nextAction.onClick}>
              <Compass size={18} />
              {nextAction.label}
            </button>
          </div>
        </div>
        <div className="summary-strip compact-summary">
          <Metric icon={<Target size={18} />} label="Pendentes" value={Math.max(0, totalToday - completedToday)} />
          <Metric icon={<Trophy size={18} />} label="Habitos" value={pendingHabits.length} />
          <Metric icon={<Coins size={18} />} label="Moedas hoje" value={todayHistory?.coinsEarned ?? 0} />
        </div>
      </section>

      <section className="content-panel span-all daily-review-summary-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Revisao diaria</p>
            <h2>Resumo de hoje</h2>
          </div>
        </div>
        <div className="summary-strip">
          <Metric icon={<Target size={18} />} label="Missoes feitas" value={todayHistory?.completedQuestIds.length ?? 0} />
          <Metric icon={<Trophy size={18} />} label="Habitos feitos" value={todayHistory?.completedHabitIds.length ?? 0} />
          <Metric icon={<Coins size={18} />} label="Moedas hoje" value={todayHistory?.coinsEarned ?? 0} />
          <Metric icon={<Trophy size={18} />} label="Fechamento" value={todayReview ? 1 : 0} />
        </div>
      </section>

      <section className="content-panel span-all">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Cockpit</p>
            <h2>Foco do dia</h2>
          </div>
        </div>
        <Tabs
          activeId={activeTab}
          onChange={setActiveTab}
          items={[
            { id: "habits", label: "Habitos", indicator: pendingHabits.length },
            { id: "missions", label: "Missoes", indicator: dueToday.length },
            {
              id: "projects",
              label: "Projetos",
              indicator: quests.filter((quest) => quest.status === "open" && quest.projectId).length,
            },
          ]}
        >
          {activeTab === "habits" && (
            <div className="quest-list">
              {pendingHabits.length === 0 && doneHabits.length === 0 ? (
                <div className="empty-state visual-empty-state">Habitos de hoje em dia.</div>
              ) : (
                <>
                  {pendingHabits.map((quest) => (
                    <div className="habit-card-wrap" key={quest.id}>
                      <QuestCard quest={quest} onCompleteQuest={onCompleteQuest} onOpenFocus={onOpenFocus} onOpenDetails={setSelectedQuest} />
                      <span>Streak: {calculateHabitStreak(quest)} dias</span>
                    </div>
                  ))}
                  {doneHabits.map((quest) => (
                    <div className="habit-card-wrap" key={quest.id}>
                      <QuestCard quest={quest} onCompleteQuest={onCompleteQuest} onOpenFocus={onOpenFocus} onOpenDetails={setSelectedQuest} />
                      <span>Concluido hoje · Streak: {calculateHabitStreak(quest)} dias</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
          {activeTab === "missions" && (
            <div className="quest-list">
              {dueToday.length === 0 ? (
                <div className="empty-state visual-empty-state">Nenhuma missao para hoje.</div>
              ) : (
                dueToday.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} onCompleteQuest={onCompleteQuest} onOpenFocus={onOpenFocus} onOpenDetails={setSelectedQuest} />
                ))
              )}
            </div>
          )}
          {activeTab === "projects" && (
            <div className="quest-list">
              {quests.filter((quest) => quest.status === "open" && quest.projectId).length === 0 ? (
                <div className="empty-state visual-empty-state">Nenhuma missao de projeto em aberto.</div>
              ) : (
                quests
                  .filter((quest) => quest.status === "open" && quest.projectId)
                  .slice(0, 5)
                  .map((quest) => (
                    <QuestCard key={quest.id} quest={quest} onCompleteQuest={onCompleteQuest} onOpenFocus={onOpenFocus} onOpenDetails={setSelectedQuest} />
                  ))
              )}
            </div>
          )}
        </Tabs>
      </section>
      <DailyReviewOverlay
        isOpen={isReviewOpen}
        player={player}
        quests={quests}
        date={today}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={() => onEndDay(today)}
      />
    </div>
  );
};
