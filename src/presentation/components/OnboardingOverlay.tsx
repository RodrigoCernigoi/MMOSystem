import { motion } from "motion/react";
import { CheckCircle2, Gift, Sparkles, Target, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import type { Attribute, CreateQuestInput } from "../../domain/task";
import type { UpdatePlayerProfileInput } from "../../application/questService";
import { useProgressionSystem } from "../useProgressionSystem";
import { useRewards } from "../useRewards";
import { attributeOptions } from "../viewModels";

type OnboardingOverlayProps = {
  onCreateQuest: (input: CreateQuestInput) => Promise<void>;
  onUpdateProfile: (input: UpdatePlayerProfileInput) => Promise<unknown>;
  onDone: () => void;
};

export const OnboardingOverlay = ({ onCreateQuest, onUpdateProfile, onDone }: OnboardingOverlayProps) => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [focus, setFocus] = useState("Construir consistencia");
  const [lifeArea, setLifeArea] = useState<Attribute>("discipline");
  const [dailyQuestTitle, setDailyQuestTitle] = useState("Revisar prioridades do dia");
  const [skillTitle, setSkillTitle] = useState("Consistencia basica");
  const [rewardTitle, setRewardTitle] = useState("Lazer sem culpa");
  const { createSkill } = useProgressionSystem();
  const { createReward } = useRewards();

  const submitOnboarding = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    await onUpdateProfile({
      name: name || "Hunter",
      title: "Em treinamento",
      focus,
      bio: "Primeira calibragem do sistema.",
      avatarSymbol: "spark",
    });
    await onCreateQuest({
      title: dailyQuestTitle,
      kind: "daily",
      attribute: lifeArea,
      difficulty: "easy",
      recurrence: "daily",
      dueAt: new Date().toISOString().slice(0, 10),
      importance: "Primeiro ritual criado pelo onboarding.",
    });
    await createSkill({
      title: skillTitle,
      description: "Habilidade real que voce quer desenvolver e rastrear.",
      attribute: lifeArea,
      prerequisiteSkillIds: [],
    });
    await createReward({
      title: rewardTitle,
      description: "Recompensa pessoal para trocar por moedas.",
      cost: 20,
    });

    localStorage.setItem("mmo-system:onboarding-complete", "true");
    setIsSubmitting(false);
    onDone();
  };

  return (
    <motion.div
      className="onboarding-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.form
        className="onboarding-panel"
        onSubmit={submitOnboarding}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
      >
        <div className="onboarding-steps">
          {[0, 1, 2].map((item) => (
            <span className={step >= item ? "onboarding-step onboarding-step-active" : "onboarding-step"} key={item} />
          ))}
        </div>

        {step === 0 && (
          <section className="onboarding-page">
            <UserRound size={34} />
            <p className="eyebrow">Primeira sincronizacao</p>
            <h1>Vamos calibrar seu sistema</h1>
            <p>Defina sua ficha inicial e uma area da vida para ser o ponto inicial do construtor de habitos.</p>
            <div className="onboarding-mini-flow">
              <span>1. Missao</span>
              <span>2. Foco</span>
              <span>3. Encerrar dia</span>
            </div>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              aria-label="Nome do usuario"
            />
            <input
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
              placeholder="Foco atual"
              aria-label="Foco atual"
            />
            <select value={lifeArea} onChange={(event) => setLifeArea(event.target.value as Attribute)}>
              {attributeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </section>
        )}

        {step === 1 && (
          <section className="onboarding-page">
            <Target size={34} />
            <p className="eyebrow">Missao diaria</p>
            <h1>Crie o primeiro ritual</h1>
            <input
              value={dailyQuestTitle}
              onChange={(event) => setDailyQuestTitle(event.target.value)}
              aria-label="Titulo da primeira missao diaria"
            />
          </section>
        )}

        {step === 2 && (
          <section className="onboarding-page">
            <Sparkles size={34} />
            <p className="eyebrow">Skill e recompensa</p>
            <h1>Defina o primeiro sinal de progresso</h1>
            <input
              value={skillTitle}
              onChange={(event) => setSkillTitle(event.target.value)}
              aria-label="Primeira skill real"
            />
            <div className="onboarding-reward-input">
              <Gift size={18} />
              <input
                value={rewardTitle}
                onChange={(event) => setRewardTitle(event.target.value)}
                aria-label="Primeira recompensa"
              />
            </div>
          </section>
        )}

        <div className="onboarding-actions">
          <button type="button" className="secondary-button" onClick={onDone}>
            Pular
          </button>
          {step > 0 && (
            <button type="button" className="secondary-button" onClick={() => setStep((current) => current - 1)}>
              Voltar
            </button>
          )}
          {step < 2 ? (
            <button type="button" onClick={() => setStep((current) => current + 1)}>
              Continuar
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
