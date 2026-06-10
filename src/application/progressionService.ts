import {
  createEmptyProgressionSystem,
  type CreateJourneyInput,
  type CreateSkillInput,
  type CreateMasterQuestInput,
  type CreateProjectInput,
  type MasterQuest,
  type Project,
  type ProgressionSystem,
  type SkillNode,
  type UnlockSkillInput,
  type UpdateMasterQuestInput,
  type UpdateProjectInput,
  type UpdateSkillInput,
} from "../domain/progressionSystem";
import { calculateProjectProgress } from "../domain/progressionProgress";
import type { Quest } from "../domain/task";
import type { Clock, IdProvider, ProgressionRepository, QuestRepository } from "./ports";

export type ProgressionService = ReturnType<typeof createProgressionService>;

type ProgressionServiceDependencies = {
  progressionRepository: ProgressionRepository;
  questRepository: QuestRepository;
  idProvider: IdProvider;
  clock: Clock;
};

export const createProgressionService = ({
  progressionRepository,
  questRepository,
  idProvider,
  clock,
}: ProgressionServiceDependencies) => ({
  async getProgression(): Promise<{ progression: ProgressionSystem; quests: Quest[] }> {
    const [progression, quests] = await Promise.all([progressionRepository.get(), questRepository.list()]);
    const updatedProgression = autoResolveProgression(progression, quests, clock.now().toISOString());

    if (updatedProgression !== progression) {
      await progressionRepository.save(updatedProgression);
    }

    return { progression: updatedProgression, quests };
  },

  async createJourney(input: CreateJourneyInput) {
    const progression = await progressionRepository.get();
    const journey = {
      id: idProvider.createId(),
      title: input.title.trim(),
      summary: input.summary.trim(),
      status: "active" as const,
      questIds: input.questIds,
      projectIds: input.projectIds,
      skillIds: input.skillIds,
      masterQuestIds: input.masterQuestIds,
      rewardIds: input.rewardIds,
      milestones: input.milestones,
      createdAt: clock.now().toISOString(),
    };

    if (!journey.title) {
      throw new Error("Journey title is required.");
    }

    await progressionRepository.save({
      ...progression,
      journeys: [journey, ...(progression.journeys ?? [])],
    });

    return journey;
  },

  async archiveJourney(journeyId: string): Promise<void> {
    const progression = await progressionRepository.get();
    await progressionRepository.save({
      ...progression,
      journeys: (progression.journeys ?? []).map((journey) =>
        journey.id === journeyId
          ? { ...journey, status: "archived" as const, archivedAt: clock.now().toISOString() }
          : journey,
      ),
    });
  },

  async completeJourney(journeyId: string): Promise<void> {
    const progression = await progressionRepository.get();
    await progressionRepository.save({
      ...progression,
      journeys: (progression.journeys ?? []).map((journey) =>
        journey.id === journeyId
          ? { ...journey, status: "completed" as const, completedAt: clock.now().toISOString() }
          : journey,
      ),
    });
  },

  async createProject(input: CreateProjectInput): Promise<Project> {
    const progression = await progressionRepository.get();
    const project: Project = {
      id: idProvider.createId(),
      title: input.title.trim(),
      description: input.description.trim(),
      attribute: input.attribute,
      status: "active",
      questIds: input.questIds,
      createdAt: clock.now().toISOString(),
    };

    if (!project.title) {
      throw new Error("Project title is required.");
    }

    await progressionRepository.save({
      ...progression,
      projects: [project, ...progression.projects],
    });

    return project;
  },

  async createMasterQuest(input: CreateMasterQuestInput): Promise<MasterQuest> {
    const progression = await progressionRepository.get();
    const skill: SkillNode = {
      id: idProvider.createId(),
      title: input.skill.title.trim(),
      description: input.skill.description.trim(),
      attribute: input.attribute,
      icon: input.skill.icon,
      prerequisiteSkillIds: input.skill.prerequisiteSkillIds ?? [],
      isUnlocked: false,
    };
    const masterQuest: MasterQuest = {
      id: idProvider.createId(),
      title: input.title.trim(),
      description: input.description.trim(),
      attribute: input.attribute,
      status: "active",
      projectIds: input.projectIds,
      unlocksSkillId: skill.id,
      createdAt: clock.now().toISOString(),
    };
    const boss = input.boss?.name
      ? {
          id: idProvider.createId(),
          name: input.boss.name.trim(),
          archetype: input.boss.archetype.trim() || "Resistencia interna",
          linkedMasterQuestId: masterQuest.id,
          maxHp: Math.max(10, input.boss.maxHp || 100),
          currentHp: Math.max(10, input.boss.maxHp || 100),
          status: "active" as const,
          createdAt: clock.now().toISOString(),
        }
      : null;

    if (!masterQuest.title || !skill.title) {
      throw new Error("Master quest and skill titles are required.");
    }

    await progressionRepository.save({
      ...progression,
      masterQuests: [masterQuest, ...progression.masterQuests],
      skills: [skill, ...progression.skills],
      bosses: boss ? [boss, ...progression.bosses] : progression.bosses,
    });

    return masterQuest;
  },

  async createSkill(input: CreateSkillInput): Promise<SkillNode> {
    const progression = await progressionRepository.get();
    const skill: SkillNode = {
      id: idProvider.createId(),
      title: input.title.trim(),
      description: input.description.trim(),
      attribute: input.attribute,
      icon: input.icon,
      prerequisiteSkillIds: input.prerequisiteSkillIds,
      isUnlocked: false,
    };

    if (!skill.title) {
      throw new Error("Skill title is required.");
    }

    await progressionRepository.save({
      ...progression,
      skills: [skill, ...progression.skills],
    });

    return skill;
  },

  async updateSkill(skillId: string, input: UpdateSkillInput): Promise<SkillNode> {
    const progression = await progressionRepository.get();
    const skill = progression.skills.find((item) => item.id === skillId);

    if (!skill) {
      throw new Error("Skill not found.");
    }

    const updatedSkill: SkillNode = {
      ...skill,
      ...input,
      title: input.title === undefined ? skill.title : input.title.trim(),
      description: input.description === undefined ? skill.description : input.description.trim(),
      prerequisiteSkillIds: (input.prerequisiteSkillIds ?? skill.prerequisiteSkillIds).filter((id) => id !== skillId),
      icon: input.icon === undefined ? skill.icon : input.icon || undefined,
    };

    if (!updatedSkill.title) {
      throw new Error("Skill title is required.");
    }

    await progressionRepository.save({
      ...progression,
      skills: progression.skills.map((item) => (item.id === skillId ? updatedSkill : item)),
    });

    return updatedSkill;
  },

  async updateProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
    const progression = await progressionRepository.get();
    const project = progression.projects.find((item) => item.id === projectId);

    if (!project) {
      throw new Error("Project not found.");
    }

    const updatedProject: Project = {
      ...project,
      ...input,
      title: input.title === undefined ? project.title : input.title.trim(),
      description: input.description === undefined ? project.description : input.description.trim(),
      questIds: input.questIds ?? project.questIds,
    };

    await progressionRepository.save({
      ...progression,
      projects: progression.projects.map((item) => (item.id === projectId ? updatedProject : item)),
    });

    return updatedProject;
  },

  async archiveProject(projectId: string): Promise<void> {
    const progression = await progressionRepository.get();
    await progressionRepository.save({
      ...progression,
      projects: progression.projects.map((item) =>
        item.id === projectId ? { ...item, status: "archived" as const } : item,
      ),
    });
  },

  async deleteProject(projectId: string): Promise<void> {
    const progression = await progressionRepository.get();
    await progressionRepository.save({
      ...progression,
      projects: progression.projects.filter((item) => item.id !== projectId),
      masterQuests: progression.masterQuests.map((masterQuest) => ({
        ...masterQuest,
        projectIds: masterQuest.projectIds.filter((id) => id !== projectId),
      })),
    });
  },

  async updateMasterQuest(masterQuestId: string, input: UpdateMasterQuestInput): Promise<MasterQuest> {
    const progression = await progressionRepository.get();
    const masterQuest = progression.masterQuests.find((item) => item.id === masterQuestId);

    if (!masterQuest) {
      throw new Error("Master quest not found.");
    }

    const updatedMasterQuest: MasterQuest = {
      ...masterQuest,
      ...input,
      title: input.title === undefined ? masterQuest.title : input.title.trim(),
      description: input.description === undefined ? masterQuest.description : input.description.trim(),
      projectIds: input.projectIds ?? masterQuest.projectIds,
    };

    await progressionRepository.save({
      ...progression,
      masterQuests: progression.masterQuests.map((item) =>
        item.id === masterQuestId ? updatedMasterQuest : item,
      ),
    });

    return updatedMasterQuest;
  },

  async archiveMasterQuest(masterQuestId: string): Promise<void> {
    const progression = await progressionRepository.get();
    await progressionRepository.save({
      ...progression,
      masterQuests: progression.masterQuests.map((item) =>
        item.id === masterQuestId ? { ...item, status: "archived" as const } : item,
      ),
      bosses: progression.bosses.map((boss) =>
        boss.linkedMasterQuestId === masterQuestId ? { ...boss, status: "archived" as const } : boss,
      ),
    });
  },

  async completeMasterQuest(masterQuestId: string): Promise<MasterQuest> {
    const progression = await progressionRepository.get();
    const masterQuest = progression.masterQuests.find((item) => item.id === masterQuestId);

    if (!masterQuest) {
      throw new Error("Master quest not found.");
    }

    const completedAt = clock.now().toISOString();
    const completedMasterQuest: MasterQuest = {
      ...masterQuest,
      status: "completed",
      completedAt,
    };

    await progressionRepository.save({
      ...progression,
      masterQuests: progression.masterQuests.map((item) =>
        item.id === masterQuestId ? completedMasterQuest : item,
      ),
      skills: resolveUnlockableSkills(
        progression.skills.map((skill) =>
          skill.id === masterQuest.unlocksSkillId ? { ...skill, evidence: masterQuest.title } : skill,
        ),
        progression.masterQuests.map((item) => (item.id === masterQuestId ? completedMasterQuest : item)),
        completedAt,
      ),
    });

    return completedMasterQuest;
  },

  async unlockSkill(skillId: string, input: UnlockSkillInput): Promise<SkillNode> {
    const progression = await progressionRepository.get();
    const skill = progression.skills.find((item) => item.id === skillId);

    if (!skill) {
      throw new Error("Skill not found.");
    }

    if (skill.isUnlocked) {
      return skill;
    }

    if (!arePrerequisitesUnlocked(skill, progression.skills)) {
      throw new Error("Skill prerequisites are not unlocked yet.");
    }

    const evidence = input.evidence.trim();

    if (!evidence) {
      throw new Error("Skill evidence is required.");
    }

    const unlockedSkill = {
      ...skill,
      evidence,
      isUnlocked: true,
      unlockedAt: clock.now().toISOString(),
    };

    await progressionRepository.save({
      ...progression,
      skills: progression.skills.map((item) => (item.id === skillId ? unlockedSkill : item)),
    });

    return unlockedSkill;
  },

  async deleteMasterQuest(masterQuestId: string): Promise<void> {
    const progression = await progressionRepository.get();
    const masterQuest = progression.masterQuests.find((item) => item.id === masterQuestId);

    await progressionRepository.save({
      ...progression,
      masterQuests: progression.masterQuests.filter((item) => item.id !== masterQuestId),
      skills: masterQuest
        ? progression.skills.filter((skill) => skill.id !== masterQuest.unlocksSkillId)
        : progression.skills,
      bosses: progression.bosses.filter((boss) => boss.linkedMasterQuestId !== masterQuestId),
    });
  },
});

