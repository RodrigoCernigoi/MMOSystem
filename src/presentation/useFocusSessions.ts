import { useCallback, useEffect, useState } from "react";
import type { FocusSession } from "../domain/focusSession";
import { isSupabaseConfigured, supabase } from "../infrastructure/supabaseClient";

const focusSessionsKey = "mmo-system:focus-sessions";

const readSessions = (): FocusSession[] => {
  const raw = localStorage.getItem(focusSessionsKey);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as FocusSession[];
  } catch {
    return [];
  }
};

const writeSessions = (sessions: FocusSession[]) => {
  localStorage.setItem(focusSessionsKey, JSON.stringify(sessions.slice(0, 240)));
};

const getSupabaseSessions = async () => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.from("profiles").select("focus_sessions").maybeSingle();

  if (error) {
    throw error;
  }

  return (data?.focus_sessions ?? []) as FocusSession[];
};

const writeSupabaseSessions = async (sessions: FocusSession[]) => {
  if (!supabase) {
    return;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw userError ?? new Error("Usuario nao autenticado.");
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userData.user.id, focus_sessions: sessions.slice(0, 240), updated_at: new Date().toISOString() });

  if (error) {
    throw error;
  }
};

export const useFocusSessions = () => {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSessions = async () => {
      try {
        const nextSessions = isSupabaseConfigured ? await getSupabaseSessions() : readSessions();

        if (isMounted) {
          setSessions(nextSessions);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setSessions(readSessions());
          setError(loadError instanceof Error ? loadError.message : "Erro ao carregar sessoes de foco.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSessions();

    return () => {
      isMounted = false;
    };
  }, []);

  const addSession = useCallback((session: FocusSession) => {
    setSessions((current) => {
      const nextSessions = [session, ...current].slice(0, 240);
      writeSessions(nextSessions);

      if (isSupabaseConfigured) {
        void writeSupabaseSessions(nextSessions).catch((saveError) => {
          setError(saveError instanceof Error ? saveError.message : "Erro ao salvar sessao de foco.");
        });
      }

      return nextSessions;
    });
  }, []);

  return { sessions, addSession, isLoading, error, storageMode: isSupabaseConfigured ? "supabase" : "local" };
};
