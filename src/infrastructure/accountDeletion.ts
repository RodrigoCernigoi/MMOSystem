import { clearLocalBackupData } from "./dataBackup";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

type DeleteAccountResult = {
  mode: "local" | "supabase";
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

const parseErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || "Nao foi possivel excluir a conta.";
  } catch {
    return "Nao foi possivel excluir a conta.";
  }
};

export const deleteCurrentAccount = async (): Promise<DeleteAccountResult> => {
  if (!isSupabaseConfigured || !supabase) {
    clearLocalBackupData();
    return { mode: "local" };
  }

  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.access_token) {
    throw error ?? new Error("Sessao nao encontrada.");
  }

  const response = await fetch(`${apiBaseUrl}/api/account/delete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  clearLocalBackupData();

  try {
    await supabase.auth.signOut();
  } catch {
    // The auth user may already be gone. Local data was cleared above.
  }

  return { mode: "supabase" };
};
