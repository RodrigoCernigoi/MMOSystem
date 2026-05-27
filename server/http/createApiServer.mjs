const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });
  response.end(JSON.stringify(payload));
};

const readBody = (request) =>
  new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 64_000) {
        reject(new Error("Payload muito grande."));
        request.destroy();
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });

export const createApiServer = ({ http, questSuggestionGateway }) =>
  http.createServer(async (request, response) => {
    if (request.method === "OPTIONS") {
      sendJson(response, 204, {});
      return;
    }

    if (request.method !== "POST" || request.url !== "/api/quest-suggestions") {
      sendJson(response, 404, { error: "Rota nao encontrada." });
      return;
    }

    try {
      const rawBody = await readBody(request);
      const body = rawBody ? JSON.parse(rawBody) : {};
      const goal = typeof body.goal === "string" ? body.goal : "";
      const quest = await questSuggestionGateway.suggestQuest(goal);

      sendJson(response, 200, { quest });
    } catch {
      sendJson(response, 400, { error: "Nao foi possivel gerar a sugestao." });
    }
  });
