import type { QuestSuggestionGateway } from "../application/ports";
import type { CreateQuestInput } from "../domain/task";

type SuggestionResponse = {
  quest: CreateQuestInput;
};

export const createHttpQuestSuggestionGateway = (endpoint = "/api/quest-suggestions"): QuestSuggestionGateway => ({
  async suggestQuest(goal) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ goal }),
    });

    if (!response.ok) {
      throw new Error("Nao foi possivel gerar uma sugestao de missao.");
    }

    const payload = (await response.json()) as SuggestionResponse;
    return payload.quest;
  },
});
