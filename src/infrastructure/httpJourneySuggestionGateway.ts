import type { JourneyPlan, JourneyPrompt } from "../domain/journey";
import { generateLocalJourneyPlan } from "../domain/journey";

type JourneySuggestionResponse = {
  journey: JourneyPlan;
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export const suggestJourneyPlan = async (
  prompt: JourneyPrompt,
  endpoint = `${apiBaseUrl}/api/journey-suggestions`,
): Promise<JourneyPlan> => {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(prompt),
    });

    if (!response.ok) {
      return generateLocalJourneyPlan(prompt);
    }

    const payload = (await response.json()) as JourneySuggestionResponse;
    return payload.journey;
  } catch {
    return generateLocalJourneyPlan(prompt);
  }
};
