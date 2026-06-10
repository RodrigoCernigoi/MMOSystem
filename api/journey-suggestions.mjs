import { createGroqJourneySuggestionGateway } from "../server/gateways/groqJourneySuggestionGateway.mjs";

const gateway = createGroqJourneySuggestionGateway();

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "Metodo nao permitido." });
    return;
  }

  try {
    const journey = await gateway.suggestJourney(request.body ?? {});
    response.status(200).json({ journey });
  } catch {
    response.status(400).json({ error: "Nao foi possivel gerar a jornada." });
  }
}
