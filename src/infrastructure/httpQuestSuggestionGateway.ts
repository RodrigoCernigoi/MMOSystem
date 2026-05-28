import type { QuestSuggestionGateway } from "../application/ports";
import type { CreateQuestInput } from "../domain/task";

type SuggestionResponse = {
  quest: CreateQuestInput;
};

const getLocalSuggestion = (goal: string): CreateQuestInput => {
  const normalizedGoal = goal.trim() || "avancar em uma prioridade importante";
  const lowerGoal = normalizedGoal.toLowerCase();
  const attribute = lowerGoal.includes("trein") || lowerGoal.includes("academ")
    ? "strength"
    : lowerGoal.includes("estud") || lowerGoal.includes("ler") || lowerGoal.includes("program")
      ? "intelligence"
      : lowerGoal.includes("pessoa") || lowerGoal.includes("social")
        ? "social"
        : "discipline";

  return {
    title: `Avancar em: ${normalizedGoal}`,
    kind: "daily",
    attribute,
    difficulty: "normal",
    recurrence: "daily",
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  };
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export const createHttpQuestSuggestionGateway = (endpoint = `${apiBaseUrl}/api/quest-suggestions`): QuestSuggestionGateway => ({
  async suggestQuest(goal) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goal }),
      });

      if (!response.ok) {
        return getLocalSuggestion(goal);
      }

      const payload = (await response.json()) as SuggestionResponse;
      return payload.quest;
    } catch {
      return getLocalSuggestion(goal);
    }
  },
});
