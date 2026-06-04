import "@xyflow/react/dist/style.css";
import { Background, Controls, Handle, MiniMap, Position, ReactFlow, type Edge, type Node } from "@xyflow/react";
import { FormEvent, memo, useMemo, useState } from "react";
import { CheckCircle2, Lock, PlusCircle, Search, X } from "lucide-react";
import type { Attribute } from "../../domain/task";
import type { SkillNode } from "../../domain/progressionSystem";
import type { AppView } from "../navigation/appViews";
import type { AppFocus } from "../navigation/navigationIntent";
import { GameIcon } from "../components/GameIcon";
import { attributeGameIcons, getSkillIcon, skillIconOptions } from "../gameIconCatalog";
import { attributeLabels, attributeOptions } from "../viewModels";
import { useProgressionSystem } from "../useProgressionSystem";
import { emitVisualEvent } from "../visualPreferences";

type SkillFilter = "all" | Attribute;

type SkillTreeNodeData = {
  skill: SkillNode;
  attributeLabel: string;
  masterQuestTitle?: string;
  hasLockedPrerequisites: boolean;
};

const SkillTreeNode = memo(({ data }: { data: SkillTreeNodeData }) => (
  <article
    className={[
      "flow-skill-node",
      `flow-skill-node-${data.skill.attribute}`,
      data.skill.isUnlocked ? "flow-skill-node-unlocked" : "",
      data.hasLockedPrerequisites ? "flow-skill-node-locked" : "",
    ].join(" ")}
  >
    <Handle type="target" position={Position.Left} />
    <div className="flow-skill-node-header">
      <span>
        <GameIcon name={getSkillIcon(data.skill)} size={18} />
      </span>
      <strong>{data.skill.title}</strong>
    </div>
    <p>{data.skill.description}</p>
    <div className="flow-skill-node-meta">
      <span>{data.attributeLabel}</span>
      {data.masterQuestTitle && <span>{data.masterQuestTitle}</span>}
    </div>
    <Handle type="source" position={Position.Right} />
  </article>
));

const nodeTypes = {
  skill: SkillTreeNode,
};

type SkillsViewProps = {
  focus?: Extract<AppFocus, { type: "skill" }> | null;
  onFocusNavigate?: (view: AppView, focus: AppFocus) => void;
};

