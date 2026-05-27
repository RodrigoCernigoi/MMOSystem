import { useCallback, useEffect, useState } from "react";
import type { FocusSession } from "../domain/focusSession";

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

export const useFocusSessions = () => {
  const [sessions, setSessions] = useState<FocusSession[]>([]);

  useEffect(() => {
    setSessions(readSessions());
  }, []);

  const addSession = useCallback((session: FocusSession) => {
    setSessions((current) => {
      const nextSessions = [session, ...current].slice(0, 240);
      writeSessions(nextSessions);
      return nextSessions;
    });
  }, []);

  return { sessions, addSession };
};
