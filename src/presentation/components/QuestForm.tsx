import { Brain, CalendarClock, Dumbbell, Flame, HeartPulse, MessageCircle, Plus, ShieldCheck, Sparkles, Target, WandSparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import type { Project } from "../../domain/progressionSystem";
import type { Attribute, CreateQuestInput, QuestKind, Recurrence, TaskDifficulty } from "../../domain/task";
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

const attributeIcons: Record<Attribute, typeof Target> = {
  strength: Dumbbell,
  intelligence: Brain,
  discipline: ShieldCheck,
  social: MessageCircle,
  vitality: HeartPulse,
};

export const QuestForm = ({ onCreateQuest, onSuggestQuest, projects = [], intent }: QuestFormProps) => {
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [kind, setKind] = useState<QuestKind>("single");
  const [attribute, setAttribute] = useState<Attribute>("discipline");
  const [difficulty, setDifficulty] = useState<TaskDifficulty>("normal");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [dueAt, setDueAt] = useState("");
  const [projectId, setProjectId] = useState("");
  const [importance, setImportance] = useState("");

  useEffect(() => {
    if (!intent) {
      return;
    }

    setTitle(intent.title ?? "");
    setKind(intent.kind ?? "single");
    setAttribute(intent.attribute ?? "discipline");
    setDifficulty(intent.difficulty ?? "normal");
    setRecurrence(intent.recurrence ?? "none");
    setDueAt(intent.dueAt ?? "");
    setProjectId(intent.projectId ?? "");
    setImportance(intent.importance ?? "");
  }, [intent]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onCreateQuest({ title, kind, attribute, difficulty, recurrence, dueAt, projectId, importance });
    setTitle("");
    setImportance("");
  };

  const applyTemplate = (nextKind: QuestKind) => {
    setKind(nextKind);
    setRecurrence(nextKind === "daily" || nextKind === "habit" ? "daily" : nextKind === "weekly" ? "weekly" : "none");
    if (nextKind === "habit") {
      setDifficulty("easy");
    }
  };

  const handleSuggest = async () => {
    const suggestion = await onSuggestQuest(goal || title);
    setTitle(suggestion.title);
    setKind(suggestion.kind);
    setAttribute(suggestion.attribute);
    setDifficulty(suggestion.difficulty);
    setRecurrence(suggestion.recurrence);
    setDueAt(suggestion.dueAt ?? "");
  };
  const AttributeIcon = attributeIcons[attribute];
  const selectedProject = projects.find((project) => project.id === projectId);

  return (
    <form className="quest-forge" onSubmit={handleSubmit}>
      <section className="quest-forge-main">
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
              <select value={recurrence} onChange={(event) => setRecurrence(event.target.value as Recurrence)}>
                {recurrenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
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
          </div>
        </div>

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
