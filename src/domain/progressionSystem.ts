import type { Attribute } from "./task";

export type ProjectStatus = "active" | "completed" | "archived";

export type Project = {
  id: string;
  title: string;
  description: string;
  attribute: Attribute;
  status: ProjectStatus;
  questIds: string[];
  createdAt: string;
  completedAt?: string;
};

export type MasterQuest = {
  id: string;
  title: string;
  description: string;
  attribute: Attribute;
  status: ProjectStatus;
  projectIds: string[];
  unlocksSkillId: string;
  createdAt: string;
  completedAt?: string;
};

export type SkillNode = {
  id: string;
  title: string;
  description: string;
  attribute: Attribute;
  icon?: string;
  prerequisiteSkillIds: string[];
  evidence?: string;
  isUnlocked: boolean;
  unlockedAt?: string;
};

export type BossStatus = "active" | "defeated" | "archived";

export type BossEncounter = {
  id: string;
  name: string;
  archetype: string;
  linkedMasterQuestId: string;
  maxHp: number;
  currentHp: number;
  status: BossStatus;
  createdAt: string;
  defeatedAt?: string;
};

export type ProgressionSystem = {
  projects: Project[];
  masterQuests: MasterQuest[];
  skills: SkillNode[];
  bosses: BossEncounter[];
};

export type CreateProjectInput = {
  title: string;
  description: string;
  attribute: Attribute;
  questIds: string[];
};

export type CreateMasterQuestInput = {
  title: string;
  description: string;
  attribute: Attribute;
  projectIds: string[];
  skill: {
    title: string;
    description: string;
    icon?: string;
    prerequisiteSkillIds?: string[];
  };
  boss?: {
    name: string;
    archetype: string;
    maxHp: number;
  };
};

export type CreateSkillInput = {
  title: string;
  description: string;
  attribute: Attribute;
  icon?: string;
  prerequisiteSkillIds: string[];
};

export type UnlockSkillInput = {
  evidence: string;
};

export const createEmptyProgressionSystem = (): ProgressionSystem => ({
  projects: [],
  masterQuests: [],
  skills: [],
  bosses: [],
});

export type UpdateProjectInput = Partial<CreateProjectInput>;
export type UpdateMasterQuestInput = Partial<CreateMasterQuestInput>;
