import type { Quest, Weekday } from "./task";

export const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

export const weekdays: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export const weekdayLabels: Record<Weekday, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sab",
};

export const monthDays = Array.from({ length: 31 }, (_item, index) => index + 1);

export const isDifferentMonth = (left: Date, right: Date): boolean =>
  left.getFullYear() !== right.getFullYear() || left.getMonth() !== right.getMonth();

export const isQuestScheduledForDate = (quest: Quest, date = new Date()): boolean => {
  const weekday = date.getDay() as Weekday;
  const dayOfMonth = date.getDate();
  const rule = quest.recurrenceRule;

  if (quest.recurrence === "none") {
    return quest.dueAt === toDateKey(date);
  }

  if (quest.recurrence === "monthly") {
    return rule?.monthDays?.length ? rule.monthDays.includes(dayOfMonth) : true;
  }

  if (quest.recurrence === "daily" || quest.recurrence === "weekly") {
    return rule?.weekdays?.length ? rule.weekdays.includes(weekday) : true;
  }

  return true;
};

export const isQuestForToday = (quest: Quest, today = toDateKey(new Date())): boolean => {
  if (quest.status !== "open") {
    return false;
  }

  const todayDate = new Date(`${today}T00:00:00`);

  if (quest.kind === "habit" || quest.kind === "daily") {
    return isQuestScheduledForDate(quest, todayDate);
  }

  if (quest.recurrence !== "none") {
    return isQuestScheduledForDate(quest, todayDate);
  }

  return quest.dueAt === today;
};

export const isHabitDoneToday = (quest: Quest, today = toDateKey(new Date())): boolean =>
  (quest.habitLog ?? []).includes(today);

export const describeQuestSchedule = (quest: Quest): string | null => {
  if (quest.recurrence === "none") {
    return null;
  }

  if (quest.recurrence === "monthly") {
    return quest.recurrenceRule?.monthDays?.length
      ? `Mensal: dias ${quest.recurrenceRule.monthDays.join(", ")}`
      : "Mensal";
  }

  if (quest.recurrenceRule?.weekdays?.length) {
    return `${quest.recurrence === "daily" ? "Diaria" : "Semanal"}: ${quest.recurrenceRule.weekdays
      .map((day) => weekdayLabels[day])
      .join(", ")}`;
  }

  return quest.recurrence === "daily" ? "Diaria" : "Semanal";
};

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
