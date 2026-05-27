import { motion } from "motion/react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { Attribute } from "../../domain/task";
import { calculateProjectProgress } from "../../domain/progressionProgress";
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
  const [activeListTab, setActiveListTab] = useState<"projects" | "masters" | "bosses">("projects");
  const previousUnlockedSkillIds = useRef<Set<string> | null>(null);
  const focusedProjectRef = useRef<HTMLDivElement | null>(null);
  const focusedMasterQuestRef = useRef<HTMLDivElement | null>(null);

  const openQuests = quests.filter((quest) => quest.status !== "archived");
  const activeProjects = progression.projects.filter((project) => project.status !== "archived");

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
      <section className="content-panel">
        {error && <div className="error-banner">{error}</div>}
        <CollapsiblePanel
          eyebrow="Real life arcs"
          title="Criar projeto"
          isOpen={isProjectCreatorOpen}
          onToggle={() => setIsProjectCreatorOpen((current) => !current)}
        >
          <form className="stacked-form" onSubmit={handleCreateProject}>
            <input name="title" placeholder="Ex: melhorar vida social" aria-label="Titulo do projeto" />
            <textarea name="description" placeholder="Descricao curta" aria-label="Descricao do projeto" />
            <select name="attribute" defaultValue="discipline">
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
                    checked={selectedQuestIds.includes(quest.id)}
                    onChange={() => toggleValue(quest.id, selectedQuestIds, setSelectedQuestIds)}
                  />
                  <span>{quest.title}</span>
                </label>
              ))}
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
          <form className="stacked-form" onSubmit={handleCreateMasterQuest}>
          <input name="title" placeholder="Ex: construir uma vida social ativa" aria-label="Titulo da missao mestra" />
          <textarea name="description" placeholder="Meta real que representa uma virada de fase" aria-label="Descricao" />
          <select name="attribute" defaultValue="social">
            {attributeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input name="skillTitle" placeholder="Habilidade desbloqueada" aria-label="Titulo da habilidade" />
          <textarea name="skillDescription" placeholder="O que essa habilidade representa na vida real" aria-label="Descricao da habilidade" />
          <div className="check-list">
            {progression.skills.map((skill) => (
              <label key={skill.id}>
                <input
                  type="checkbox"
                  checked={selectedSkillPrereqIds.includes(skill.id)}
                  onChange={() => toggleValue(skill.id, selectedSkillPrereqIds, setSelectedSkillPrereqIds)}
                />
                <span>Pre-requisito: {skill.title}</span>
              </label>
            ))}
          </div>
          <input name="bossName" placeholder="Boss psicologico opcional. Ex: Procrastinacao" aria-label="Nome do boss" />
          <input name="bossArchetype" placeholder="Arquetipo. Ex: resistencia ao inicio" aria-label="Arquetipo do boss" />
          <input name="bossHp" type="number" min="10" defaultValue="100" aria-label="HP do boss" />
          <div className="check-list">
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
          <div className="progression-list">
            {progression.projects.map((project) => (
              <motion.article
                className={focus?.type === "project" && focus.id === project.id ? "progression-card focused-card" : "progression-card"}
                key={project.id}
                layout
                ref={focus?.type === "project" && focus.id === project.id ? focusedProjectRef : undefined}
                {...cardMotion}
              >
                <span>{attributeLabels[project.attribute]}</span>
                <strong>{project.title}</strong>
                <p>{project.description}</p>
                <div className="mini-track">
                  <div style={{ width: `${calculateProjectProgress(project, quests)}%` }} />
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
            ))}
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
          <div className="progression-list">
          {progression.masterQuests.map((masterQuest) => (
            <motion.article
              className={focus?.type === "masterQuest" && focus.id === masterQuest.id ? "progression-card focused-card" : "progression-card"}
              key={masterQuest.id}
              layout
              ref={focus?.type === "masterQuest" && focus.id === masterQuest.id ? focusedMasterQuestRef : undefined}
              {...cardMotion}
            >
              <span>{attributeLabels[masterQuest.attribute]}</span>
              <strong>{masterQuest.title}</strong>
              <p>{masterQuest.description}</p>
              <p className="muted-text">Perk associado: {masterQuest.unlocksSkillId ? "habilidade vinculada" : "sem perk"}</p>
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
          ))}
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
