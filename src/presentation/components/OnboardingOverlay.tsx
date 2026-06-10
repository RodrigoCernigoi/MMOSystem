import { AnimatePresence, motion } from "motion/react";
import {
  CheckCircle2,
  ChevronRight,
  Compass,
  Flame,
  Gauge,
  Gift,
  HeartHandshake,
  Layers3,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { UpdatePlayerProfileInput } from "../../application/questService";
import type { RewardCategory } from "../../domain/reward";
import type { Attribute, CreateQuestInput } from "../../domain/task";
import { attributeGameIcons } from "../gameIconCatalog";
import { useProgressionSystem } from "../useProgressionSystem";
import { useRewards } from "../useRewards";
import { attributeLabels, attributeOptions } from "../viewModels";
import { GameIcon } from "./GameIcon";

type OnboardingOverlayProps = {
  onCreateQuest: (input: CreateQuestInput) => Promise<unknown>;
  onUpdateProfile: (input: UpdatePlayerProfileInput) => Promise<unknown>;
  onDone: () => void;
};

type Cadence = "gentle" | "steady" | "intense";
type RewardStyle = "rest" | "leisure" | "learning" | "social";

const steps = ["Identidade", "Direcao", "Areas", "Ciclo", "Confirmar"];

const onboardingPresets: Array<{
  label: string;
  detail: string;
  focus: string;
  reason: string;
  areas: Attribute[];
  cadence: Cadence;
  quest: string;
  skill: string;
  skillIcon: string;
  reward: string;
  rewardStyle: RewardStyle;
}> = [
  {
    label: "Consistencia",
    detail: "Rotina leve, repetivel e visivel.",
    focus: "Construir consistencia",
    reason: "Quero transformar intencoes em rotina real.",
    areas: ["discipline", "vitality"],
    cadence: "steady",
    quest: "Planejar as 3 prioridades do dia",
    skill: "Consistencia basica",
    skillIcon: "check-mark",
    reward: "Lazer sem culpa",
    rewardStyle: "leisure",
  },
  {
    label: "Energia",
    detail: "Corpo, sono e manutencao pessoal.",
    focus: "Recuperar energia",
    reason: "Quero ter mais energia para sustentar meus projetos.",
    areas: ["vitality", "strength"],
    cadence: "gentle",
    quest: "Caminhar por 20 minutos",
    skill: "Energia fisica basica",
    skillIcon: "health-normal",
    reward: "Descanso planejado",
    rewardStyle: "rest",
  },
  {
    label: "Maestria",
    detail: "Estudo, projeto e habilidade real.",
    focus: "Evoluir uma habilidade",
    reason: "Quero construir capacidade concreta em uma area importante.",
    areas: ["intelligence", "discipline"],
    cadence: "intense",
    quest: "Estudar com foco por 45 minutos",
    skill: "Estudo profundo",
    skillIcon: "brain",
    reward: "Material de aprendizado",
    rewardStyle: "learning",
  },
];

const cadenceOptions: Array<{ value: Cadence; label: string; detail: string }> = [
  { value: "gentle", label: "Leve", detail: "Poucas acoes, baixa friccao." },
  { value: "steady", label: "Constante", detail: "Equilibrio entre rotina e desafio." },
  { value: "intense", label: "Intenso", detail: "Mais ambicioso, exige energia." },
];

const rewardOptions: Array<{ value: RewardStyle; label: string; detail: string; category: RewardCategory }> = [
  { value: "rest", label: "Descanso", detail: "Recuperar sem culpa.", category: "rest" },
  { value: "leisure", label: "Lazer", detail: "Diversao como recompensa.", category: "leisure" },
  { value: "learning", label: "Aprendizado", detail: "Comprar ou estudar algo util.", category: "learning" },
  { value: "social", label: "Social", detail: "Sair, conversar, encontrar pessoas.", category: "social" },
];

const avatarOptions = [
  { value: "spark", label: "Centelha", icon: "sparkles" },
  { value: "focus", label: "Foco", icon: "targeting" },
  { value: "forge", label: "Forja", icon: "anvil" },
  { value: "vital", label: "Vital", icon: "health-normal" },
];

export const OnboardingOverlay = ({ onCreateQuest, onUpdateProfile, onDone }: OnboardingOverlayProps) => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("Em treinamento");
  const [avatarSymbol, setAvatarSymbol] = useState("spark");
  const [focus, setFocus] = useState("Construir consistencia");
  const [reason, setReason] = useState("Quero transformar intencoes em rotina real.");
  const [primaryAreas, setPrimaryAreas] = useState<Attribute[]>(["discipline", "vitality"]);
  const [cadence, setCadence] = useState<Cadence>("steady");
  const [dailyQuestTitle, setDailyQuestTitle] = useState("Planejar as 3 prioridades do dia");
  const [skillTitle, setSkillTitle] = useState("Consistencia basica");
  const [skillIcon, setSkillIcon] = useState("check-mark");
  const [rewardTitle, setRewardTitle] = useState("Lazer sem culpa");
  const [rewardStyle, setRewardStyle] = useState<RewardStyle>("leisure");
  const { createSkill } = useProgressionSystem();
  const { createReward } = useRewards();
  const mainArea = primaryAreas[0] ?? "discipline";
  const selectedReward = rewardOptions.find((option) => option.value === rewardStyle) ?? rewardOptions[1];
  const canContinue = step !== 0 || name.trim().length > 0;
  const summary = useMemo(
    () => [
      { label: "Ficha", value: name.trim() || "Hunter" },
      { label: "Foco", value: focus },
      { label: "Areas", value: primaryAreas.map((area) => attributeLabels[area]).join(", ") },
      { label: "Ritmo", value: cadenceOptions.find((option) => option.value === cadence)?.label ?? "Constante" },
    ],
    [cadence, focus, name, primaryAreas],
  );

  const applyPreset = (preset: (typeof onboardingPresets)[number]) => {
    setFocus(preset.focus);
    setReason(preset.reason);
    setPrimaryAreas(preset.areas);
    setCadence(preset.cadence);
    setDailyQuestTitle(preset.quest);
    setSkillTitle(preset.skill);
    setSkillIcon(preset.skillIcon);
    setRewardTitle(preset.reward);
    setRewardStyle(preset.rewardStyle);
  };

  const toggleArea = (area: Attribute) => {
    setPrimaryAreas((current) => {
      if (current.includes(area)) {
        return current.length === 1 ? current : current.filter((item) => item !== area);
      }

      return [...current, area].slice(-3);
    });
  };

  const submitOnboarding = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onUpdateProfile({
        name: name || "Hunter",
        title,
        focus,
        bio: reason,
        avatarSymbol,
        onboardingProfile: {
          reason,
          primaryAreas,
          cadence,
          rewardStyle,
        },
      });
      await onCreateQuest({
        title: dailyQuestTitle,
        kind: "daily",
        attribute: mainArea,
        difficulty: cadence === "intense" ? "normal" : "easy",
        recurrence: "daily",
        dueAt: new Date().toISOString().slice(0, 10),
        importance: `Ritual inicial do onboarding. Motivo: ${reason}`,
      });
      await createSkill({
        title: skillTitle,
        description: `Habilidade real ligada ao foco: ${focus}.`,
        attribute: mainArea,
        icon: skillIcon,
        prerequisiteSkillIds: [],
      });
      await createReward({
        title: rewardTitle,
        description: `Recompensa inicial calibrada para o estilo: ${selectedReward.label}.`,
        cost: cadence === "intense" ? 30 : 20,
        category: selectedReward.category,
      });

      localStorage.setItem("mmo-system:onboarding-complete", "true");
      onDone();
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
        className="onboarding-panel onboarding-panel-expanded"
        onSubmit={submitOnboarding}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
      >
        <div className="onboarding-shell-heading">
          <div>
            <p className="eyebrow">Primeira sincronizacao</p>
            <h1>Calibrar sistema</h1>
          </div>
          <span>
            {step + 1}/{steps.length}
          </span>
        </div>

        <div className="onboarding-steps onboarding-steps-expanded">
          {steps.map((item, index) => (
            <button
              className={step >= index ? "onboarding-step-pill onboarding-step-pill-active" : "onboarding-step-pill"}
              type="button"
              key={item}
              onClick={() => setStep(index)}
            >
              {item}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.section
              className="onboarding-page onboarding-split"
              key="identity"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
            >
              <div>
                <UserRound size={34} />
                <p className="eyebrow">Ficha inicial</p>
                <h2>Quem esta usando o sistema?</h2>
                <p>Use seu nome real ou um apelido. A ideia e acompanhar sua vida, nao criar um personagem separado.</p>
              </div>
              <div className="onboarding-field-stack">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome"
                  aria-label="Nome do usuario"
                  required
                />
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Titulo pessoal"
                  aria-label="Titulo pessoal"
                />
                <div className="onboarding-choice-grid">
                  {avatarOptions.map((option) => (
                    <button
                      className={avatarSymbol === option.value ? "onboarding-choice active" : "onboarding-choice"}
                      type="button"
                      key={option.value}
                      onClick={() => setAvatarSymbol(option.value)}
                    >
                      <GameIcon name={option.icon} size={24} />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {step === 1 && (
            <motion.section
              className="onboarding-page"
              key="direction"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
            >
              <Compass size={34} />
              <p className="eyebrow">Direcao real</p>
              <h2>Qual fase voce quer construir?</h2>
              <div className="onboarding-preset-row onboarding-preset-cards">
                {onboardingPresets.map((preset) => (
                  <button type="button" key={preset.label} onClick={() => applyPreset(preset)}>
                    <GameIcon name={preset.skillIcon} size={24} />
                    <strong>{preset.label}</strong>
                    <span>{preset.detail}</span>
                  </button>
                ))}
              </div>
              <input
                value={focus}
                onChange={(event) => setFocus(event.target.value)}
                placeholder="Foco atual"
                aria-label="Foco atual"
              />
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Por que isso importa agora?"
                aria-label="Motivo do foco atual"
              />
            </motion.section>
          )}

          {step === 2 && (
            <motion.section
              className="onboarding-page"
              key="areas"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
            >
              <Layers3 size={34} />
              <p className="eyebrow">Areas de vida</p>
              <h2>Onde o sistema deve prestar mais atencao?</h2>
              <p>Escolha ate tres areas. A primeira vira a base da missao e da skill inicial.</p>
              <div className="onboarding-area-grid">
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
                      <GameIcon name={attributeGameIcons[attribute]} size={28} />
                      <strong>{option.label}</strong>
                      {attribute === mainArea && <span>base inicial</span>}
                    </button>
                  );
                })}
              </div>
            </motion.section>
          )}

          {step === 3 && (
            <motion.section
              className="onboarding-page"
              key="cycle"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
            >
              <Flame size={34} />
              <p className="eyebrow">Primeiro ciclo</p>
              <h2>Crie um ritual pequeno e sustentavel</h2>
              <div className="onboarding-field-stack">
                <label>
                  Missao diaria
                  <input
                    value={dailyQuestTitle}
                    onChange={(event) => setDailyQuestTitle(event.target.value)}
                    aria-label="Titulo da primeira missao diaria"
                  />
                </label>
                <label>
                  Skill real rastreada
                  <input
                    value={skillTitle}
                    onChange={(event) => setSkillTitle(event.target.value)}
                    aria-label="Primeira skill real"
                  />
                </label>
                <div className="onboarding-icon-preview">
                  <GameIcon name={skillIcon} size={28} />
                  <span>{attributeLabels[mainArea]} sera a constelacao inicial dessa habilidade.</span>
                </div>
              </div>
              <div className="onboarding-cadence-grid">
                {cadenceOptions.map((option) => (
                  <button
                    className={cadence === option.value ? "onboarding-choice active" : "onboarding-choice"}
                    type="button"
                    key={option.value}
                    onClick={() => setCadence(option.value)}
                  >
                    <Gauge size={20} />
                    <strong>{option.label}</strong>
                    <span>{option.detail}</span>
                  </button>
                ))}
              </div>
            </motion.section>
          )}

          {step === 4 && (
            <motion.section
              className="onboarding-page onboarding-split"
              key="confirm"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
            >
              <div>
                <Sparkles size={34} />
                <p className="eyebrow">Sistema pronto</p>
                <h2>Seu primeiro ciclo sera criado</h2>
                <p>Isso deixa o app usavel logo de cara: uma missao diaria, uma skill real e uma recompensa.</p>
              </div>
              <div className="onboarding-confirm-card">
                {summary.map((item) => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
                <div>
                  <span>Recompensa</span>
                  <strong>{rewardTitle}</strong>
                </div>
                <div className="onboarding-reward-input">
                  <Gift size={18} />
                  <input
                    value={rewardTitle}
                    onChange={(event) => setRewardTitle(event.target.value)}
                    aria-label="Primeira recompensa"
                  />
                </div>
                <div className="onboarding-reward-grid">
                  {rewardOptions.map((option) => (
                    <button
                      className={rewardStyle === option.value ? "onboarding-choice active" : "onboarding-choice"}
                      type="button"
                      key={option.value}
                      onClick={() => setRewardStyle(option.value)}
                    >
                      <HeartHandshake size={18} />
                      <strong>{option.label}</strong>
                      <span>{option.detail}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <div className="onboarding-actions">
          <button type="button" className="secondary-button" onClick={onDone}>
            Pular
          </button>
          {step > 0 && (
            <button type="button" className="secondary-button" onClick={() => setStep((current) => current - 1)}>
              Voltar
            </button>
          )}
          {step < steps.length - 1 ? (
            <button type="button" disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>
              Continuar
              <ChevronRight size={18} />
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting}>
              <CheckCircle2 size={18} />
              {isSubmitting ? "Criando..." : "Entrar no sistema"}
            </button>
          )}
        </div>
      </motion.form>
    </motion.div>
  );
};
