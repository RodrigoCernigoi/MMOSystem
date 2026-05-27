import type { Attribute, QuestKind, Recurrence, TaskDifficulty } from "../../domain/task";

export type CreateQuestIntent = {
  title?: string;
  kind?: QuestKind;
  attribute?: Attribute;
  difficulty?: TaskDifficulty;
  recurrence?: Recurrence;
  dueAt?: string;
  projectId?: string;
  importance?: string;
};

export type AppFocus =
  | { type: "project"; id: string }
  | { type: "skill"; id: string }
  | { type: "masterQuest"; id: string };
