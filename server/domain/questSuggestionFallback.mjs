const tomorrow = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const createFallbackQuestSuggestion = (goal) => {
  const normalizedGoal = goal.trim() || "avancar em uma prioridade importante";
  const lowerGoal = normalizedGoal.toLowerCase();
  const attribute =
    lowerGoal.includes("trein") || lowerGoal.includes("academ")
      ? "strength"
      : lowerGoal.includes("estud") || lowerGoal.includes("ler") || lowerGoal.includes("program")
        ? "intelligence"
        : lowerGoal.includes("pessoa") || lowerGoal.includes("social")
          ? "social"
          : lowerGoal.includes("saude") || lowerGoal.includes("sono")
            ? "vitality"
            : "discipline";

  return {
    title: `Avancar em: ${normalizedGoal}`,
    kind: "daily",
    attribute,
    difficulty: "normal",
    recurrence: "daily",
    dueAt: tomorrow(),
  };
};
