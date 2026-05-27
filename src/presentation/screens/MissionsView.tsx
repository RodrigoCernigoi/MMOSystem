import { FormEvent, useMemo, useState } from "react";
import type {
  Attribute,
  Quest,
  QuestKind,
  Recurrence,
  TaskDifficulty,
  TaskStatus,
  UpdateQuestInput,
} from "../../domain/task";
import { QuestCard } from "../components/QuestCard";
import {
  attributeOptions,
  difficultyOptions,
  questKindOptions,
  recurrenceOptions,
} from "../viewModels";
import { useProgressionSystem } from "../useProgressionSystem";

type MissionFilter = TaskStatus | "all";

type MissionsViewProps = {
  quests: Quest[];
  error: string | null;
  onCompleteQuest: (id: string) => Promise<void>;
  onUpdateQuest: (id: string, input: UpdateQuestInput) => Promise<void>;
  onArchiveQuest: (id: string) => Promise<void>;
  onDeleteQuest: (id: string) => Promise<void>;
};

const filters: Array<{ value: MissionFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "open", label: "Ativas" },
  { value: "completed", label: "Concluidas" },
  { value: "failed", label: "Falhas" },
  { value: "archived", label: "Arquivo" },
];

export const MissionsView = ({
  quests,
  error,
  onCompleteQuest,
  onUpdateQuest,
  onArchiveQuest,
  onDeleteQuest,
}: MissionsViewProps) => {
  const [filter, setFilter] = useState<MissionFilter>("open");
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const { progression } = useProgressionSystem();
  const visibleQuests = useMemo(() => {
    const filtered = filter === "all" ? quests : quests.filter((quest) => quest.status === filter);
    const statusOrder = { open: 0, failed: 1, completed: 2, archived: 3 };

    return [...filtered].sort((left, right) => statusOrder[left.status] - statusOrder[right.status]);
  }, [filter, quests]);

  const handleDelete = async (id: string) => {
    if (confirm("Excluir esta missao permanentemente?")) {
      await onDeleteQuest(id);
    }
  };

  const handleSubmitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingQuest) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    await onUpdateQuest(editingQuest.id, {
      title: String(formData.get("title") ?? ""),
      kind: String(formData.get("kind")) as QuestKind,
      attribute: String(formData.get("attribute")) as Attribute,
      difficulty: String(formData.get("difficulty")) as TaskDifficulty,
      recurrence: String(formData.get("recurrence")) as Recurrence,
      dueAt: String(formData.get("dueAt") ?? ""),
      projectId: String(formData.get("projectId") ?? ""),
      importance: String(formData.get("importance") ?? ""),
    });
    setEditingQuest(null);
  };

  return (
    <section className="content-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Quest board</p>
          <h1>Missoes</h1>
        </div>
        <div className="segmented-control">
          {filters.map((item) => (
            <button
              key={item.value}
              className={filter === item.value ? "segment-active" : ""}
              type="button"
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {editingQuest && (
        <form className="edit-quest-form" onSubmit={handleSubmitEdit}>
          <input name="title" defaultValue={editingQuest.title} aria-label="Titulo da missao" />
          <select name="kind" defaultValue={editingQuest.kind}>
            {questKindOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select name="attribute" defaultValue={editingQuest.attribute}>
            {attributeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select name="difficulty" defaultValue={editingQuest.difficulty}>
            {difficultyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                Rank {option.label}
              </option>
            ))}
          </select>
          <select name="recurrence" defaultValue={editingQuest.recurrence}>
            {recurrenceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input name="dueAt" type="date" defaultValue={editingQuest.dueAt ?? ""} aria-label="Prazo da missao" />
          <select name="projectId" defaultValue={editingQuest.projectId ?? ""}>
            <option value="">Sem projeto</option>
            {progression.projects
              .filter((project) => project.status === "active")
              .map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
          </select>
          <input name="importance" defaultValue={editingQuest.importance ?? ""} aria-label="Importancia da missao" />
          <button type="submit">Salvar</button>
          <button type="button" onClick={() => setEditingQuest(null)}>
            Cancelar
          </button>
        </form>
      )}
      <div className="quest-list">
        {visibleQuests.length === 0 ? (
          <div className="empty-state">Nenhuma missao nesta categoria.</div>
        ) : (
          visibleQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onCompleteQuest={onCompleteQuest}
              onEditQuest={setEditingQuest}
              onArchiveQuest={onArchiveQuest}
              onDeleteQuest={handleDelete}
            />
          ))
        )}
      </div>
    </section>
  );
};
