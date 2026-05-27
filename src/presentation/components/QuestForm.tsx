import { WandSparkles, Plus } from "lucide-react";
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

  return (
    <form className="quest-form" onSubmit={handleSubmit}>
      <div className="template-row">
        <button type="button" onClick={() => applyTemplate("habit")}>Habito</button>
        <button type="button" onClick={() => applyTemplate("daily")}>Diaria</button>
        <button type="button" onClick={() => applyTemplate("weekly")}>Semanal</button>
        <button type="button" onClick={() => applyTemplate("single")}>Unica</button>
      </div>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Ex: estudar TypeScript por 45 min"
        aria-label="Titulo da missao"
      />
      <select value={kind} onChange={(event) => setKind(event.target.value as QuestKind)}>
        {questKindOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select value={attribute} onChange={(event) => setAttribute(event.target.value as Attribute)}>
        {attributeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as TaskDifficulty)}>
        {difficultyOptions.map((option) => (
          <option key={option.value} value={option.value}>
            Rank {option.label}
          </option>
        ))}
      </select>
      <select value={recurrence} onChange={(event) => setRecurrence(event.target.value as Recurrence)}>
        {recurrenceOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={dueAt}
        onChange={(event) => setDueAt(event.target.value)}
        aria-label="Prazo da missao"
      />
      <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
        <option value="">Sem projeto</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.title}
          </option>
        ))}
      </select>
      <input
        value={importance}
        onChange={(event) => setImportance(event.target.value)}
        placeholder="Por que isso importa?"
        aria-label="Importancia da missao"
      />
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
      <button type="submit" title="Criar missao">
        <Plus size={18} />
      </button>
    </form>
  );
};
