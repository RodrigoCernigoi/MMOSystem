const sendJson = (response, statusCode, payload) => {
  response.status(statusCode).json(payload);
};

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

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Metodo nao permitido." });
    return;
  }

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
}
