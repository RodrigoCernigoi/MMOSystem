import type { MasterQuest, Project } from "./progressionSystem";
import type { Quest } from "./task";

export const calculateProjectProgress = (project: Project, quests: Quest[]): number => {
  const linkedQuestIds = new Set([
    ...project.questIds,
    ...quests.filter((quest) => quest.projectId === project.id).map((quest) => quest.id),
  ]);

  if (linkedQuestIds.size === 0) {
    return 0;
  }
  const completedCount = Array.from(linkedQuestIds).filter((questId) =>
    quests.some((quest) => quest.id === questId && quest.status === "completed"),
  ).length;

  return Math.round((completedCount / linkedQuestIds.size) * 100);
};

export const calculateMasterQuestProgress = (masterQuest: MasterQuest, projects: Project[]): number => {
  if (masterQuest.projectIds.length === 0) {
    return 0;
  }

  const completedCount = masterQuest.projectIds.filter((projectId) =>
    projects.some((project) => project.id === projectId && project.status === "completed"),
  ).length;

  return Math.round((completedCount / masterQuest.projectIds.length) * 100);
};
