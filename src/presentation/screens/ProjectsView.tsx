import { motion } from "motion/react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { CalendarCheck2, CheckCircle2, Flag, GitBranch, Milestone, Sparkles, Target, Trophy } from "lucide-react";
import type { Attribute } from "../../domain/task";
import { calculateMasterQuestProgress, calculateProjectProgress } from "../../domain/progressionProgress";
import type {
  CreateMasterQuestInput,
  CreateProjectInput,
  MasterQuest,
  Project,
} from "../../domain/progressionSystem";
import type { AppView } from "../navigation/appViews";
import type { AppFocus, CreateQuestIntent } from "../navigation/navigationIntent";
import { attributeOptions, attributeLabels } from "../viewModels";
import { useProgressionSystem } from "../useProgressionSystem";
import { CollapsiblePanel } from "../components/CollapsiblePanel";
import { SkillUnlockToast } from "../components/SkillUnlockToast";
import { Tabs } from "../components/Tabs";
import { cardMotion } from "../motion/transitions";
import { emitVisualEvent } from "../visualPreferences";

type ProjectsViewProps = {
  focus?: Extract<AppFocus, { type: "project" | "masterQuest" }> | null;
  onCreateQuestIntent?: (intent: CreateQuestIntent) => void;
  onFocusNavigate?: (view: AppView, focus: AppFocus) => void;
};

