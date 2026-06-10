const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

const getBearerToken = (request) => {
  const authorization = request.headers.authorization ?? "";
  const [scheme, token] = authorization.split(" ");

  return scheme?.toLowerCase() === "bearer" ? token : "";
};

const deleteSupabaseAuthUser = async (accessToken) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { ok: false, status: 501, error: "Exclusao de conta nao configurada no servidor." };
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    return { ok: false, status: 401, error: "Sessao invalida ou expirada." };
  }

  const userPayload = await userResponse.json();
  const userId = userPayload?.id;

  if (!userId) {
    return { ok: false, status: 401, error: "Usuario nao encontrado." };
  }

  const deleteResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!deleteResponse.ok) {
    return { ok: false, status: 502, error: "Nao foi possivel excluir o usuario no Supabase." };
  }

  return { ok: true };
};

export const createApiServer = ({ http, questSuggestionGateway, journeySuggestionGateway }) =>
  http.createServer(async (request, response) => {
    if (request.method === "OPTIONS") {
      sendJson(response, 204, {});
      return;
    }

    if (request.method !== "POST") {
      sendJson(response, 404, { error: "Rota nao encontrada." });
      return;
    }

    if (request.url === "/api/account/delete") {
      const token = getBearerToken(request);

      if (!token) {
        sendJson(response, 401, { error: "Sessao nao enviada." });
        return;
      }

      const result = await deleteSupabaseAuthUser(token);

      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.url === "/api/journey-suggestions") {
      try {
        const rawBody = await readBody(request);
        const body = rawBody ? JSON.parse(rawBody) : {};
        const journey = await journeySuggestionGateway.suggestJourney(body);

        sendJson(response, 200, { journey });
      } catch {
        sendJson(response, 400, { error: "Nao foi possivel gerar a jornada." });
      }
      return;
    }

    if (request.url !== "/api/quest-suggestions") {
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
