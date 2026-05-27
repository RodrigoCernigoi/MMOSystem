const allowedAttributes = ["strength", "intelligence", "discipline", "social", "vitality"];
const allowedDifficulties = ["easy", "normal", "hard", "elite"];
const allowedKinds = ["single", "daily", "weekly", "habit"];
const allowedRecurrences = ["none", "daily", "weekly"];

export const normalizeQuestSuggestion = (candidate, fallback) => ({
  title: typeof candidate.title === "string" && candidate.title.trim() ? candidate.title.trim() : fallback.title,
  kind: allowedKinds.includes(candidate.kind) ? candidate.kind : fallback.kind,
  attribute: allowedAttributes.includes(candidate.attribute) ? candidate.attribute : fallback.attribute,
  difficulty: allowedDifficulties.includes(candidate.difficulty) ? candidate.difficulty : fallback.difficulty,
  recurrence: allowedRecurrences.includes(candidate.recurrence) ? candidate.recurrence : fallback.recurrence,
  dueAt: typeof candidate.dueAt === "string" && candidate.dueAt.trim() ? candidate.dueAt.trim() : fallback.dueAt,
});
