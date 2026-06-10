import {
  Archive,
  Bot,
  CheckCircle2,
  Gift,
  GitBranch,
  ListChecks,
  Medal,
  Pencil,
  Rocket,
  Sparkles,
  Trash2,
  WandSparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { ChangeEvent } from "react";
import type { JourneyRecord } from "../../domain/progressionSystem";
import type { Player } from "../../domain/player";
import type { Quest } from "../../domain/task";
import type { JourneyPlan, JourneyTone } from "../../domain/journey";
import { inferJourneyAttributes } from "../../domain/journey";
import type { CreateQuestInput, Recurrence, TaskDifficulty } from "../../domain/task";
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

const interviewQuestions = [
  {
    title: "Qual objetivo realmente importa agora?",
    placeholder: "Ex: construir rotina de estudos e treinar 3x por semana",
  },
  {
    title: "Qual obstaculo mais costuma derrubar essa meta?",
    placeholder: "Ex: cansaco depois do trabalho, falta de clareza, ansiedade social",
  },
  {
    title: "Quantos dias por semana parecem realistas?",
    placeholder: "Ex: 3 dias fortes e 2 dias leves",
  },
  {
    title: "Que recompensa faz sentido sem fugir da vida real?",
    placeholder: "Ex: descanso planejado, lazer, material de estudo, sair com amigos",
  },
];

export const JourneysView = ({ player, quests, onCreateQuest }: JourneysViewProps) => {
  const [goal, setGoal] = useState(player.focus ?? "");
  const [context, setContext] = useState(player.onboardingProfile?.reason ?? "");
  const [horizonWeeks, setHorizonWeeks] = useState(6);
  const [tone, setTone] = useState<JourneyTone>(player.onboardingProfile?.cadence === "intense" ? "intense" : "balanced");
  const [plan, setPlan] = useState<JourneyPlan | null>(null);
  const [interviewStep, setInterviewStep] = useState(0);
  const [interviewAnswer, setInterviewAnswer] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    progression,
    createJourney,
    archiveJourney,
    completeJourney,
    createProject,
    createMasterQuest,
    createSkill,
  } = useProgressionSystem();
  const { createReward } = useRewards();
  const inferredAttributes = inferJourneyAttributes(goal || player.focus || "");
  const selectedLabels = inferredAttributes
    .map((attribute) => attributeOptions.find((option) => option.value === attribute)?.label)
    .filter(Boolean)
    .join(", ");
  const activeJourneys = progression.journeys.filter((journey) => journey.status === "active");
  const archivedJourneys = progression.journeys.filter((journey) => journey.status !== "active").slice(0, 4);

  const handleInterviewNext = () => {
    const answer = interviewAnswer.trim();

    if (!answer) {
      return;
    }

    if (interviewStep === 0) {
      setGoal(answer);
    } else {
      setContext((current) => [current, `${interviewQuestions[interviewStep].title} ${answer}`].filter(Boolean).join("\n"));
    }

    if (interviewStep === 2) {
      const lower = answer.toLowerCase();
      setTone(lower.includes("5") || lower.includes("todo") ? "intense" : lower.includes("2") ? "gentle" : "balanced");
    }

    setInterviewAnswer("");
    setInterviewStep((current) => Math.min(interviewQuestions.length - 1, current + 1));
  };

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
        plan.projects.map((project) => {
          const linkedQuestIds = project.questTitleRefs
            .map((title) => questByTitle.get(title)?.id)
            .filter((id): id is string => Boolean(id));

          return createProject({
            title: project.title,
            description: project.description,
            attribute: project.attribute,
            questIds: linkedQuestIds.length > 0 ? linkedQuestIds : createdQuests.map((quest) => quest.id),
          });
        }),
      );
      const projectByTitle = new Map(createdProjects.map((project) => [project.title, project]));
      const createdSkills = await Promise.all(plan.skills.map((skill) => createSkill(skill)));
      const createdRewards = await Promise.all(plan.rewards.map((reward) => createReward(reward)));
      const createdMasterQuests = await Promise.all(
        plan.masterQuests.map((masterQuest) => {
          const linkedProjectIds = masterQuest.projectTitleRefs
            .map((title) => projectByTitle.get(title)?.id)
            .filter((id): id is string => Boolean(id));

          return createMasterQuest({
            title: masterQuest.title,
            description: masterQuest.description,
            attribute: masterQuest.attribute,
            projectIds: linkedProjectIds.length > 0 ? linkedProjectIds : createdProjects.map((project) => project.id),
            skill: masterQuest.skill,
            boss: masterQuest.boss,
          });
        }),
      );

      await createJourney({
        title: plan.title,
        summary: plan.summary,
        questIds: createdQuests.map((quest) => quest.id),
        projectIds: createdProjects.map((project) => project.id),
        skillIds: createdSkills.map((skill) => skill.id),
        masterQuestIds: createdMasterQuests.map((masterQuest) => masterQuest.id),
        rewardIds: createdRewards.map((reward) => reward.id),
        milestones: plan.milestones,
      });

      emitVisualEvent("level-up");
      setMessage("Jornada ativada e salva. Missoes, projeto, skills, missao mestra e recompensas foram criados.");
      setPlan(null);
    } catch (activationError) {
      setError(activationError instanceof Error ? activationError.message : "Nao foi possivel ativar a jornada.");
    } finally {
      setIsActivating(false);
    }
  };

  const updatePlan = (updater: (current: JourneyPlan) => JourneyPlan) => {
    setPlan((current) => (current ? updater(current) : current));
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
          <span>A proposta pode ser editada antes de ativar. A IA gera rascunho, voce decide a realidade.</span>
        </div>
        <div className="journey-signal">
          <strong>{activeJourneys.length}</strong>
          <span>jornadas ativas</span>
        </div>
      </div>

      <JourneyHistory
        activeJourneys={activeJourneys}
        archivedJourneys={archivedJourneys}
        onArchiveJourney={archiveJourney}
        onCompleteJourney={completeJourney}
      />

      <div className="journey-layout">
        <form
          className="journey-builder"
          onSubmit={(event) => {
            event.preventDefault();
            void handleGenerate();
          }}
        >
          <div className="journey-interview">
            <div>
              <p className="eyebrow">Entrevista rapida</p>
              <strong>{interviewQuestions[interviewStep].title}</strong>
            </div>
            <textarea
              value={interviewAnswer}
              onChange={(event) => setInterviewAnswer(event.target.value)}
              placeholder={interviewQuestions[interviewStep].placeholder}
            />
            <div className="journey-interview-actions">
              <span>
                {interviewStep + 1}/{interviewQuestions.length}
              </span>
              <button type="button" onClick={handleInterviewNext}>
                Aplicar resposta
              </button>
            </div>
          </div>

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
                  <p className="eyebrow">Preview editavel</p>
                  <input
                    value={plan.title}
                    onChange={(event) => updatePlan((current) => ({ ...current, title: event.target.value }))}
                    aria-label="Titulo da jornada"
                  />
                  <textarea
                    value={plan.summary}
                    onChange={(event) => updatePlan((current) => ({ ...current, summary: event.target.value }))}
                    aria-label="Resumo da jornada"
                  />
                </div>
                <button type="button" onClick={handleActivate} disabled={isActivating || plan.quests.length === 0}>
                  <CheckCircle2 size={18} />
                  {isActivating ? "Ativando..." : "Ativar jornada"}
                </button>
              </div>

              <div className="journey-plan-grid">
                <EditableQuestGroup plan={plan} updatePlan={updatePlan} />
                <EditableTextGroup
                  icon={<GitBranch size={18} />}
                  title="Projetos"
                  items={plan.projects}
                  detailKey="description"
                  onChange={(projects) => updatePlan((current) => ({ ...current, projects }))}
                />
                <EditableTextGroup
                  icon={<Sparkles size={18} />}
                  title="Skills"
                  items={plan.skills}
                  detailKey="description"
                  onChange={(skills) => updatePlan((current) => ({ ...current, skills }))}
                />
                <EditableTextGroup
                  icon={<Medal size={18} />}
                  title="Missoes mestras"
                  items={plan.masterQuests}
                  detailKey="description"
                  onChange={(masterQuests) => updatePlan((current) => ({ ...current, masterQuests }))}
                />
                <EditableRewardGroup plan={plan} updatePlan={updatePlan} />
                <EditableTextGroup
                  icon={<Medal size={18} />}
                  title="Marcos sugeridos"
                  items={plan.milestones}
                  detailKey="description"
                  onChange={(milestones) => updatePlan((current) => ({ ...current, milestones }))}
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

const JourneyHistory = ({
  activeJourneys,
  archivedJourneys,
  onArchiveJourney,
  onCompleteJourney,
}: {
  activeJourneys: JourneyRecord[];
  archivedJourneys: JourneyRecord[];
  onArchiveJourney: (id: string) => Promise<void>;
  onCompleteJourney: (id: string) => Promise<void>;
}) => (
  <div className="journey-history">
    {[...activeJourneys, ...archivedJourneys].length === 0 ? (
      <span>Nenhuma jornada salva ainda.</span>
    ) : (
      [...activeJourneys, ...archivedJourneys].map((journey) => (
        <article key={journey.id} className={`journey-history-card journey-history-card-${journey.status}`}>
          <div>
            <strong>{journey.title}</strong>
            <span>
              {journey.status} · {journey.questIds.length} missoes · {journey.skillIds.length} skills
            </span>
          </div>
          {journey.status === "active" && (
            <div>
              <button type="button" onClick={() => void onCompleteJourney(journey.id)} title="Concluir jornada">
                <CheckCircle2 size={16} />
              </button>
              <button type="button" onClick={() => void onArchiveJourney(journey.id)} title="Arquivar jornada">
                <Archive size={16} />
              </button>
            </div>
          )}
        </article>
      ))
    )}
  </div>
);

const EditableQuestGroup = ({
  plan,
  updatePlan,
}: {
  plan: JourneyPlan;
  updatePlan: (updater: (current: JourneyPlan) => JourneyPlan) => void;
}) => (
  <article className="journey-group journey-editor-group">
    <div>
      <ListChecks size={18} />
      <strong>Missoes</strong>
      <span>{plan.quests.length}</span>
    </div>
    {plan.quests.map((quest, index) => (
      <section key={`${quest.title}-${index}`} className="journey-editor-item">
        <div className="journey-editor-title">
          <Pencil size={14} />
          <input
            value={quest.title}
            onChange={(event) =>
              updatePlan((current) => ({
                ...current,
                quests: updateAt(current.quests, index, { ...quest, title: event.target.value }),
              }))
            }
          />
          <button
            type="button"
            className="danger-button"
            onClick={() => updatePlan((current) => ({ ...current, quests: removeAt(current.quests, index) }))}
          >
            <Trash2 size={14} />
          </button>
        </div>
        <textarea
          value={quest.importance ?? ""}
          onChange={(event) =>
            updatePlan((current) => ({
              ...current,
              quests: updateAt(current.quests, index, { ...quest, importance: event.target.value }),
            }))
          }
        />
        <div className="journey-editor-row">
          <select
            value={quest.difficulty}
            onChange={(event) =>
              updatePlan((current) => ({
                ...current,
                quests: updateAt(current.quests, index, {
                  ...quest,
                  difficulty: event.target.value as TaskDifficulty,
                }),
              }))
            }
          >
            {Object.entries(difficultyLabels).map(([value, label]) => (
              <option key={value} value={value}>
                Rank {label}
              </option>
            ))}
          </select>
          <select
            value={quest.recurrence}
            onChange={(event) =>
              updatePlan((current) => ({
                ...current,
                quests: updateAt(current.quests, index, {
                  ...quest,
                  recurrence: event.target.value as Recurrence,
                }),
              }))
            }
          >
            {Object.entries(recurrenceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </section>
    ))}
  </article>
);

const EditableRewardGroup = ({
  plan,
  updatePlan,
}: {
  plan: JourneyPlan;
  updatePlan: (updater: (current: JourneyPlan) => JourneyPlan) => void;
}) => (
  <article className="journey-group journey-editor-group">
    <div>
      <Gift size={18} />
      <strong>Loja</strong>
      <span>{plan.rewards.length}</span>
    </div>
    {plan.rewards.map((reward, index) => (
      <section key={`${reward.title}-${index}`} className="journey-editor-item">
        <div className="journey-editor-title">
          <Pencil size={14} />
          <input
            value={reward.title}
            onChange={(event) =>
              updatePlan((current) => ({
                ...current,
                rewards: updateAt(current.rewards, index, { ...reward, title: event.target.value }),
              }))
            }
          />
          <button
            type="button"
            className="danger-button"
            onClick={() => updatePlan((current) => ({ ...current, rewards: removeAt(current.rewards, index) }))}
          >
            <Trash2 size={14} />
          </button>
        </div>
        <textarea
          value={reward.description}
          onChange={(event) =>
            updatePlan((current) => ({
              ...current,
              rewards: updateAt(current.rewards, index, { ...reward, description: event.target.value }),
            }))
          }
        />
        <input
          type="number"
          min="20"
          value={reward.cost}
          onChange={(event) =>
            updatePlan((current) => ({
              ...current,
              rewards: updateAt(current.rewards, index, { ...reward, cost: Number(event.target.value) }),
            }))
          }
        />
      </section>
    ))}
  </article>
);

const EditableTextGroup = <T extends { title: string; [key: string]: unknown }>({
  icon,
  title,
  items,
  detailKey,
  onChange,
}: {
  icon: ReactNode;
  title: string;
  items: T[];
  detailKey: keyof T;
  onChange: (items: T[]) => void;
}) => (
  <article className="journey-group journey-editor-group">
    <div>
      {icon}
      <strong>{title}</strong>
      <span>{items.length}</span>
    </div>
    {items.map((item, index) => (
      <section key={`${title}-${item.title}-${index}`} className="journey-editor-item">
        <div className="journey-editor-title">
          <Pencil size={14} />
          <input value={item.title} onChange={(event) => onChange(updateAt(items, index, { ...item, title: event.target.value }))} />
          <button type="button" className="danger-button" onClick={() => onChange(removeAt(items, index))}>
            <Trash2 size={14} />
          </button>
        </div>
        <textarea
          value={String(item[detailKey] ?? "")}
          onChange={(event) => onChange(updateAt(items, index, { ...item, [detailKey]: event.target.value } as T))}
        />
      </section>
    ))}
  </article>
);

const updateAt = <T,>(items: T[], index: number, value: T) =>
  items.map((item, currentIndex) => (currentIndex === index ? value : item));

const removeAt = <T,>(items: T[], index: number) => items.filter((_item, currentIndex) => currentIndex !== index);
