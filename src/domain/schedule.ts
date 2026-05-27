import type { Quest } from "./task";

export const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

export const isQuestForToday = (quest: Quest, today = toDateKey(new Date())): boolean => {
  if (quest.status !== "open") {
    return false;
  }

  if (quest.kind === "habit" || quest.kind === "daily") {
    return true;
  }

  return quest.dueAt === today;
};

export const isHabitDoneToday = (quest: Quest, today = toDateKey(new Date())): boolean =>
  (quest.habitLog ?? []).includes(today);

export const getWeekDays = (baseDate = new Date()): string[] => {
  const start = new Date(baseDate);
  const day = start.getDay();
  start.setDate(start.getDate() - day);

  return Array.from({ length: 7 }, (_item, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return toDateKey(date);
  });
};
