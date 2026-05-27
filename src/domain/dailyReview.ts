import type { DailyHistoryEntry, DailyReview, Player, Rank } from "./player";
import { rankForLevel, xpRequiredForLevel } from "./progression";

export const getDailyReviewRank = (completedTotal: number): Rank => {
  if (completedTotal >= 8) {
    return "S";
  }

  if (completedTotal >= 5) {
    return "A";
  }

  if (completedTotal >= 3) {
    return "B";
  }

  if (completedTotal >= 1) {
    return "C";
  }

  return "E";
};

export const getDailyReviewBonus = (rank: Rank) => {
  const bonusByRank: Record<Rank, { xp: number; coins: number; skillPoints: number }> = {
    S: { xp: 120, coins: 40, skillPoints: 2 },
    A: { xp: 70, coins: 25, skillPoints: 1 },
    B: { xp: 35, coins: 12, skillPoints: 0 },
    C: { xp: 15, coins: 5, skillPoints: 0 },
    D: { xp: 0, coins: 0, skillPoints: 0 },
    E: { xp: 0, coins: 0, skillPoints: 0 },
  };

  return bonusByRank[rank];
};

export const applyDailyReviewBonus = (player: Player, review: DailyReview): Player => {
  let xp = player.xp + review.bonus.xp;
  let level = player.level;

  while (xp >= xpRequiredForLevel(level)) {
    xp -= xpRequiredForLevel(level);
    level += 1;
  }

  return {
    ...player,
    level,
    xp,
    totalXp: player.totalXp + review.bonus.xp,
    rank: rankForLevel(level),
    coins: player.coins + review.bonus.coins,
    skillPoints: player.skillPoints + review.bonus.skillPoints,
    dailyReviews: [review, ...player.dailyReviews.filter((entry) => entry.date !== review.date)].slice(0, 180),
  };
};

export const buildDailyReview = (
  id: string,
  date: string,
  history: DailyHistoryEntry | undefined,
  closedAt: string,
): DailyReview => {
  const completedQuestCount = history?.completedQuestIds.length ?? 0;
  const completedHabitCount = history?.completedHabitIds.length ?? 0;
  const rank = getDailyReviewRank(completedQuestCount + completedHabitCount);

  return {
    id,
    date,
    rank,
    completedQuestCount,
    completedHabitCount,
    xpEarned: history?.xpEarned ?? 0,
    coinsEarned: history?.coinsEarned ?? 0,
    bonus: getDailyReviewBonus(rank),
    closedAt,
  };
};
