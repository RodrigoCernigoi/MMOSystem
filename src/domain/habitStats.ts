import type { Quest } from "./task";

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

export const calculateHabitStreak = (quest: Quest, today = new Date()): number => {
  const log = new Set(quest.habitLog ?? []);
  let streak = 0;
  let cursor = today;

  while (log.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
};
