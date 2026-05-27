import type { Player } from "./player";
import type { Quest } from "./task";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  isUnlocked: (player: Player, quests: Quest[]) => boolean;
};

export const achievements: Achievement[] = [
  {
    id: "first-clear",
    title: "Primeiro clear",
    description: "Conclua sua primeira missao.",
    isUnlocked: (player) => player.completedQuestCount >= 1,
  },
  {
    id: "streak-7",
    title: "Rotina de 7",
    description: "Alcance 7 conclusoes em sequencia.",
    isUnlocked: (player) => player.streak >= 7,
  },
  {
    id: "rank-b-clear",
    title: "Acima da media",
    description: "Conclua uma missao rank B.",
    isUnlocked: (_player, quests) =>
      quests.some((quest) => quest.status === "completed" && quest.difficulty === "elite"),
  },
  {
    id: "intelligence-10",
    title: "Mente afiada",
    description: "Chegue a 10 pontos de inteligencia.",
    isUnlocked: (player) => player.attributes.intelligence >= 10,
  },
];

export const unlockAvailableAchievements = (player: Player, quests: Quest[]): Player => {
  const currentIds = new Set(player.unlockedAchievementIds ?? []);
  const nextIds = achievements
    .filter((achievement) => achievement.isUnlocked(player, quests))
    .map((achievement) => achievement.id);

  return {
    ...player,
    unlockedAchievementIds: Array.from(new Set([...currentIds, ...nextIds])),
  };
};
