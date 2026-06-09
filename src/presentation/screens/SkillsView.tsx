import "@xyflow/react/dist/style.css";
import { Background, Controls, Handle, MiniMap, Position, ReactFlow, type Edge, type Node } from "@xyflow/react";
import { FormEvent, memo, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Edit3, Lock, PlusCircle, Search, X } from "lucide-react";
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

const skillTemplates: Array<{
  title: string;
  description: string;
  attribute: Attribute;
  icon: string;
}> = [
  {
    title: "Treino de consistencia",
    description: "Manter um ritual pequeno mesmo em dias comuns, sem depender de motivacao alta.",
    attribute: "discipline",
    icon: "check-mark",
  },
  {
    title: "Estudo profundo",
    description: "Conseguir estudar com foco, registrar duvidas e transformar pratica em aprendizado.",
    attribute: "intelligence",
    icon: "brain",
  },
  {
    title: "Energia fisica basica",
    description: "Cuidar de sono, movimento e recuperacao para sustentar a rotina real.",
    attribute: "vitality",
    icon: "health-normal",
  },
  {
    title: "Conversas iniciadas",
    description: "Abrir interacoes sociais simples com mais naturalidade e menos evitacao.",
    attribute: "social",
    icon: "join",
  },
  {
    title: "Forca funcional",
    description: "Executar treinos ou pratica corporal com tecnica e progressao consciente.",
    attribute: "strength",
    icon: "weight-scale",
  },
];

const emptySkillDraft = {
  title: "",
  description: "",
  attribute: "social" as Attribute,
  icon: "",
};

type SkillTreeNodeData = {
  skill: SkillNode;
  attributeLabel: string;
  masterQuestTitle?: string;
  hasLockedPrerequisites: boolean;
  isSelected: boolean;
};

