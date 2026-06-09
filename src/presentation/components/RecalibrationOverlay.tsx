import { motion } from "motion/react";
import { CheckCircle2, Compass, Gauge, HeartHandshake, Layers3, X } from "lucide-react";
import { FormEvent, useState } from "react";
import type { UpdatePlayerProfileInput } from "../../application/questService";
import type { Player } from "../../domain/player";
import type { Attribute } from "../../domain/task";
import { attributeGameIcons } from "../gameIconCatalog";
import { attributeLabels, attributeOptions } from "../viewModels";
import { GameIcon } from "./GameIcon";

type RecalibrationOverlayProps = {
  player: Player;
  onUpdateProfile: (input: UpdatePlayerProfileInput) => Promise<unknown>;
  onClose: () => void;
};

type Cadence = "gentle" | "steady" | "intense";
type RewardStyle = "rest" | "leisure" | "learning" | "social";

const cadenceOptions: Array<{ value: Cadence; label: string; detail: string }> = [
  { value: "gentle", label: "Leve", detail: "Baixa friccao, poucas acoes essenciais." },
  { value: "steady", label: "Constante", detail: "Rotina equilibrada e sustentavel." },
  { value: "intense", label: "Intenso", detail: "Mais desafio para fases de alta energia." },
];

const rewardOptions: Array<{ value: RewardStyle; label: string; detail: string }> = [
  { value: "rest", label: "Descanso", detail: "Recuperacao como recompensa." },
  { value: "leisure", label: "Lazer", detail: "Diversao depois de progresso real." },
  { value: "learning", label: "Aprendizado", detail: "Investir em estudo ou material." },
  { value: "social", label: "Social", detail: "Recompensas ligadas a relacoes." },
];

export const RecalibrationOverlay = ({ player, onUpdateProfile, onClose }: RecalibrationOverlayProps) => {
  const profile = player.onboardingProfile;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focus, setFocus] = useState(player.focus ?? "");
  const [reason, setReason] = useState(profile?.reason ?? player.bio ?? "");
  const [primaryAreas, setPrimaryAreas] = useState<Attribute[]>(
    profile?.primaryAreas?.length ? profile.primaryAreas : ["discipline"],
  );
  const [cadence, setCadence] = useState<Cadence>(profile?.cadence ?? "steady");
  const [rewardStyle, setRewardStyle] = useState<RewardStyle>(profile?.rewardStyle ?? "leisure");

  const toggleArea = (area: Attribute) => {
    setPrimaryAreas((current) => {
      if (current.includes(area)) {
        return current.length === 1 ? current : current.filter((item) => item !== area);
      }

      return [...current, area].slice(-3);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onUpdateProfile({
        focus,
        bio: reason,
        onboardingProfile: {
          reason,
          primaryAreas,
          cadence,
          rewardStyle,
        },
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="onboarding-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.form
        className="onboarding-panel onboarding-panel-expanded recalibration-panel"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
      >
        <button className="recalibration-close" type="button" onClick={onClose} title="Fechar recalibragem">
          <X size={18} />
        </button>
        <div className="onboarding-shell-heading">
          <div>
            <p className="eyebrow">Mudanca de fase</p>
            <h1>Recalibrar sistema</h1>
          </div>
          <span>sem criar itens</span>
        </div>

        <section className="recalibration-grid">
          <div className="recalibration-column">
            <Compass size={30} />
            <p className="eyebrow">Direcao</p>
            <h2>O que deve guiar sua rotina agora?</h2>
            <input
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
              placeholder="Foco atual"
              aria-label="Foco atual"
            />
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Por que essa fase importa?"
              aria-label="Motivo da fase atual"
            />
          </div>

          <div className="recalibration-column">
            <Layers3 size={30} />
            <p className="eyebrow">Areas prioritarias</p>
            <h2>Ate tres frentes</h2>
            <div className="onboarding-area-grid recalibration-area-grid">
              {attributeOptions.map((option) => {
                const attribute = option.value as Attribute;
                const isSelected = primaryAreas.includes(attribute);

                return (
                  <button
                    className={isSelected ? "onboarding-area-card active" : "onboarding-area-card"}
                    type="button"
                    key={attribute}
                    onClick={() => toggleArea(attribute)}
                  >
                    <GameIcon name={attributeGameIcons[attribute]} size={26} />
                    <strong>{attributeLabels[attribute]}</strong>
                    {primaryAreas[0] === attribute && <span>base</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="recalibration-column">
            <Gauge size={30} />
            <p className="eyebrow">Ritmo</p>
            <h2>Quanto peso colocar no sistema?</h2>
            <div className="onboarding-cadence-grid recalibration-choice-grid">
              {cadenceOptions.map((option) => (
                <button
                  className={cadence === option.value ? "onboarding-choice active" : "onboarding-choice"}
                  type="button"
                  key={option.value}
                  onClick={() => setCadence(option.value)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.detail}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="recalibration-column">
            <HeartHandshake size={30} />
            <p className="eyebrow">Recompensa</p>
            <h2>Como o sistema deve devolver valor?</h2>
            <div className="onboarding-reward-grid recalibration-choice-grid">
              {rewardOptions.map((option) => (
                <button
                  className={rewardStyle === option.value ? "onboarding-choice active" : "onboarding-choice"}
                  type="button"
                  key={option.value}
                  onClick={() => setRewardStyle(option.value)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.detail}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="onboarding-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting}>
            <CheckCircle2 size={18} />
            {isSubmitting ? "Salvando..." : "Salvar recalibragem"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
};
