import { Search } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type {
  Attribute,
  Quest,
  CompleteQuestInput,
  QuestKind,
  Recurrence,
  TaskDifficulty,
  TaskStatus,
  UpdateQuestInput,
} from "../../domain/task";
import { QuestCard } from "../components/QuestCard";
import { QuestDetailModal } from "../components/QuestDetailModal";
import { Tabs } from "../components/Tabs";
import type { AppView } from "../navigation/appViews";
import type { AppFocus } from "../navigation/navigationIntent";
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
  onCompleteQuest: (id: string, input?: CompleteQuestInput) => Promise<void>;
  onUpdateQuest: (id: string, input: UpdateQuestInput) => Promise<void>;
  onArchiveQuest: (id: string) => Promise<void>;
  onDeleteQuest: (id: string) => Promise<void>;
  onOpenFocus: (id: string) => void;
  onFocusNavigate?: (view: AppView, focus: AppFocus) => void;
};

const filters: Array<{ id: MissionFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "open", label: "Ativas" },
  { value: "completed", label: "Concluidas" },
  { value: "failed", label: "Falhas" },
  { value: "archived", label: "Arquivo" },
].map(({ value, label }) => ({ id: value as MissionFilter, label }));

export const MissionsView = ({
  quests,
  error,
  onCompleteQuest,
  onUpdateQuest,
  onArchiveQuest,
  onDeleteQuest,
  onOpenFocus,
  onFocusNavigate,
}: MissionsViewProps) => {
  const [filter, setFilter] = useState<MissionFilter>("open");
  const [searchTerm, setSearchTerm] = useState("");
  const [kindFilter, setKindFilter] = useState<QuestKind | "all">("all");
  const [attributeFilter, setAttributeFilter] = useState<Attribute | "all">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const { progression } = useProgressionSystem();
  const activeProjects = progression.projects.filter((project) => project.status === "active");
  const projectById = useMemo(
    () => new Map(progression.projects.map((project) => [project.id, project])),
    [progression.projects],
  );
  const todayKey = new Date().toISOString().slice(0, 10);
  const statusCounts = useMemo(
    () => ({
      all: quests.length,
      open: quests.filter((quest) => quest.status === "open").length,
      completed: quests.filter((quest) => quest.status === "completed").length,
      failed: quests.filter((quest) => quest.status === "failed").length,
      archived: quests.filter((quest) => quest.status === "archived").length,
    }),
    [quests],
  );
  const visibleQuests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = (filter === "all" ? quests : quests.filter((quest) => quest.status === filter))
      .filter((quest) => kindFilter === "all" || quest.kind === kindFilter)
      .filter((quest) => attributeFilter === "all" || quest.attribute === attributeFilter)
      .filter((quest) => projectFilter === "all" || quest.projectId === projectFilter)
      .filter((quest) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          quest.title.toLowerCase().includes(normalizedSearch) ||
          (quest.importance ?? "").toLowerCase().includes(normalizedSearch) ||
          (quest.projectId ? projectById.get(quest.projectId)?.title.toLowerCase().includes(normalizedSearch) : false)
        );
      });
    const statusOrder = { open: 0, failed: 1, completed: 2, archived: 3 };

    return [...filtered].sort((left, right) => {
      const statusComparison = statusOrder[left.status] - statusOrder[right.status];

      if (statusComparison !== 0) {
        return statusComparison;
      }

      const leftDue = left.dueAt ?? "9999-12-31";
      const rightDue = right.dueAt ?? "9999-12-31";
      return leftDue.localeCompare(rightDue);
    });
  }, [attributeFilter, filter, kindFilter, projectById, projectFilter, quests, searchTerm]);

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
      requiresEvidence: formData.get("requiresEvidence") === "on",
    });
    setEditingQuest(null);
  };

  const selectedQuestProjectTitle = selectedQuest?.projectId ? projectById.get(selectedQuest.projectId)?.title : undefined;

  return (
    <section className="content-panel">
      <QuestDetailModal
        quest={selectedQuest}
        projectTitle={selectedQuestProjectTitle}
        onClose={() => setSelectedQuest(null)}
        onCompleteQuest={onCompleteQuest}
        onOpenFocus={onOpenFocus}
        onOpenProject={(projectId) => onFocusNavigate?.("projects", { type: "project", id: projectId })}
      />
      <div className="section-heading">
        <div>
          <p className="eyebrow">Quest board</p>
          <h1>Missoes</h1>
        </div>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <Tabs
        activeId={filter}
        onChange={setFilter}
        items={filters.map((item) => ({ ...item, indicator: statusCounts[item.id] }))}
      >
        <div className="mission-toolbar">
          <div className="skill-search mission-search">
            <Search size={17} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar missao, importancia ou projeto"
              aria-label="Buscar missao"
            />
          </div>
          <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as QuestKind | "all")}>
            <option value="all">Todos os tipos</option>
            {questKindOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={attributeFilter}
            onChange={(event) => setAttributeFilter(event.target.value as Attribute | "all")}
          >
            <option value="all">Todos atributos</option>
            {attributeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
            <option value="all">Todos projetos</option>
            {activeProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>
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
          <label className="forge-switch-field">
            <input name="requiresEvidence" type="checkbox" defaultChecked={editingQuest.requiresEvidence ?? false} />
            <span>Exigir evidencia</span>
          </label>
          <button type="submit">Salvar</button>
          <button type="button" onClick={() => setEditingQuest(null)}>
            Cancelar
          </button>
        </form>
      )}
      <div className="quest-list">
        {visibleQuests.length === 0 ? (
          <div className="empty-state visual-empty-state">Nenhuma missao nesta categoria.</div>
        ) : (
          visibleQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onCompleteQuest={onCompleteQuest}
              onEditQuest={setEditingQuest}
              onArchiveQuest={onArchiveQuest}
              onDeleteQuest={handleDelete}
              onOpenFocus={onOpenFocus}
              onOpenDetails={setSelectedQuest}
              onOpenProject={
                quest.projectId
                  ? (projectId) => onFocusNavigate?.("projects", { type: "project", id: projectId })
                  : undefined
              }
              projectTitle={quest.projectId ? projectById.get(quest.projectId)?.title : undefined}
              isUrgent={quest.status === "open" && Boolean(quest.dueAt && quest.dueAt <= todayKey)}
              isCompact={true}
            />
          ))
        )}
      </div>
      </Tabs>
    </section>
  );
};
