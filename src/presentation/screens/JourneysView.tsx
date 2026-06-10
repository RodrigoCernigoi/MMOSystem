import { Bot, CheckCircle2, Gift, GitBranch, ListChecks, Medal, Rocket, Sparkles, WandSparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { Player } from "../../domain/player";
import type { Quest } from "../../domain/task";
import type { JourneyPlan, JourneyTone } from "../../domain/journey";
import { inferJourneyAttributes } from "../../domain/journey";
import type { CreateQuestInput } from "../../domain/task";
import { suggestJourneyPlan } from "../../infrastructure/httpJourneySuggestionGateway";
import { useProgressionSystem } from "../useProgressionSystem";
import { useRewards } from "../useRewards";
import { attributeOptions, difficultyLabels, recurrenceLabels } from "../viewModels";
import { emitVisualEvent } from "../visualPreferences";

type JourneysViewProps = {
  player: Player;
  quests: Quest[];
  onCreateQuest: (input: CreateQuestInput) => Promise<Quest>;
};

export const JourneysView = ({ player, quests, onCreateQuest }: JourneysViewProps) => {
  const [goal, setGoal] = useState(player.focus ?? "");
  const [context, setContext] = useState(player.onboardingProfile?.reason ?? "");
  const [horizonWeeks, setHorizonWeeks] = useState(6);
  const [tone, setTone] = useState<JourneyTone>(player.onboardingProfile?.cadence === "intense" ? "intense" : "balanced");
  const [plan, setPlan] = useState<JourneyPlan | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { createProject, createMasterQuest, createSkill } = useProgressionSystem();
  const { createReward } = useRewards();
  const inferredAttributes = inferJourneyAttributes(goal || player.focus || "");
  const selectedLabels = inferredAttributes
    .map((attribute) => attributeOptions.find((option) => option.value === attribute)?.label)
    .filter(Boolean)
    .join(", ");

  const handleGenerate = async () => {
    setIsGenerating(true);
    const prompt = {
      goal: goal || player.focus || "Construir uma nova fase",
      context,
      horizonWeeks,
      attributes: inferredAttributes,
      tone,
    };

    try {
      const nextPlan = await suggestJourneyPlan(prompt);
      setPlan(nextPlan);
      setMessage(null);
      setError(null);
      emitVisualEvent("ui-popup");
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Nao foi possivel gerar a jornada.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleActivate = async () => {
    if (!plan) {
      return;
    }

    setIsActivating(true);
    setError(null);
    setMessage(null);

    try {
      const createdQuests = await Promise.all(plan.quests.map((quest) => onCreateQuest(quest)));
      const questByTitle = new Map(createdQuests.map((quest) => [quest.title, quest]));
      const createdProjects = await Promise.all(
        plan.projects.map((project) =>
          createProject({
            title: project.title,
            description: project.description,
            attribute: project.attribute,
            questIds: project.questTitleRefs
              .map((title) => questByTitle.get(title)?.id)
              .filter((id): id is string => Boolean(id)),
          }),
        ),
      );
      const projectByTitle = new Map(createdProjects.map((project) => [project.title, project]));

      await Promise.all(plan.skills.map((skill) => createSkill(skill)));
      await Promise.all(plan.rewards.map((reward) => createReward(reward)));
      await Promise.all(
        plan.masterQuests.map((masterQuest) =>
          createMasterQuest({
            title: masterQuest.title,
            description: masterQuest.description,
            attribute: masterQuest.attribute,
            projectIds: masterQuest.projectTitleRefs
              .map((title) => projectByTitle.get(title)?.id)
              .filter((id): id is string => Boolean(id)),
            skill: masterQuest.skill,
            boss: masterQuest.boss,
          }),
        ),
      );

      emitVisualEvent("level-up");
      setMessage("Jornada ativada. Missoes, projeto, skills, missao mestra e recompensas foram criados.");
      setPlan(null);
    } catch (activationError) {
      setError(activationError instanceof Error ? activationError.message : "Nao foi possivel ativar a jornada.");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <section className="content-panel journey-screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Journey architect</p>
          <h1>Jornadas</h1>
        </div>
        <Bot size={30} />
      </div>

      <div className="journey-hero">
        <div>
          <Sparkles size={22} />
          <p className="eyebrow">Plano de fase</p>
          <h2>Transforme um objetivo em trilha jogavel da vida real</h2>
          <span>
            A proposta cria uma estrutura revisavel antes de alterar seus dados. Nada e ativado sem confirmacao.
          </span>
        </div>
        <div className="journey-signal">
          <strong>{quests.filter((quest) => quest.status === "open").length}</strong>
          <span>missoes abertas agora</span>
        </div>
      </div>

      <div className="journey-layout">
        <form
          className="journey-builder"
          onSubmit={(event) => {
            event.preventDefault();
            void handleGenerate();
          }}
        >
          <label>
            <span>Objetivo principal</span>
            <textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="Ex: ficar mais saudavel, estudar programacao e melhorar minha vida social"
            />
          </label>
          <label>
            <span>Contexto da fase</span>
            <textarea
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="Explique restricoes, rotina, prazo, energia atual ou motivos."
            />
          </label>
          <div className="journey-controls">
            <label>
              <span>Horizonte</span>
              <input
                type="number"
                min="2"
                max="24"
                value={horizonWeeks}
                onChange={(event) => setHorizonWeeks(Number(event.target.value))}
              />
            </label>
            <label>
              <span>Ritmo</span>
              <select value={tone} onChange={(event) => setTone(event.target.value as JourneyTone)}>
                <option value="gentle">Leve</option>
                <option value="balanced">Equilibrado</option>
                <option value="intense">Intenso</option>
              </select>
            </label>
          </div>
          <div className="journey-detected">
            <span>Areas detectadas</span>
            <strong>{selectedLabels || "Disciplina, Vitalidade"}</strong>
          </div>
          <button type="submit" disabled={isGenerating}>
            <WandSparkles size={18} />
            {isGenerating ? "Gerando..." : "Gerar proposta"}
          </button>
        </form>

        <aside className="journey-preview">
          {!plan ? (
            <div className="journey-empty">
              <Rocket size={34} />
              <strong>Nenhuma proposta gerada</strong>
              <span>Descreva seu objetivo para montar uma jornada com missões, skills e recompensas.</span>
            </div>
          ) : (
            <>
              <div className="journey-plan-heading">
                <div>
                  <p className="eyebrow">Preview</p>
                  <h2>{plan.title}</h2>
                  <span>{plan.summary}</span>
                </div>
                <button type="button" onClick={handleActivate} disabled={isActivating}>
                  <CheckCircle2 size={18} />
                  {isActivating ? "Ativando..." : "Ativar jornada"}
                </button>
              </div>

              <div className="journey-plan-grid">
                <JourneyGroup
                  icon={<ListChecks size={18} />}
                  title="Missoes"
                  items={plan.quests.map((quest) => ({
                    title: quest.title,
                    detail: `${recurrenceLabels[quest.recurrence]} · Rank ${difficultyLabels[quest.difficulty]}`,
                  }))}
                />
                <JourneyGroup
                  icon={<GitBranch size={18} />}
                  title="Projetos"
                  items={plan.projects.map((project) => ({ title: project.title, detail: project.description }))}
                />
                <JourneyGroup
                  icon={<Sparkles size={18} />}
                  title="Skills"
                  items={plan.skills.map((skill) => ({ title: skill.title, detail: skill.description }))}
                />
                <JourneyGroup
                  icon={<Medal size={18} />}
                  title="Marcos"
                  items={[
                    ...plan.masterQuests.map((masterQuest) => ({
                      title: masterQuest.title,
                      detail: masterQuest.description,
                    })),
                    ...plan.milestones.map((milestone) => ({
                      title: milestone.title,
                      detail: milestone.description,
                    })),
                  ]}
                />
                <JourneyGroup
                  icon={<Gift size={18} />}
                  title="Loja"
                  items={plan.rewards.map((reward) => ({
                    title: reward.title,
                    detail: `${reward.description} · ${reward.cost} moedas`,
                  }))}
                />
              </div>
            </>
          )}
        </aside>
      </div>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="error-banner">{error}</div>}
    </section>
  );
};

const JourneyGroup = ({
  icon,
  title,
  items,
}: {
  icon: ReactNode;
  title: string;
  items: Array<{ title: string; detail: string }>;
}) => (
  <article className="journey-group">
    <div>
      {icon}
      <strong>{title}</strong>
      <span>{items.length}</span>
    </div>
    {items.map((item) => (
      <section key={`${title}-${item.title}`}>
        <strong>{item.title}</strong>
        <p>{item.detail}</p>
      </section>
    ))}
  </article>
);
