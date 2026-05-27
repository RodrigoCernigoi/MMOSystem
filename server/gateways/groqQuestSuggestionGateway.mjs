import { createFallbackQuestSuggestion } from "../domain/questSuggestionFallback.mjs";
import { normalizeQuestSuggestion } from "../domain/questSuggestionValidation.mjs";

const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";

const systemPrompt = `
Voce cria uma unica quest para um sistema gamificado de tarefas inspirado em RPG.
Responda somente JSON valido, sem markdown.
Campos obrigatorios:
title: string curta em pt-BR
kind: "single" | "daily" | "weekly" | "habit"
attribute: "strength" | "intelligence" | "discipline" | "social" | "vitality"
difficulty: "easy" | "normal" | "hard" | "elite"
recurrence: "none" | "daily" | "weekly"
dueAt: data no formato YYYY-MM-DD, ou string vazia para habito sem prazo
`.trim();

export const createGroqQuestSuggestionGateway = ({
  apiKey = process.env.GROQ_API_KEY,
  model = process.env.GROQ_MODEL || "llama-3.1-8b-instant",
  fetchImpl = fetch,
} = {}) => ({
  async suggestQuest(goal) {
    const fallback = createFallbackQuestSuggestion(goal);

    if (!apiKey) {
      return fallback;
    }

    const response = await fetchImpl(groqEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_completion_tokens: 240,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Objetivo do usuario: ${goal}` },
        ],
      }),
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      return fallback;
    }

    try {
      return normalizeQuestSuggestion(JSON.parse(content), fallback);
    } catch {
      return fallback;
    }
  },
});
