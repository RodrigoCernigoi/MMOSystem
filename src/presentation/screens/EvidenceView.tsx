import { BarChart3, FileText, FolderKanban, Search, Sparkles, Target } from "lucide-react";
import { useMemo, useState } from "react";
import type { Attribute, Quest } from "../../domain/task";
import type { AppView } from "../navigation/appViews";
import type { AppFocus } from "../navigation/navigationIntent";
import { useProgressionSystem } from "../useProgressionSystem";
import { attributeLabels, attributeOptions } from "../viewModels";

type EvidenceViewProps = {
  quests: Quest[];
  onFocusNavigate?: (view: AppView, focus: AppFocus) => void;
};

type EvidenceFilter = "all" | "quests" | "skills";

export const EvidenceView = ({ quests, onFocusNavigate }: EvidenceViewProps) => {
  const { progression } = useProgressionSystem();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<EvidenceFilter>("all");
  const [attributeFilter, setAttributeFilter] = useState<Attribute | "all">("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const projectById = useMemo(
    () => new Map(progression.projects.map((project) => [project.id, project])),
    [progression.projects],
  );
  const evidenceItems = useMemo(() => {
    const questEvidence = quests.flatMap((quest) =>
      (quest.evidenceLog ?? []).map((evidence) => ({
        id: `quest-${quest.id}-${evidence.id}`,
        type: "quests" as const,
        label: "Missao",
        title: quest.title,
        detail: evidence.text,
        attribute: quest.attribute,
        projectId: quest.projectId,
        date: evidence.createdAt,
        focus: quest.projectId
          ? { view: "projects" as AppView, focus: { type: "project" as const, id: quest.projectId } }
          : null,
      })),
    );
    const skillEvidence = progression.skills
      .filter((skill) => skill.evidence)
      .map((skill) => ({
        id: `skill-${skill.id}`,
        type: "skills" as const,
        label: "Skill",
        title: skill.title,
        detail: skill.evidence ?? "",
        attribute: skill.attribute,
        projectId: undefined,
        date: skill.unlockedAt ?? new Date().toISOString(),
        focus: { view: "skills" as AppView, focus: { type: "skill" as const, id: skill.id } },
      }));

    return [...questEvidence, ...skillEvidence].sort(
      (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
    );
  }, [progression.skills, quests]);
  const visibleEvidence = evidenceItems.filter((item) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const projectTitle = item.projectId ? projectById.get(item.projectId)?.title ?? "" : "";

    return (
      (typeFilter === "all" || item.type === typeFilter) &&
      (attributeFilter === "all" || item.attribute === attributeFilter) &&
      (projectFilter === "all" || item.projectId === projectFilter) &&
      (!normalizedSearch ||
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.detail.toLowerCase().includes(normalizedSearch) ||
        projectTitle.toLowerCase().includes(normalizedSearch))
    );
  });
  const evidenceStats = useMemo(() => {
    const attributeCounts = visibleEvidence.reduce(
      (counts, item) => ({ ...counts, [item.attribute]: (counts[item.attribute] ?? 0) + 1 }),
      {} as Partial<Record<Attribute, number>>,
    );
    const strongestAttribute = (Object.entries(attributeCounts).sort(([, left], [, right]) => right - left)[0]?.[0] ??
      null) as Attribute | null;
    const projectCount = new Set(visibleEvidence.map((item) => item.projectId).filter(Boolean)).size;

    return {
      total: visibleEvidence.length,
      questTotal: visibleEvidence.filter((item) => item.type === "quests").length,
      skillTotal: visibleEvidence.filter((item) => item.type === "skills").length,
      projectCount,
      strongestAttribute,
    };
  }, [visibleEvidence]);
  const groupedEvidence = useMemo(() => {
    const groups = visibleEvidence.reduce(
      (nextGroups, item) => {
        const dateKey = new Date(item.date).toLocaleDateString("pt-BR");
        return {
          ...nextGroups,
          [dateKey]: [...(nextGroups[dateKey] ?? []), item],
        };
      },
      {} as Record<string, typeof visibleEvidence>,
    );

    return Object.entries(groups);
  }, [visibleEvidence]);

  return (
    <section className="content-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Real proof archive</p>
          <h1>Evidencias</h1>
        </div>
        <FileText size={30} />
      </div>
      <div className="evidence-toolbar">
        <div className="skill-search mission-search">
          <Search size={17} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar evidencia, missao, skill ou projeto"
            aria-label="Buscar evidencias"
          />
        </div>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as EvidenceFilter)}>
          <option value="all">Todos tipos</option>
          <option value="quests">Missoes</option>
          <option value="skills">Skills</option>
        </select>
        <select value={attributeFilter} onChange={(event) => setAttributeFilter(event.target.value as Attribute | "all")}>
          <option value="all">Todos atributos</option>
          {attributeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
          <option value="all">Todos projetos</option>
          {progression.projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
      </div>
      <div className="evidence-stats-grid">
        <div>
          <FileText size={18} />
          <span>Total filtrado</span>
          <strong>{evidenceStats.total}</strong>
        </div>
        <div>
          <Target size={18} />
          <span>Missoes</span>
          <strong>{evidenceStats.questTotal}</strong>
        </div>
        <div>
          <Sparkles size={18} />
          <span>Skills</span>
          <strong>{evidenceStats.skillTotal}</strong>
        </div>
        <div>
          <BarChart3 size={18} />
          <span>Atributo destaque</span>
          <strong>{evidenceStats.strongestAttribute ? attributeLabels[evidenceStats.strongestAttribute] : "-"}</strong>
        </div>
        <div>
          <FolderKanban size={18} />
          <span>Projetos com prova</span>
          <strong>{evidenceStats.projectCount}</strong>
        </div>
      </div>
      <div className="evidence-archive-list">
        {visibleEvidence.length === 0 ? (
          <div className="empty-state visual-empty-state">Nenhuma evidencia encontrada.</div>
        ) : (
          groupedEvidence.map(([date, items]) => (
            <section className="evidence-day-group" key={date}>
              <div className="evidence-day-heading">
                <strong>{date}</strong>
                <span>{items.length} evidencia{items.length === 1 ? "" : "s"}</span>
              </div>
              {items.map((item) => (
                <article className="evidence-archive-card" key={item.id}>
                  <div className="evidence-archive-icon">
                    {item.type === "skills" ? <Sparkles size={18} /> : <Target size={18} />}
                  </div>
                  <div>
                    <span>{item.label} · {attributeLabels[item.attribute]}</span>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    {item.projectId && <small>{projectById.get(item.projectId)?.title}</small>}
                  </div>
                  <time>{new Date(item.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time>
                  {item.focus ? (
                    <button
                      type="button"
                      onClick={() => {
                        const target = item.focus;
                        if (target) {
                          onFocusNavigate?.(target.view, target.focus);
                        }
                      }}
                    >
                      Abrir
                    </button>
                  ) : null}
                </article>
              ))}
            </section>
          ))
        )}
      </div>
    </section>
  );
};
