import { Brain, CalendarClock, Dumbbell, Flame, HeartPulse, MessageCircle, Plus, Settings2, ShieldCheck, Sparkles, Target, WandSparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import type { Project } from "../../domain/progressionSystem";
import { monthDays, weekdayLabels, weekdays } from "../../domain/schedule";
import type { Attribute, CreateQuestInput, QuestKind, Recurrence, RecurrenceRule, TaskDifficulty, Weekday } from "../../domain/task";
import type { CreateQuestIntent } from "../navigation/navigationIntent";
import {
  attributeOptions,
  difficultyOptions,
  questKindOptions,
  recurrenceOptions,
} from "../viewModels";

type QuestFormProps = {
  onCreateQuest: (input: CreateQuestInput) => Promise<void>;
  onSuggestQuest: (goal: string) => Promise<CreateQuestInput>;
  projects?: Project[];
  intent?: CreateQuestIntent | null;
};

type ForgeTab = "base" | "settings" | "assistant";

const questTemplates: Array<{
  kind: QuestKind;
  label: string;
  detail: string;
  Icon: typeof Target;
}> = [
  { kind: "habit", label: "Habito", detail: "check-in recorrente", Icon: Flame },
  { kind: "daily", label: "Diaria", detail: "ritual de hoje", Icon: CalendarClock },
  { kind: "weekly", label: "Semanal", detail: "ciclo maior", Icon: ShieldCheck },
  { kind: "single", label: "Unica", detail: "acao pontual", Icon: Target },
];

const realQuestTemplates: Array<{
  label: string;
  title: string;
  importance: string;
  kind: QuestKind;
  attribute: Attribute;
  difficulty: TaskDifficulty;
  recurrence: Recurrence;
  Icon: typeof Target;
  requiresEvidence?: boolean;
}> = [
  {
    label: "Saude",
    title: "Caminhar por 20 minutos",
    importance: "Cuidar do corpo para sustentar energia real ao longo da semana.",
    kind: "habit",
    attribute: "vitality",
    difficulty: "easy",
    recurrence: "daily",
    Icon: HeartPulse,
  },
  {
    label: "Estudo",
    title: "Estudar com foco por 45 minutos",
    importance: "Avancar uma habilidade concreta com pratica deliberada.",
    kind: "daily",
    attribute: "intelligence",
    difficulty: "normal",
    recurrence: "daily",
    Icon: Brain,
    requiresEvidence: true,
  },
  {
    label: "Social",
    title: "Iniciar uma conversa intencional",
    importance: "Treinar presenca social em uma situacao pequena e real.",
    kind: "single",
    attribute: "social",
    difficulty: "normal",
    recurrence: "none",
    Icon: MessageCircle,
  },
  {
    label: "Projeto",
    title: "Finalizar o proximo bloco do projeto",
    importance: "Transformar uma meta grande em um avanco objetivo e verificavel.",
    kind: "single",
    attribute: "discipline",
    difficulty: "hard",
    recurrence: "none",
    Icon: Target,
    requiresEvidence: true,
  },
  {
    label: "Disciplina",
    title: "Planejar as 3 prioridades de amanha",
    importance: "Reduzir atrito e deixar a proxima acao clara antes do dia comecar.",
    kind: "daily",
    attribute: "discipline",
    difficulty: "easy",
    recurrence: "daily",
    Icon: ShieldCheck,
  },
];

const attributeIcons: Record<Attribute, typeof Target> = {
  strength: Dumbbell,
  intelligence: Brain,
  discipline: ShieldCheck,
  social: MessageCircle,
  vitality: HeartPulse,
};

export const QuestForm = ({ onCreateQuest, onSuggestQuest, projects = [], intent }: QuestFormProps) => {
  const [activeTab, setActiveTab] = useState<ForgeTab>("base");
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [kind, setKind] = useState<QuestKind>("single");
  const [attribute, setAttribute] = useState<Attribute>("discipline");
  const [difficulty, setDifficulty] = useState<TaskDifficulty>("normal");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | undefined>();
  const [dueAt, setDueAt] = useState("");
  const [projectId, setProjectId] = useState("");
  const [importance, setImportance] = useState("");
  const [requiresEvidence, setRequiresEvidence] = useState(false);

  useEffect(() => {
    if (!intent) {
      return;
    }

    setTitle(intent.title ?? "");
    setKind(intent.kind ?? "single");
    setAttribute(intent.attribute ?? "discipline");
    setDifficulty(intent.difficulty ?? "normal");
    setRecurrence(intent.recurrence ?? "none");
    setRecurrenceRule(undefined);
    setDueAt(intent.dueAt ?? "");
    setProjectId(intent.projectId ?? "");
    setImportance(intent.importance ?? "");
    setRequiresEvidence(intent.requiresEvidence ?? false);
  }, [intent]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onCreateQuest({ title, kind, attribute, difficulty, recurrence, recurrenceRule, dueAt, projectId, importance, requiresEvidence });
    setTitle("");
    setImportance("");
    setRequiresEvidence(false);
  };

  const applyTemplate = (nextKind: QuestKind) => {
    setKind(nextKind);
    setRecurrence(nextKind === "daily" || nextKind === "habit" ? "daily" : nextKind === "weekly" ? "weekly" : "none");
    setRecurrenceRule(undefined);
    if (nextKind === "habit") {
      setDifficulty("easy");
    }
  };

  const applyRealTemplate = (template: (typeof realQuestTemplates)[number]) => {
    setTitle(template.title);
    setImportance(template.importance);
    setKind(template.kind);
    setAttribute(template.attribute);
    setDifficulty(template.difficulty);
    setRecurrence(template.recurrence);
    setRecurrenceRule(undefined);
    setRequiresEvidence(Boolean(template.requiresEvidence));
  };

  const handleSuggest = async () => {
    const suggestion = await onSuggestQuest(goal || title);
    setTitle(suggestion.title);
    setKind(suggestion.kind);
    setAttribute(suggestion.attribute);
    setDifficulty(suggestion.difficulty);
    setRecurrence(suggestion.recurrence);
    setRecurrenceRule(suggestion.recurrenceRule);
    setDueAt(suggestion.dueAt ?? "");
  };
  const toggleWeekday = (day: Weekday) => {
    setRecurrenceRule((current) => {
      const currentWeekdays = current?.weekdays ?? [];
      const nextWeekdays = currentWeekdays.includes(day)
        ? currentWeekdays.filter((item) => item !== day)
        : [...currentWeekdays, day].sort((left, right) => left - right);

      return {
        ...(current ?? {}),
        weekdays: nextWeekdays,
      };
    });
  };
  const toggleMonthDay = (day: number) => {
    setRecurrenceRule((current) => {
      const currentMonthDays = current?.monthDays ?? [];
      const nextMonthDays = currentMonthDays.includes(day)
        ? currentMonthDays.filter((item) => item !== day)
        : [...currentMonthDays, day].sort((left, right) => left - right);

      return {
        ...(current ?? {}),
        monthDays: nextMonthDays,
      };
    });
  };
  const handleRecurrenceChange = (nextRecurrence: Recurrence) => {
    setRecurrence(nextRecurrence);
    setRecurrenceRule(undefined);
  };
  const AttributeIcon = attributeIcons[attribute];
  const selectedProject = projects.find((project) => project.id === projectId);
  const activeTabIndex = activeTab === "base" ? 1 : activeTab === "settings" ? 2 : 3;
  const selectedWeekdays = recurrenceRule?.weekdays ?? [];
  const selectedMonthDays = recurrenceRule?.monthDays ?? [];

  return (
    <form className="quest-forge" onSubmit={handleSubmit}>
      <section className="quest-forge-main">
        <div className="forge-progress-card">
          <span>Etapa {activeTabIndex}/3</span>
          <strong>
            {activeTab === "base" && "Escolha o formato e a intencao"}
            {activeTab === "settings" && "Ajuste como o sistema vai rastrear"}
            {activeTab === "assistant" && "Use apoio opcional para lapidar"}
          </strong>
        </div>

        <div className="forge-tabbar" role="tablist" aria-label="Etapas de criacao da missao">
          <button
            className={activeTab === "base" ? "active" : ""}
            type="button"
            onClick={() => setActiveTab("base")}
          >
            <Target size={18} />
            Base
          </button>
          <button
            className={activeTab === "settings" ? "active" : ""}
            type="button"
            onClick={() => setActiveTab("settings")}
          >
            <Settings2 size={18} />
            Ajustes
          </button>
          <button
            className={activeTab === "assistant" ? "active" : ""}
            type="button"
            onClick={() => setActiveTab("assistant")}
          >
            <WandSparkles size={18} />
            Assistente
          </button>
        </div>

        {activeTab === "base" && (
          <div className="forge-tab-panel">
            <div className="forge-block">
              <div className="forge-block-heading">
                <p className="eyebrow">Tipo de missao</p>
                <span>Escolha o formato da acao</span>
              </div>
              <div className="template-row">
                {questTemplates.map(({ kind: templateKind, label, detail, Icon }) => (
                  <button
                    className={kind === templateKind ? "template-card template-card-active" : "template-card"}
                    key={templateKind}
                    type="button"
                    onClick={() => applyTemplate(templateKind)}
                  >
                    <Icon size={20} />
                    <strong>{label}</strong>
                    <span>{detail}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="forge-block forge-title-block">
              <div className="forge-block-heading">
                <p className="eyebrow">Templates reais</p>
                <span>Atalhos conscientes para rotinas comuns</span>
              </div>
              <div className="real-template-row">
            {realQuestTemplates.map((template) => (
              <button type="button" key={template.label} onClick={() => applyRealTemplate(template)}>
                <template.Icon size={22} />
                <div>
                  <strong>{template.label}</strong>
                  <span>{template.title}</span>
                </div>
              </button>
            ))}
              </div>
              <label>
                <span>Nome da missao</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex: estudar TypeScript por 45 min"
                  aria-label="Titulo da missao"
                />
              </label>
              <label>
                <span>Por que isso importa?</span>
                <textarea
                  value={importance}
                  onChange={(event) => setImportance(event.target.value)}
                  placeholder="Conecte essa acao a uma meta real"
                  aria-label="Importancia da missao"
                />
              </label>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="forge-tab-panel">
            <div className="forge-block">
              <div className="forge-block-heading">
                <p className="eyebrow">Parametros</p>
                <span>Ajuste dificuldade, atributo e prazo</span>
              </div>
              <div className="forge-field-grid">
                <label>
                  <span>Atributo</span>
                  <select value={attribute} onChange={(event) => setAttribute(event.target.value as Attribute)}>
                    {attributeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Rank</span>
                  <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as TaskDifficulty)}>
                    {difficultyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        Rank {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Recorrencia</span>
                  <select value={recurrence} onChange={(event) => handleRecurrenceChange(event.target.value as Recurrence)}>
                    {recurrenceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                {(recurrence === "daily" || recurrence === "weekly") && (
                  <div className="forge-field-wide recurrence-builder">
                    <div>
                      <span>Dias da semana</span>
                      <small>Deixe vazio para repetir todos os dias aplicaveis.</small>
                    </div>
                    <div className="weekday-picker">
                      {weekdays.map((day) => (
                        <button
                          className={recurrenceRule?.weekdays?.includes(day) ? "active" : ""}
                          type="button"
                          key={day}
                          onClick={() => toggleWeekday(day)}
                        >
                          {weekdayLabels[day]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {recurrence === "monthly" && (
                  <div className="forge-field-wide recurrence-builder">
                    <div>
                      <span>Dias do mes</span>
                      <small>Escolha um ou mais dias. Ex: 1 e 15 para duas vezes ao mes.</small>
                    </div>
                    <div className="month-day-picker">
                      {monthDays.map((day) => (
                        <button
                          className={recurrenceRule?.monthDays?.includes(day) ? "active" : ""}
                          type="button"
                          key={day}
                          onClick={() => toggleMonthDay(day)}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <label>
                  <span>Prazo</span>
                  <input
                    type="date"
                    value={dueAt}
                    onChange={(event) => setDueAt(event.target.value)}
                    aria-label="Prazo da missao"
                  />
                </label>
                <label className="forge-field-wide">
                  <span>Projeto vinculado</span>
                  <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
                    <option value="">Sem projeto</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="forge-switch-field forge-field-wide">
                  <input
                    type="checkbox"
                    checked={requiresEvidence}
                    onChange={(event) => setRequiresEvidence(event.target.checked)}
                  />
                  <span>Exigir evidencia antes de concluir</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "assistant" && (
          <div className="forge-tab-panel">
            <div className="forge-ai-row">
              <div>
                <p className="eyebrow">Assistente</p>
                <span>Descreva uma meta e gere uma missao base</span>
              </div>
              <div className="suggest-row">
                <input
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  placeholder="Objetivo para sugerir quest"
                  aria-label="Objetivo para sugestao"
                />
                <button type="button" onClick={handleSuggest} title="Sugerir missao">
                  <WandSparkles size={18} />
                </button>
              </div>
            </div>
            <div className="forge-helper-card">
              <Sparkles size={20} />
              <div>
                <strong>Use como rascunho, nao como piloto automatico</strong>
                <span>Depois da sugestao, volte para Base e Ajustes para garantir que a missao faz sentido na sua rotina.</span>
              </div>
            </div>
          </div>
        )}
      </section>

      <aside className="quest-forge-preview">
        <div className="preview-orbit" />
        <div className="preview-icon">
          <AttributeIcon size={24} />
        </div>
        <p className="eyebrow">Preview da missao</p>
        <h2>{title || "Nova missao"}</h2>
        <p>{importance || "Defina uma acao pequena o bastante para ser executada de verdade."}</p>
        <div className="quest-meta preview-meta">
          <span className="quest-rank">Rank {difficultyOptions.find((option) => option.value === difficulty)?.label}</span>
          <span>{questKindOptions.find((option) => option.value === kind)?.label}</span>
          <span>{attributeOptions.find((option) => option.value === attribute)?.label}</span>
          {selectedWeekdays.length > 0 && (
            <span>{selectedWeekdays.map((day) => weekdayLabels[day]).join(", ")}</span>
          )}
          {selectedMonthDays.length > 0 && <span>Dias {selectedMonthDays.join(", ")}</span>}
          {requiresEvidence && <span>Evidencia obrigatoria</span>}
          {dueAt && <span>{new Date(`${dueAt}T00:00:00`).toLocaleDateString("pt-BR")}</span>}
          {selectedProject && <span>{selectedProject.title}</span>}
        </div>
        <button className="forge-submit-button" type="submit" title="Criar missao">
          <Plus size={18} />
          Criar missao
          <Sparkles size={18} />
        </button>
      </aside>
    </form>
  );
};
