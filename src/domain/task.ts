export type Attribute = "strength" | "intelligence" | "discipline" | "social" | "vitality";

export type TaskDifficulty = "easy" | "normal" | "hard" | "elite";

export type TaskStatus = "open" | "completed" | "failed" | "archived";

export type QuestKind = "single" | "daily" | "weekly" | "habit";

export type Recurrence = "none" | "daily" | "weekly";

export type Quest = {
  id: string;
  title: string;
  kind: QuestKind;
  attribute: Attribute;
  difficulty: TaskDifficulty;
  recurrence: Recurrence;
  status: TaskStatus;
  createdAt: string;
  dueAt?: string;
  completedAt?: string;
  failedAt?: string;
  projectId?: string;
  importance?: string;
  habitLog?: string[];
  lastRenewedAt?: string;
};

export type CreateQuestInput = {
  title: string;
  kind: QuestKind;
  attribute: Attribute;
  difficulty: TaskDifficulty;
  recurrence: Recurrence;
  dueAt?: string;
  projectId?: string;
  importance?: string;
};

export type UpdateQuestInput = Partial<CreateQuestInput>;