const autoResolveProgression = (
  progression: ProgressionSystem,
  quests: Quest[],
  completedAt: string,
): ProgressionSystem => {
  let changed = false;
  const projects = progression.projects.map((project) => {
    if (project.status !== "active" || calculateProjectProgress(project, quests) < 100) {
      return project;
    }

    changed = true;
    return { ...project, status: "completed" as const, completedAt };
  });

  const masterQuests = progression.masterQuests;
  const skills = resolveUnlockableSkills(progression.skills, masterQuests, completedAt);
  const skillsChanged = skills.some((skill, index) => skill !== progression.skills[index]);

  return changed || skillsChanged ? { ...progression, projects, skills } : progression;
};

const arePrerequisitesUnlocked = (skill: SkillNode, skills: SkillNode[]) =>
  (skill.prerequisiteSkillIds ?? []).every((skillId) => skills.find((item) => item.id === skillId)?.isUnlocked);

const resolveUnlockableSkills = (skills: SkillNode[], masterQuests: MasterQuest[], unlockedAt: string): SkillNode[] => {
  let changed = false;
  let nextSkills = skills;
  let keepResolving = true;

  while (keepResolving) {
    keepResolving = false;
    nextSkills = nextSkills.map((skill) => {
      if (skill.isUnlocked || !arePrerequisitesUnlocked(skill, nextSkills)) {
        return skill;
      }

      const linkedMasterQuest = masterQuests.find((masterQuest) => masterQuest.unlocksSkillId === skill.id);

      if (!linkedMasterQuest || linkedMasterQuest.status !== "completed") {
        return skill;
      }

      changed = true;
      keepResolving = true;
      return {
        ...skill,
        isUnlocked: true,
        unlockedAt,
        evidence: skill.evidence ?? linkedMasterQuest.title,
      };
    });
  }

  return changed ? nextSkills : skills;
};
