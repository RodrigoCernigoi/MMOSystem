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
  requiresEvidence?: boolean;
  evidenceLog?: QuestEvidence[];
  habitLog?: string[];
  lastRenewedAt?: string;
};

export type QuestEvidence = {
  id: string;
  text: string;
  createdAt: string;
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
  requiresEvidence?: boolean;
};

export type UpdateQuestInput = Partial<CreateQuestInput>;

export type CompleteQuestInput = {
  evidence?: string;
};