export const ProjectsView = ({ focus, onCreateQuestIntent, onFocusNavigate }: ProjectsViewProps) => {
  const {
    progression,
    quests,
    isLoading,
    error,
    createProject,
    createMasterQuest,
    updateProject,
    archiveProject,
    deleteProject,
    updateMasterQuest,
    archiveMasterQuest,
    completeMasterQuest,
    deleteMasterQuest,
  } = useProgressionSystem();
  const [selectedQuestIds, setSelectedQuestIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedSkillPrereqIds, setSelectedSkillPrereqIds] = useState<string[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingProjectQuestIds, setEditingProjectQuestIds] = useState<string[]>([]);
  const [editingMasterQuest, setEditingMasterQuest] = useState<MasterQuest | null>(null);
  const [editingMasterQuestProjectIds, setEditingMasterQuestProjectIds] = useState<string[]>([]);
  const [unlockedSkillTitle, setUnlockedSkillTitle] = useState<string | null>(null);
  const [isProjectCreatorOpen, setIsProjectCreatorOpen] = useState(false);
  const [isMasterQuestCreatorOpen, setIsMasterQuestCreatorOpen] = useState(false);
  const [activeListTab, setActiveListTab] = useState<"projects" | "masters" | "timeline" | "bosses">("projects");
  const previousUnlockedSkillIds = useRef<Set<string> | null>(null);
  const focusedProjectRef = useRef<HTMLDivElement | null>(null);
  const focusedMasterQuestRef = useRef<HTMLDivElement | null>(null);

  const openQuests = quests.filter((quest) => quest.status !== "archived");
  const activeProjects = progression.projects.filter((project) => project.status !== "archived");
  const skillById = new Map(progression.skills.map((skill) => [skill.id, skill]));
  const campaignStats = {
    activeProjects: progression.projects.filter((project) => project.status === "active").length,
    completedProjects: progression.projects.filter((project) => project.status === "completed").length,
    activeMasters: progression.masterQuests.filter((masterQuest) => masterQuest.status === "active").length,
    unlockedSkills: progression.skills.filter((skill) => skill.isUnlocked).length,
  };
  const timelineItems = [
    ...progression.projects
      .filter((project) => project.completedAt)
      .map((project) => ({
        id: `project-${project.id}`,
        date: project.completedAt ?? project.createdAt,
        label: "Projeto finalizado",
        title: project.title,
        detail: attributeLabels[project.attribute],
        focus: { view: "projects" as AppView, focus: { type: "project" as const, id: project.id } },
      })),
    ...progression.masterQuests
      .filter((masterQuest) => masterQuest.completedAt)
      .map((masterQuest) => ({
        id: `master-${masterQuest.id}`,
        date: masterQuest.completedAt ?? masterQuest.createdAt,
        label: "Missao Mestra",
        title: masterQuest.title,
        detail: skillById.get(masterQuest.unlocksSkillId)?.title ?? "Skill associada",
        focus: { view: "projects" as AppView, focus: { type: "masterQuest" as const, id: masterQuest.id } },
      })),
    ...progression.skills
      .filter((skill) => skill.unlockedAt)
      .map((skill) => ({
        id: `skill-${skill.id}`,
        date: skill.unlockedAt ?? "",
        label: "Skill registrada",
        title: skill.title,
        detail: skill.evidence || attributeLabels[skill.attribute],
        focus: { view: "skills" as AppView, focus: { type: "skill" as const, id: skill.id } },
      })),
  ]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 10);

  useEffect(() => {
    const unlockedSkills = progression.skills.filter((skill) => skill.isUnlocked);
    const currentIds = new Set(unlockedSkills.map((skill) => skill.id));

    if (!previousUnlockedSkillIds.current) {
      previousUnlockedSkillIds.current = currentIds;
      return;
    }

    const newSkill = unlockedSkills.find((skill) => !previousUnlockedSkillIds.current?.has(skill.id));
    previousUnlockedSkillIds.current = currentIds;

    if (newSkill) {
      setUnlockedSkillTitle(newSkill.title);
      emitVisualEvent("skill-unlock");
      const timeoutId = window.setTimeout(() => setUnlockedSkillTitle(null), 3200);
      return () => window.clearTimeout(timeoutId);
    }
  }, [progression.skills]);

  useEffect(() => {
    if (focus?.type === "project") {
      focusedProjectRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (focus?.type === "masterQuest") {
      focusedMasterQuestRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focus]);

  const toggleValue = (value: string, values: string[], setValues: (next: string[]) => void) => {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const input: CreateProjectInput = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      attribute: String(formData.get("attribute")) as Attribute,
      questIds: selectedQuestIds,
    };

    await createProject(input);
    setSelectedQuestIds([]);
    setIsProjectCreatorOpen(false);
    event.currentTarget.reset();
  };

  const handleCreateMasterQuest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const input: CreateMasterQuestInput = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      attribute: String(formData.get("attribute")) as Attribute,
      projectIds: selectedProjectIds,
      skill: {
        title: String(formData.get("skillTitle") ?? ""),
        description: String(formData.get("skillDescription") ?? ""),
        prerequisiteSkillIds: selectedSkillPrereqIds,
      },
      boss: {
        name: String(formData.get("bossName") ?? ""),
        archetype: String(formData.get("bossArchetype") ?? ""),
        maxHp: Number(formData.get("bossHp") ?? 100),
      },
    };

    await createMasterQuest(input);
    setSelectedProjectIds([]);
    setSelectedSkillPrereqIds([]);
    setIsMasterQuestCreatorOpen(false);
    event.currentTarget.reset();
  };

  const startEditingProject = (project: Project) => {
    setEditingMasterQuest(null);
    setEditingProject(project);
    setEditingProjectQuestIds(project.questIds);
  };

  const startEditingMasterQuest = (masterQuest: MasterQuest) => {
    setEditingProject(null);
    setEditingMasterQuest(masterQuest);
    setEditingMasterQuestProjectIds(masterQuest.projectIds);
  };

  const handleUpdateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingProject) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    await updateProject(editingProject.id, {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      attribute: String(formData.get("attribute")) as Attribute,
      questIds: editingProjectQuestIds,
    });
    setEditingProject(null);
    setEditingProjectQuestIds([]);
  };

  const handleUpdateMasterQuest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingMasterQuest) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    await updateMasterQuest(editingMasterQuest.id, {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      attribute: String(formData.get("attribute")) as Attribute,
      projectIds: editingMasterQuestProjectIds,
    });
    setEditingMasterQuest(null);
    setEditingMasterQuestProjectIds([]);
  };

  const handleCompleteMasterQuest = async (id: string) => {
    await completeMasterQuest(id);
    emitVisualEvent("skill-unlock");
  };

  if (isLoading) {
    return <main className="loading">Carregando projetos...</main>;
  }

  return (
    <div className="view-grid view-grid-wide">
      <SkillUnlockToast skillTitle={unlockedSkillTitle} />
      <section className="campaign-hero span-all">
        <div>
          <p className="eyebrow">Campanhas reais</p>
          <h1>Projetos, metas e habilidades no mesmo mapa</h1>
          <p>
            Use projetos como arcos de pratica, Missoes Mestras como marcos manuais e skills como registros do que voce
            realmente desenvolveu.
          </p>
        </div>
        <div className="campaign-stat-grid" aria-label="Resumo das campanhas">
          <div>
            <Flag size={18} />
            <span>Projetos ativos</span>
            <strong>{campaignStats.activeProjects}</strong>
          </div>
          <div>
            <CheckCircle2 size={18} />
            <span>Finalizados</span>
            <strong>{campaignStats.completedProjects}</strong>
          </div>
          <div>
            <Target size={18} />
            <span>Metas mestras</span>
            <strong>{campaignStats.activeMasters}</strong>
          </div>
          <div>
            <Sparkles size={18} />
            <span>Skills reais</span>
            <strong>{campaignStats.unlockedSkills}</strong>
          </div>
        </div>
      </section>

      <section className="content-panel">
        {error && <div className="error-banner">{error}</div>}
        <CollapsiblePanel
          eyebrow="Real life arcs"
          title="Criar projeto"
          isOpen={isProjectCreatorOpen}
          onToggle={() => setIsProjectCreatorOpen((current) => !current)}
        >
          <form className="campaign-forge-form" onSubmit={handleCreateProject}>
            <div className="forge-visual-card">
              <GitBranch size={24} />
              <div>
                <span>Arco de pratica</span>
                <strong>{selectedQuestIds.length} missoes vinculadas</strong>
              </div>
            </div>
            <div className="forge-field-grid">
              <input name="title" placeholder="Ex: melhorar vida social" aria-label="Titulo do projeto" />
              <select name="attribute" defaultValue="discipline" aria-label="Atributo do projeto">
                {attributeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <textarea name="description" placeholder="Qual realidade esse projeto quer construir?" aria-label="Descricao do projeto" />
            <div className="forge-picker">
              <div>
                <p className="eyebrow">Missoes do arco</p>
                <strong>Escolha as tarefas que provam avanco real</strong>
              </div>
              <div className="check-list visual-check-list">
                {openQuests.map((quest) => (
                  <label key={quest.id}>
                    <input
                      type="checkbox"
                      checked={selectedQuestIds.includes(quest.id)}
                      onChange={() => toggleValue(quest.id, selectedQuestIds, setSelectedQuestIds)}
                    />
                    <span>{quest.title}</span>
                  </label>
                ))}
              </div>
            </div>
            <button type="submit">Criar projeto</button>
          </form>
        </CollapsiblePanel>
      </section>

      <section className="content-panel">
        <CollapsiblePanel
          eyebrow="Master quests"
          title="Criar Missao Mestra"
          isOpen={isMasterQuestCreatorOpen}
          onToggle={() => setIsMasterQuestCreatorOpen((current) => !current)}
        >
          <form className="campaign-forge-form master-forge-form" onSubmit={handleCreateMasterQuest}>
          <div className="forge-visual-card master-visual-card">
            <Trophy size={24} />
            <div>
              <span>Meta de constelacao</span>
              <strong>Conclusao manual, recompensa real</strong>
            </div>
          </div>
          <div className="forge-field-grid">
            <input name="title" placeholder="Ex: construir uma vida social ativa" aria-label="Titulo da missao mestra" />
            <select name="attribute" defaultValue="social" aria-label="Atributo da missao mestra">
              {attributeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <textarea name="description" placeholder="Meta real que representa uma virada de fase" aria-label="Descricao" />
          <div className="forge-field-grid">
            <input name="skillTitle" placeholder="Habilidade desbloqueada" aria-label="Titulo da habilidade" />
            <input name="bossName" placeholder="Resistencia opcional. Ex: Procrastinacao" aria-label="Nome do boss" />
          </div>
          <textarea name="skillDescription" placeholder="O que essa habilidade representa na vida real" aria-label="Descricao da habilidade" />
          <div className="forge-field-grid">
            <input name="bossArchetype" placeholder="Arquetipo. Ex: resistencia ao inicio" aria-label="Arquetipo do boss" />
            <input name="bossHp" type="number" min="10" defaultValue="100" aria-label="HP do boss" />
          </div>
          <div className="forge-picker">
            <div>
              <p className="eyebrow">Pre-requisitos</p>
              <strong>Skills que sustentam essa nova habilidade</strong>
            </div>
            <div className="check-list visual-check-list">
              {progression.skills.map((skill) => (
                <label key={skill.id}>
                  <input
                    type="checkbox"
                    checked={selectedSkillPrereqIds.includes(skill.id)}
                    onChange={() => toggleValue(skill.id, selectedSkillPrereqIds, setSelectedSkillPrereqIds)}
                  />
                  <span>{skill.title}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="forge-picker">
            <div>
              <p className="eyebrow">Projetos relacionados</p>
              <strong>Contexto que alimenta a meta, sem concluir por ela</strong>
            </div>
            <div className="check-list visual-check-list">
              {activeProjects.map((project) => (
                <label key={project.id}>
                  <input
                    type="checkbox"
                    checked={selectedProjectIds.includes(project.id)}
                    onChange={() => toggleValue(project.id, selectedProjectIds, setSelectedProjectIds)}
                  />
                  <span>{project.title}</span>
                </label>
              ))}
            </div>
          </div>
            <button type="submit">Criar missao mestra</button>
          </form>
        </CollapsiblePanel>
      </section>

      <section className="content-panel span-all">
        {editingProject && (
          <form className="edit-quest-form edit-progression-form" onSubmit={handleUpdateProject}>
            <input name="title" defaultValue={editingProject.title} aria-label="Titulo do projeto" />
            <textarea name="description" defaultValue={editingProject.description} aria-label="Descricao do projeto" />
            <select name="attribute" defaultValue={editingProject.attribute}>
              {attributeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="check-list">
              {openQuests.map((quest) => (
                <label key={quest.id}>
                  <input
                    type="checkbox"
                    checked={editingProjectQuestIds.includes(quest.id)}
                    onChange={() => toggleValue(quest.id, editingProjectQuestIds, setEditingProjectQuestIds)}
                  />
                  <span>{quest.title}</span>
                </label>
              ))}
            </div>
            <button type="submit">Salvar projeto</button>
            <button type="button" onClick={() => setEditingProject(null)}>
              Cancelar
            </button>
          </form>
        )}

        {editingMasterQuest && (
          <form className="edit-quest-form edit-progression-form" onSubmit={handleUpdateMasterQuest}>
            <input name="title" defaultValue={editingMasterQuest.title} aria-label="Titulo da missao mestra" />
            <textarea
              name="description"
              defaultValue={editingMasterQuest.description}
              aria-label="Descricao da missao mestra"
            />
            <select name="attribute" defaultValue={editingMasterQuest.attribute}>
              {attributeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="check-list">
              {activeProjects.map((project) => (
                <label key={project.id}>
                  <input
                    type="checkbox"
                    checked={editingMasterQuestProjectIds.includes(project.id)}
                    onChange={() =>
                      toggleValue(project.id, editingMasterQuestProjectIds, setEditingMasterQuestProjectIds)
                    }
                  />
                  <span>{project.title}</span>
                </label>
              ))}
            </div>
            <button type="submit">Salvar missao mestra</button>
            <button type="button" onClick={() => setEditingMasterQuest(null)}>
              Cancelar
            </button>
          </form>
        )}

        <Tabs
          activeId={activeListTab}
          onChange={setActiveListTab}
          items={[
            { id: "projects", label: "Projetos", indicator: progression.projects.length },
            { id: "masters", label: "Mestras", indicator: progression.masterQuests.length },
            { id: "timeline", label: "Timeline", indicator: timelineItems.length },
            { id: "bosses", label: "Bosses", indicator: progression.bosses.length },
          ]}
        >
        {activeListTab === "projects" && (
        <div className="progression-section">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">Habito em construcao</p>
              <h2>Projetos</h2>
            </div>
          </div>
          <div className="progression-list campaign-list">
            {progression.projects.map((project) => {
              const progress = calculateProjectProgress(project, quests);
              const linkedQuests = quests.filter(
                (quest) => project.questIds.includes(quest.id) || quest.projectId === project.id,
              );
              const completedLinkedQuests = linkedQuests.filter((quest) => quest.status === "completed").length;
              const nextQuests = linkedQuests.filter((quest) => quest.status === "open").slice(0, 3);

              return (
              <motion.article
                className={focus?.type === "project" && focus.id === project.id ? "progression-card campaign-card focused-card" : "progression-card campaign-card"}
                key={project.id}
                layout
                ref={focus?.type === "project" && focus.id === project.id ? focusedProjectRef : undefined}
                {...cardMotion}
              >
                <div className="campaign-card-topline">
                  <span>{attributeLabels[project.attribute]}</span>
                  <strong>{progress}%</strong>
                </div>
                <strong>{project.title}</strong>
                <p>{project.description || "Projeto em construcao, aguardando uma descricao de realidade desejada."}</p>
                <div className="mini-track">
                  <div style={{ width: `${progress}%` }} />
                </div>
                <div className="campaign-card-metrics">
                  <span>
                    <CheckCircle2 size={14} />
                    {completedLinkedQuests}/{linkedQuests.length || 0} missoes
                  </span>
                  <span>
                    <CalendarCheck2 size={14} />
                    {project.status === "completed" ? "Finalizado" : "Em andamento"}
                  </span>
                </div>
                <div className="next-quest-stack">
                  <p className="eyebrow">Proximos passos</p>
                  {nextQuests.length === 0 ? (
                    <span className="muted-text">Crie uma missao vinculada para dar tracao ao arco.</span>
                  ) : (
                    nextQuests.map((quest) => <span key={quest.id}>{quest.title}</span>)
                  )}
                </div>
                <div className="inline-actions">
                  <button
                    type="button"
                    onClick={() =>
                      onCreateQuestIntent?.({
                        projectId: project.id,
                        attribute: project.attribute,
                        kind: "single",
                        recurrence: "none",
                        difficulty: "normal",
                        importance: `Avancar no projeto: ${project.title}`,
                      })
                    }
                  >
                    Criar missao vinculada
                  </button>
                  <button type="button" onClick={() => startEditingProject(project)}>
                    Editar
                  </button>
                  <button type="button" onClick={() => archiveProject(project.id)}>
                    Arquivar
                  </button>
                  <button type="button" className="danger-button" onClick={() => deleteProject(project.id)}>
                    Excluir
                  </button>
                </div>
              </motion.article>
              );
            })}
          </div>
        </div>
        )}

        {activeListTab === "masters" && (
        <div className="progression-section">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">Constelacao de perks</p>
              <h2>Missoes Mestras</h2>
            </div>
          </div>
          <div className="progression-list campaign-list">
          {progression.masterQuests.map((masterQuest) => {
            const linkedSkill = skillById.get(masterQuest.unlocksSkillId);
            const progress = calculateMasterQuestProgress(masterQuest, progression.projects);
            const linkedProjects = progression.projects.filter((project) => masterQuest.projectIds.includes(project.id));

            return (
            <motion.article
              className={focus?.type === "masterQuest" && focus.id === masterQuest.id ? "progression-card master-quest-card focused-card" : "progression-card master-quest-card"}
              key={masterQuest.id}
              layout
              ref={focus?.type === "masterQuest" && focus.id === masterQuest.id ? focusedMasterQuestRef : undefined}
              {...cardMotion}
            >
              <div className="campaign-card-topline">
                <span>{attributeLabels[masterQuest.attribute]}</span>
                <strong>{masterQuest.status === "completed" ? "Concluida" : "Meta ativa"}</strong>
              </div>
              <strong>{masterQuest.title}</strong>
              <p>{masterQuest.description}</p>
              <div className="master-perk-panel">
                <Sparkles size={18} />
                <div>
                  <span>Skill associada</span>
                  <strong>{linkedSkill?.title ?? "Habilidade vinculada"}</strong>
                  <p>{linkedSkill?.description ?? "Essa meta libera uma habilidade registrada na arvore."}</p>
                </div>
              </div>
              <div className="mini-track">
                <div style={{ width: `${progress}%` }} />
              </div>
              <div className="linked-project-row">
                {linkedProjects.length === 0 ? (
                  <span className="muted-text">Sem projetos relacionados.</span>
                ) : (
                  linkedProjects.map((project) => (
                    <button
                      type="button"
                      key={project.id}
                      onClick={() => onFocusNavigate?.("projects", { type: "project", id: project.id })}
                    >
                      {project.title}
                    </button>
                  ))
                )}
              </div>
              <div className="inline-actions">
                <button
                  type="button"
                  onClick={() => onFocusNavigate?.("skills", { type: "skill", id: masterQuest.unlocksSkillId })}
                >
                  Ver skill
                </button>
                <button type="button" onClick={() => startEditingMasterQuest(masterQuest)}>
                  Editar
                </button>
                {masterQuest.status === "active" && (
                  <button type="button" onClick={() => handleCompleteMasterQuest(masterQuest.id)}>
                    Concluir meta
                  </button>
                )}
                <button type="button" onClick={() => archiveMasterQuest(masterQuest.id)}>
                  Arquivar
                </button>
                <button type="button" className="danger-button" onClick={() => deleteMasterQuest(masterQuest.id)}>
                  Excluir
                </button>
              </div>
            </motion.article>
            );
          })}
          </div>
        </div>
        )}

        {activeListTab === "timeline" && (
        <div className="progression-section">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">Historico de marco</p>
              <h2>Timeline</h2>
            </div>
          </div>
          <div className="campaign-timeline">
            {timelineItems.length === 0 ? (
              <article className="timeline-empty-state">
                <Milestone size={24} />
                <strong>Nenhum marco registrado ainda</strong>
                <p>Projetos finalizados, Missoes Mestras concluidas e skills desbloqueadas aparecem aqui.</p>
              </article>
            ) : (
              timelineItems.map((item) => (
                <button
                  className="timeline-item"
                  type="button"
                  key={item.id}
                  onClick={() => onFocusNavigate?.(item.focus.view, item.focus.focus)}
                >
                  <Milestone size={18} />
                  <span>{new Date(item.date).toLocaleDateString("pt-BR")}</span>
                  <strong>{item.title}</strong>
                  <p>{item.label} - {item.detail}</p>
                </button>
              ))
            )}
          </div>
        </div>
        )}

        {activeListTab === "bosses" && (
        <div className="progression-section">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">Arquétipos internos</p>
              <h2>Bosses</h2>
            </div>
          </div>
          <div className="progression-list">
          {progression.bosses.map((boss) => (
            <motion.article
              className={boss.status === "defeated" ? "boss-card boss-card-defeated" : "boss-card"}
              key={boss.id}
              layout
              {...cardMotion}
            >
              <span>{boss.archetype}</span>
              <strong>{boss.name}</strong>
              <p>{boss.status === "defeated" ? "Derrotado" : `${boss.currentHp}/${boss.maxHp} HP`}</p>
              <div className="boss-track">
                <div style={{ width: `${(boss.currentHp / boss.maxHp) * 100}%` }} />
              </div>
            </motion.article>
          ))}
          </div>
        </div>
        )}
        </Tabs>
      </section>
    </div>
  );
};
