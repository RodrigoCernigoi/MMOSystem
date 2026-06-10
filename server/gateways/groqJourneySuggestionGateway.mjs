import { createFallbackJourneySuggestion } from "../domain/journeySuggestionFallback.mjs";
import { normalizeJourneySuggestion } from "../domain/journeySuggestionValidation.mjs";

const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";

const systemPrompt = `
Voce cria uma jornada para um sistema gamificado de tarefas da vida real.
Responda somente JSON valido, sem markdown.
Formato obrigatorio:
{
  "title": string,
  "summary": string,
  "quests": [{ "title": string, "kind": "single"|"daily"|"weekly"|"habit", "attribute": "strength"|"intelligence"|"discipline"|"social"|"vitality", "difficulty": "easy"|"normal"|"hard"|"elite", "recurrence": "none"|"daily"|"weekly"|"monthly", "recurrenceRule": { "weekdays"?: number[], "monthDays"?: number[] }, "importance": string, "requiresEvidence"?: boolean }],
  "projects": [{ "title": string, "description": string, "attribute": "...", "questTitleRefs": string[] }],
  "skills": [{ "title": string, "description": string, "attribute": "...", "icon": string, "prerequisiteSkillIds": [] }],
  "masterQuests": [{ "title": string, "description": string, "attribute": "...", "projectTitleRefs": string[], "skill": { "title": string, "description": string, "icon": string, "prerequisiteSkillIds": [] } }],
  "rewards": [{ "title": string, "description": string, "cost": number, "category": "leisure"|"rest"|"social"|"purchase"|"health"|"learning" }],
  "milestones": [{ "title": string, "description": string, "attribute": "..." }]
}
Use portugues brasileiro. Gere rotinas realistas, pequenas, revisaveis e sem fantasia desconectada da vida real.
`.trim();

export const createGroqJourneySuggestionGateway = ({
  apiKey = process.env.GROQ_API_KEY,
  model = process.env.GROQ_MODEL || "llama-3.1-8b-instant",
  fetchImpl = fetch,
} = {}) => ({
  async suggestJourney(prompt) {
    const fallback = createFallbackJourneySuggestion(prompt);

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
        temperature: 0.45,
        max_completion_tokens: 1800,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(prompt) },
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
      return normalizeJourneySuggestion(JSON.parse(content), fallback);
    } catch {
      return fallback;
    }
  },
});