const SkillTreeNode = memo(({ data }: { data: SkillTreeNodeData }) => (
  <article
    className={[
      "flow-skill-node",
      `flow-skill-node-${data.skill.attribute}`,
      data.skill.isUnlocked ? "flow-skill-node-unlocked" : "",
      data.hasLockedPrerequisites ? "flow-skill-node-locked" : "",
      data.isSelected ? "flow-skill-node-selected" : "",
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
      <span>{data.skill.isUnlocked ? "Adquirida" : data.hasLockedPrerequisites ? "Bloqueada" : "Em desenvolvimento"}</span>
      {data.masterQuestTitle && <span>{data.masterQuestTitle}</span>}
    </div>
    {data.skill.prerequisiteSkillIds.length > 0 && (
      <div className="flow-skill-prereq-count">
        {data.skill.prerequisiteSkillIds.length} pre-requisito{data.skill.prerequisiteSkillIds.length > 1 ? "s" : ""}
      </div>
    )}
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
  const { progression, isLoading, error, createSkill, updateSkill, unlockSkill } = useProgressionSystem();
  const [selectedPrerequisiteIds, setSelectedPrerequisiteIds] = useState<string[]>([]);
  const [editPrerequisiteIds, setEditPrerequisiteIds] = useState<string[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState("");
  const [activeFilter, setActiveFilter] = useState<SkillFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isEditingSkill, setIsEditingSkill] = useState(false);
  const [skillDraft, setSkillDraft] = useState(emptySkillDraft);
  const [editDraft, setEditDraft] = useState(emptySkillDraft);
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

  useEffect(() => {
    if (!selectedSkill) {
      setIsEditingSkill(false);
      return;
    }

    setEditDraft({
      title: selectedSkill.title,
      description: selectedSkill.description,
      attribute: selectedSkill.attribute,
      icon: selectedSkill.icon ?? "",
    });
    setEditPrerequisiteIds(selectedSkill.prerequisiteSkillIds);
  }, [selectedSkill]);

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
          isSelected: selectedSkillId === skill.id || focus?.id === skill.id,
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
  }, [activeFilter, focus?.id, progression.masterQuests, progression.skills, searchTerm, selectedSkillId]);

  const togglePrerequisite = (skillId: string) => {
    setSelectedPrerequisiteIds((current) =>
      current.includes(skillId) ? current.filter((id) => id !== skillId) : [...current, skillId],
    );
  };

  const toggleEditPrerequisite = (skillId: string) => {
    setEditPrerequisiteIds((current) =>
      current.includes(skillId) ? current.filter((id) => id !== skillId) : [...current, skillId],
    );
  };

  const applySkillTemplate = (template: (typeof skillTemplates)[number]) => {
    setSkillDraft(template);
    setActiveFilter(template.attribute);
  };

  const handleCreateSkill = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = skillDraft.title.trim();
    const description = skillDraft.description.trim();

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
        attribute: skillDraft.attribute,
        icon: skillDraft.icon || undefined,
        prerequisiteSkillIds: selectedPrerequisiteIds,
      });
      setSelectedPrerequisiteIds([]);
      setSkillDraft(emptySkillDraft);
      setIsCreatorOpen(false);
      setSkillActionMessage("Habilidade registrada na arvore.");
    } catch (actionError) {
      setSkillActionError(
        actionError instanceof Error ? actionError.message : "Nao consegui registrar essa habilidade agora.",
      );
    }
  };

  const handleUpdateSkill = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSkill) {
      return;
    }

    const title = editDraft.title.trim();

    if (!title) {
      setSkillActionError("Dê um nome para a habilidade antes de salvar.");
      return;
    }

    setSkillActionError(null);
    setSkillActionMessage(null);

    try {
      await updateSkill(selectedSkill.id, {
        title,
        description: editDraft.description.trim() || "Habilidade real registrada para acompanhamento.",
        attribute: editDraft.attribute,
        icon: editDraft.icon || undefined,
        prerequisiteSkillIds: editPrerequisiteIds,
      });
      setIsEditingSkill(false);
      setSkillActionMessage("Habilidade atualizada.");
    } catch (actionError) {
      setSkillActionError(
        actionError instanceof Error ? actionError.message : "Nao consegui atualizar essa habilidade agora.",
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
          <div className="skill-flow-legend">
            <span className="done">Adquirida</span>
            <span className="open">Em desenvolvimento</span>
            <span className="locked">Bloqueada</span>
          </div>
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
        <div className="skill-create-backdrop" role="presentation">
          <section className="content-panel skill-create-panel" aria-label="Criar habilidade">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Registro</p>
                <h2>Nova habilidade real</h2>
              </div>
              <button type="button" className="secondary-button" onClick={() => setIsCreatorOpen(false)}>
                <X size={16} />
                Fechar
              </button>
            </div>
            <form className="stacked-form" onSubmit={handleCreateSkill}>
              <div className="skill-template-strip">
                {skillTemplates.map((template) => (
                  <button type="button" key={template.title} onClick={() => applySkillTemplate(template)}>
                    <GameIcon name={template.icon} size={22} />
                    <span>{template.title}</span>
                  </button>
                ))}
              </div>
              <input
                name="title"
                required
                value={skillDraft.title}
                onChange={(event) => setSkillDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Ex: conversar com desconhecidos"
                aria-label="Titulo da habilidade"
              />
              <textarea
                name="description"
                value={skillDraft.description}
                onChange={(event) => setSkillDraft((current) => ({ ...current, description: event.target.value }))}
                placeholder="Como essa habilidade aparece na vida real"
                aria-label="Descricao"
              />
              <select
                name="attribute"
                value={skillDraft.attribute}
                onChange={(event) => setSkillDraft((current) => ({ ...current, attribute: event.target.value as Attribute }))}
              >
                {attributeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="skill-icon-picker" aria-label="Icone da habilidade">
                {skillIconOptions.map((option) => (
                  <label key={option.value}>
                    <input
                      name="icon"
                      type="radio"
                      value={option.value}
                      checked={skillDraft.icon === option.value}
                      onChange={() => setSkillDraft((current) => ({ ...current, icon: option.value }))}
                    />
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
        </div>
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
            <button className="secondary-button" type="button" onClick={() => setIsEditingSkill((current) => !current)}>
              {isEditingSkill ? <X size={16} /> : <Edit3 size={16} />}
              {isEditingSkill ? "Fechar edicao" : "Editar habilidade"}
            </button>
            {isEditingSkill ? (
              <form className="stacked-form skill-edit-form" onSubmit={handleUpdateSkill}>
                <input
                  value={editDraft.title}
                  onChange={(event) => setEditDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Titulo da habilidade"
                  aria-label="Titulo da habilidade"
                />
                <textarea
                  value={editDraft.description}
                  onChange={(event) => setEditDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Descricao real da habilidade"
                  aria-label="Descricao da habilidade"
                />
                <select
                  value={editDraft.attribute}
                  onChange={(event) => setEditDraft((current) => ({ ...current, attribute: event.target.value as Attribute }))}
                >
                  {attributeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="skill-icon-picker" aria-label="Icone da habilidade">
                  {skillIconOptions.map((option) => (
                    <label key={option.value}>
                      <input
                        name="editIcon"
                        type="radio"
                        value={option.value}
                        checked={editDraft.icon === option.value}
                        onChange={() => setEditDraft((current) => ({ ...current, icon: option.value }))}
                      />
                      <span>
                        <GameIcon name={option.value} size={22} />
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="check-list">
                  {progression.skills
                    .filter((skill) => skill.id !== selectedSkill.id)
                    .map((skill) => (
                      <label key={skill.id}>
                        <input
                          type="checkbox"
                          checked={editPrerequisiteIds.includes(skill.id)}
                          onChange={() => toggleEditPrerequisite(skill.id)}
                        />
                        <span>{skill.title}</span>
                      </label>
                    ))}
                </div>
                <button type="submit">Salvar habilidade</button>
              </form>
            ) : (
              <>
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
                        <button
                          className={prerequisite?.isUnlocked ? "skill-prereq-chip done" : "skill-prereq-chip pending"}
                          key={id}
                          type="button"
                          onClick={() => prerequisite && setSelectedSkillId(prerequisite.id)}
                        >
                          {prerequisite ? <GameIcon name={getSkillIcon(prerequisite)} size={18} /> : <Lock size={16} />}
                          <span>{prerequisite?.isUnlocked ? "OK" : "Pendente"}</span>
                          <strong>{prerequisite?.title ?? "Habilidade removida"}</strong>
                        </button>
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
                      {hasLockedPrerequisites ? "Pre-requisitos pendentes" : "Registrar evidencia e adquirir"}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
