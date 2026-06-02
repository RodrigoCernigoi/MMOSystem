import type { Player, Rank } from "./player";
import type { Quest, QuestKind, TaskDifficulty } from "./task";

export type QuestReward = {
  xp: number;
  coins: number;
  attributePoints: number;
};

const rewardByDifficulty: Record<TaskDifficulty, QuestReward> = {
  easy: { xp: 22, coins: 4, attributePoints: 1 },
  normal: { xp: 45, coins: 8, attributePoints: 2 },
  hard: { xp: 82, coins: 16, attributePoints: 3 },
  elite: { xp: 140, coins: 32, attributePoints: 5 },
};

const kindMultiplier: Record<QuestKind, number> = {
  single: 1,
  daily: 1,
  weekly: 1.25,
  habit: 0.65,
};

const rankThresholds: Array<{ rank: Rank; minLevel: number }> = [
  { rank: "S", minLevel: 50 },
  { rank: "A", minLevel: 35 },
  { rank: "B", minLevel: 24 },
  { rank: "C", minLevel: 15 },
  { rank: "D", minLevel: 8 },
  { rank: "E", minLevel: 1 },
];

export const getRewardForQuest = (quest: Quest, streak: number): QuestReward => {
  const baseReward = rewardByDifficulty[quest.difficulty];
  const streakMultiplier = Math.min(1.25, 1 + Math.floor(streak / 3) * 0.05);
  const multiplier = kindMultiplier[quest.kind] * streakMultiplier;

  return {
    xp: Math.round(baseReward.xp * multiplier),
    coins: Math.round(baseReward.coins * multiplier),
    attributePoints: baseReward.attributePoints,
  };
};

export const xpRequiredForLevel = (level: number): number => 100 + (level - 1) * 35;

export const rankForLevel = (level: number): Rank =>
  rankThresholds.find((entry) => level >= entry.minLevel)?.rank ?? "E";

export const applyQuestReward = (player: Player, quest: Quest): Player => {
  const reward = getRewardForQuest(quest, player.streak);
  let xp = player.xp + reward.xp;
  let level = player.level;

  while (xp >= xpRequiredForLevel(level)) {
    xp -= xpRequiredForLevel(level);
    level += 1;
  }

  return {
    ...player,
    level,
    xp,
    totalXp: (player.totalXp ?? 0) + reward.xp,
    rank: rankForLevel(level),
    coins: player.coins + reward.coins,
    streak: player.streak + 1,
    completedQuestCount: (player.completedQuestCount ?? 0) + 1,
    attributes: {
      ...player.attributes,
      [quest.attribute]: player.attributes[quest.attribute] + reward.attributePoints,
    },
  };
};

export const applyQuestFailure = (player: Player, quest: Quest): Player => {
  if (quest.kind === "habit") {
    return player;
  }

  return {
    ...player,
    coins: Math.max(0, player.coins - rewardByDifficulty[quest.difficulty].coins),
    streak: 0,
  };
};
