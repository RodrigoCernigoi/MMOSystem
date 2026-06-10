import http from "node:http";
import { createApiServer } from "./http/createApiServer.mjs";
import { createGroqJourneySuggestionGateway } from "./gateways/groqJourneySuggestionGateway.mjs";
import { createGroqQuestSuggestionGateway } from "./gateways/groqQuestSuggestionGateway.mjs";

const port = Number(process.env.API_PORT || 8787);
const hasGroqKey = Boolean(process.env.GROQ_API_KEY);

const server = createApiServer({
  http,
  questSuggestionGateway: createGroqQuestSuggestionGateway(),
  journeySuggestionGateway: createGroqJourneySuggestionGateway(),
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Porta ${port} ja esta em uso. Defina API_PORT para outra porta ou encerre o processo antigo.`);
    process.exit(1);
  }

  throw error;
});

server.listen(port, () => {
  const mode = hasGroqKey ? "Groq" : "fallback local";
  console.log(`MMO System API listening on http://localhost:${port} (${mode})`);
});