export const SkillsView = ({ focus, onFocusNavigate }: SkillsViewProps) => {
  const { progression, isLoading, error, createSkill, unlockSkill } = useProgressionSystem();
  const [selectedPrerequisiteIds, setSelectedPrerequisiteIds] = useState<string[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState("");
  const [activeFilter, setActiveFilter] = useState<SkillFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [skillActionError, setSkillActionError] = useState<string | null>(null);
  const [skillActionMessage, setSkillActionMessage] = useState<string | null>(null);
  const selectedSkill =
    progression.skills.find((skill) => skill.id === selectedSkillId) ??
    progression.skills.find((skill) => skill.id === focus?.id) ??
    progression.skills[0];
  const selectedMasterQuest = selectedSkill
    ? progression.masterQuests.find((masterQuest) => masterQuest.unlocksSkillId === selectedSkill.id)
    : undefined;
  const hasLockedPrerequisites = selectedSkill
    ? selectedSkill.prerequisiteSkillIds.some((id) => !progression.skills.find((skill) => skill.id === id)?.isUnlocked)
    : false;

  const { nodes, edges, visibleSkillCount } = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const directlyMatchedSkills = progression.skills.filter((skill) => {
      const matchesAttribute = activeFilter === "all" || skill.attribute === activeFilter;
      const matchesSearch =
        !normalizedSearch ||
        skill.title.toLowerCase().includes(normalizedSearch) ||
        skill.description.toLowerCase().includes(normalizedSearch);

      return matchesAttribute && matchesSearch;
    });
    const visibleSkillIds = new Set(directlyMatchedSkills.map((skill) => skill.id));
    if (focus?.id) {
      visibleSkillIds.add(focus.id);
    }

    directlyMatchedSkills.forEach((skill) => {
      skill.prerequisiteSkillIds.forEach((id) => visibleSkillIds.add(id));
      progression.skills
        .filter((candidate) => candidate.prerequisiteSkillIds.includes(skill.id))
        .forEach((candidate) => visibleSkillIds.add(candidate.id));
    });

    const depthBySkillId = new Map<string, number>();
    const getDepth = (skill: SkillNode): number => {
      if (depthBySkillId.has(skill.id)) {
        return depthBySkillId.get(skill.id) ?? 0;
      }

      const depth =
        skill.prerequisiteSkillIds.length === 0
          ? 0
          : 1 +
            Math.max(
              ...skill.prerequisiteSkillIds.map((id) => {
                const prerequisite = progression.skills.find((item) => item.id === id);
                return prerequisite ? getDepth(prerequisite) : 0;
              }),
            );
      depthBySkillId.set(skill.id, depth);
      return depth;
    };
    const rowByConstellationDepth = new Map<string, number>();
    const visibleSkills = progression.skills.filter((skill) => visibleSkillIds.has(skill.id));
    const treeNodes: Array<Node<SkillTreeNodeData>> = visibleSkills.map((skill) => {
      const depth = getDepth(skill);
      const constellationIndex = attributeOptions.findIndex((option) => option.value === skill.attribute);
      const rowKey = `${skill.attribute}-${depth}`;
      const row = rowByConstellationDepth.get(rowKey) ?? 0;
      rowByConstellationDepth.set(rowKey, row + 1);
      const masterQuest = progression.masterQuests.find((item) => item.unlocksSkillId === skill.id);

      return {
        id: skill.id,
        type: "skill",
        position: { x: depth * 340, y: constellationIndex * 320 + row * 188 },
        data: {
          skill,
          attributeLabel: attributeLabels[skill.attribute],
          masterQuestTitle: masterQuest?.title,
          hasLockedPrerequisites: skill.prerequisiteSkillIds.some(
            (id) => !progression.skills.find((item) => item.id === id)?.isUnlocked,
          ),
        },
      };
    });
    const treeEdges: Edge[] = visibleSkills.flatMap((skill) =>
      skill.prerequisiteSkillIds.map((prerequisiteId) => ({
        id: `${prerequisiteId}-${skill.id}`,
        source: prerequisiteId,
        target: skill.id,
        animated: skill.isUnlocked,
        className: skill.isUnlocked ? "skill-edge-unlocked" : "skill-edge",
      })).filter((edge) => visibleSkillIds.has(edge.source) && visibleSkillIds.has(edge.target)),
    );

    return { nodes: treeNodes, edges: treeEdges, visibleSkillCount: visibleSkills.length };
  }, [activeFilter, focus?.id, progression.masterQuests, progression.skills, searchTerm]);

  const togglePrerequisite = (skillId: string) => {
    setSelectedPrerequisiteIds((current) =>
      current.includes(skillId) ? current.filter((id) => id !== skillId) : [...current, skillId],
    );
  };

  const handleCreateSkill = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!title) {
      setSkillActionError("Dê um nome para a habilidade antes de registrar.");
      return;
    }

    setSkillActionError(null);
    setSkillActionMessage(null);

    try {
      await createSkill({
        title,
        description: description || "Habilidade real registrada para acompanhamento.",
        attribute: String(formData.get("attribute")) as Attribute,
        icon: String(formData.get("icon") ?? "") || undefined,
        prerequisiteSkillIds: selectedPrerequisiteIds,
      });
      setSelectedPrerequisiteIds([]);
      setIsCreatorOpen(false);
      setSkillActionMessage("Habilidade registrada na arvore.");
      event.currentTarget.reset();
    } catch (actionError) {
      setSkillActionError(
        actionError instanceof Error ? actionError.message : "Nao consegui registrar essa habilidade agora.",
      );
    }
  };

  const handleUnlockSkill = async () => {
    if (!selectedSkill) {
      return;
    }

    setSkillActionError(null);

    try {
      await unlockSkill(selectedSkill.id, { evidence });
      emitVisualEvent("skill-unlock");
      setEvidence("");
      setSkillActionMessage("Habilidade marcada como adquirida.");
    } catch (actionError) {
      setSkillActionError(
        actionError instanceof Error ? actionError.message : "Nao consegui atualizar essa habilidade agora.",
      );
    }
  };

  if (isLoading) {
    return <main className="loading">Carregando habilidades...</main>;
  }

  return (
    <div className="view-grid view-grid-wide">
      <section className="content-panel span-all">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Real skill tree</p>
            <h1>Arvore de habilidades</h1>
          </div>
          <button type="button" onClick={() => setIsCreatorOpen((current) => !current)}>
            {isCreatorOpen ? <X size={18} /> : <PlusCircle size={18} />}
            {isCreatorOpen ? "Fechar registro" : "Registrar habilidade"}
          </button>
        </div>
        {error && <div className="error-banner">{error}</div>}
        {skillActionError && <div className="error-banner">{skillActionError}</div>}
        {skillActionMessage && <div className="success-banner">{skillActionMessage}</div>}
        <div className="skill-constellation-toolbar">
          <div className="skill-search">
            <Search size={17} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar habilidade"
              aria-label="Buscar habilidade"
            />
          </div>
          <div className="constellation-tabs" aria-label="Filtrar constelacao">
            <button
              className={activeFilter === "all" ? "active" : ""}
              type="button"
              onClick={() => setActiveFilter("all")}
            >
              <GameIcon name="star-swirl" size={18} />
              Todas
              <span>{progression.skills.length}</span>
            </button>
            {attributeOptions.map((option) => (
              <button
                className={activeFilter === option.value ? "active" : ""}
                key={option.value}
                type="button"
                onClick={() => setActiveFilter(option.value)}
              >
                <GameIcon name={attributeGameIcons[option.value]} size={18} />
                {option.label}
                <span>{progression.skills.filter((skill) => skill.attribute === option.value).length}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="constellation-summary">
          {attributeOptions.map((option) => {
            const skills = progression.skills.filter((skill) => skill.attribute === option.value);
            const unlocked = skills.filter((skill) => skill.isUnlocked).length;

            return (
              <button
                className={[
                  "constellation-card",
                  `constellation-card-${option.value}`,
                  activeFilter === option.value ? "active" : "",
                ].join(" ")}
                key={option.value}
                type="button"
                onClick={() => setActiveFilter(option.value)}
              >
                <GameIcon name={attributeGameIcons[option.value]} size={28} />
                <span>{option.label}</span>
                <strong>
                  {unlocked}/{skills.length}
                </strong>
              </button>
            );
          })}
        </div>
        <div className="skill-constellation-legend">
          {attributeOptions.map((option) => {
            const skills = progression.skills.filter((skill) => skill.attribute === option.value);
            const unlocked = skills.filter((skill) => skill.isUnlocked).length;

            return (
              <button
                className={`skill-constellation-line skill-constellation-line-${option.value}`}
                key={option.value}
                type="button"
                onClick={() => setActiveFilter(option.value)}
              >
                <GameIcon name={attributeGameIcons[option.value]} size={22} />
                <div>
                  <strong>{option.label}</strong>
                  <span>
                    {unlocked}/{skills.length} adquiridas
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="skill-flow-shell">
          {progression.skills.length === 0 ? (
            <div className="empty-state">Registre a primeira habilidade real para iniciar sua arvore.</div>
          ) : visibleSkillCount === 0 ? (
            <div className="empty-state">Nenhuma habilidade encontrada nessa constelacao.</div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.35}
              maxZoom={1.4}
              nodesDraggable={false}
              onNodeClick={(_, node) => setSelectedSkillId(node.id)}
            >
              <Background color="rgba(125, 211, 252, 0.22)" gap={28} />
              <MiniMap pannable zoomable />
              <Controls />
            </ReactFlow>
          )}
        </div>
      </section>

      {isCreatorOpen && (
        <section className="content-panel skill-create-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Registro</p>
              <h2>Nova habilidade real</h2>
            </div>
          </div>
          <form className="stacked-form" onSubmit={handleCreateSkill}>
            <input name="title" required placeholder="Ex: conversar com desconhecidos" aria-label="Titulo da habilidade" />
            <textarea name="description" placeholder="Como essa habilidade aparece na vida real" aria-label="Descricao" />
            <select name="attribute" defaultValue={activeFilter === "all" ? "social" : activeFilter}>
              {attributeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="skill-icon-picker" aria-label="Icone da habilidade">
              {skillIconOptions.map((option) => (
                <label key={option.value}>
                  <input name="icon" type="radio" value={option.value} />
                  <span>
                    <GameIcon name={option.value} size={22} />
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
            <div className="check-list">
              {progression.skills.map((skill) => (
                <label key={skill.id}>
                  <input
                    type="checkbox"
                    checked={selectedPrerequisiteIds.includes(skill.id)}
                    onChange={() => togglePrerequisite(skill.id)}
                  />
                  <span>{skill.title}</span>
                </label>
              ))}
            </div>
            <button type="submit">Registrar habilidade</button>
          </form>
        </section>
      )}

      <section className="content-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Evidencia</p>
            <h2>Detalhe da habilidade</h2>
          </div>
        </div>
        {!selectedSkill ? (
          <div className="empty-state">Selecione um nodo da arvore.</div>
        ) : (
          <div className="skill-detail-panel">
            <div className="skill-detail-status">
              {selectedSkill.isUnlocked ? <CheckCircle2 size={18} /> : <Lock size={18} />}
              <strong>{selectedSkill.isUnlocked ? "Habilidade adquirida" : "Ainda em desenvolvimento"}</strong>
            </div>
            <div className={`skill-detail-emblem skill-detail-emblem-${selectedSkill.attribute}`}>
              <GameIcon name={getSkillIcon(selectedSkill)} size={42} />
            </div>
            <h3>{selectedSkill.title}</h3>
            <p>{selectedSkill.description}</p>
            <span>{attributeLabels[selectedSkill.attribute]}</span>
            {selectedMasterQuest && (
              <button
                type="button"
                onClick={() => onFocusNavigate?.("projects", { type: "masterQuest", id: selectedMasterQuest.id })}
              >
                Ver Missao Mestra: {selectedMasterQuest.title}
              </button>
            )}
            {selectedSkill.prerequisiteSkillIds.length > 0 && (
              <div className="skill-prereq-list">
                <strong>Pre-requisitos</strong>
                {selectedSkill.prerequisiteSkillIds.map((id) => {
                  const prerequisite = progression.skills.find((skill) => skill.id === id);
                  return (
                    <span key={id}>
                      {prerequisite?.isUnlocked ? "OK" : "Pendente"} - {prerequisite?.title ?? "Habilidade removida"}
                    </span>
                  );
                })}
              </div>
            )}
            {selectedSkill.evidence && <p className="muted-text">Evidencia: {selectedSkill.evidence}</p>}
            {!selectedSkill.isUnlocked && (
              <>
                <textarea
                  value={evidence}
                  onChange={(event) => setEvidence(event.target.value)}
                  placeholder="Que evidencia real mostra que voce adquiriu essa habilidade?"
                  aria-label="Evidencia da habilidade"
                />
                <button type="button" onClick={handleUnlockSkill} disabled={hasLockedPrerequisites}>
                  {hasLockedPrerequisites ? "Pre-requisitos pendentes" : "Marcar como adquirida"}
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
