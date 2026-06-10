import type { FocusSession } from "../domain/focusSession";
import { createNewPlayer } from "../domain/player";
import type { Player } from "../domain/player";
import type { ProgressionSystem } from "../domain/progressionSystem";
import type { Reward } from "../domain/reward";
import type { Quest } from "../domain/task";
import type { VisualPreferences } from "../presentation/visualPreferences";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

const keys = {
  quests: "mmo-system:quests",
  player: "mmo-system:player",
  progression: "mmo-system:progression",
  rewards: "mmo-system:rewards",
  focusSessions: "mmo-system:focus-sessions",
  visualPreferences: "mmo-system:visual-preferences",
  onboardingComplete: "mmo-system:onboarding-complete",
};

export type AppBackup = {
  version: 1;
  exportedAt: string;
  source: "local" | "supabase";
  data: {
    quests: Quest[];
    player: Player | null;
    progression: ProgressionSystem | null;
    rewards: Reward[];
    focusSessions: FocusSession[];
    visualPreferences: VisualPreferences | null;
    onboardingComplete: boolean;
  };
};

export type SyncStatus = {
  source: "local" | "supabase";
  updatedAt?: string;
  quests: number;
  skills: number;
  rewards: number;
  focusSessions: number;
};

const readJson = <T>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getCurrentUserId = async () => {
  if (!supabase) {
    throw new Error("Supabase nao esta configurado.");
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw error ?? new Error("Usuario nao autenticado.");
  }

  return data.user.id;
};

export const readLocalBackup = (): AppBackup => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  source: "local",
  data: {
    quests: readJson<Quest[]>(keys.quests, []),
    player: readJson<Player | null>(keys.player, null),
    progression: readJson<ProgressionSystem | null>(keys.progression, null),
    rewards: readJson<Reward[]>(keys.rewards, []),
    focusSessions: readJson<FocusSession[]>(keys.focusSessions, []),
    visualPreferences: readJson<VisualPreferences | null>(keys.visualPreferences, null),
    onboardingComplete: localStorage.getItem(keys.onboardingComplete) === "true",
  },
});

export const writeLocalBackup = (backup: AppBackup) => {
  writeJson(keys.quests, backup.data.quests);

  if (backup.data.player) {
    writeJson(keys.player, backup.data.player);
  }

  if (backup.data.progression) {
    writeJson(keys.progression, backup.data.progression);
  }

  writeJson(keys.rewards, backup.data.rewards);
  writeJson(keys.focusSessions, backup.data.focusSessions);

  if (backup.data.visualPreferences) {
    writeJson(keys.visualPreferences, backup.data.visualPreferences);
  }

  localStorage.setItem(keys.onboardingComplete, backup.data.onboardingComplete ? "true" : "false");
};

export const readSupabaseBackup = async (): Promise<AppBackup> => {
  if (!supabase) {
    throw new Error("Supabase nao esta configurado.");
  }

  const userId = await getCurrentUserId();
  const [{ data: profile, error: profileError }, { data: questRows, error: questError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("player,progression,rewards,focus_sessions,updated_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("quests").select("quest").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  if (profileError) {
    throw profileError;
  }

  if (questError) {
    throw questError;
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    source: "supabase",
    data: {
      quests: (questRows ?? []).map((row) => row.quest as Quest),
      player: (profile?.player ?? null) as Player | null,
      progression: (profile?.progression ?? null) as ProgressionSystem | null,
      rewards: (profile?.rewards ?? []) as Reward[],
      focusSessions: (profile?.focus_sessions ?? []) as FocusSession[],
      visualPreferences: readJson<VisualPreferences | null>(keys.visualPreferences, null),
      onboardingComplete: localStorage.getItem(keys.onboardingComplete) === "true",
    },
  };
};

export const writeSupabaseBackup = async (backup: AppBackup) => {
  if (!supabase) {
    throw new Error("Supabase nao esta configurado.");
  }

  const userId = await getCurrentUserId();
  const player = backup.data.player ? { ...backup.data.player, id: userId } : { ...createNewPlayer(), id: userId };
  const profilePayload = {
    id: userId,
    player,
    progression: backup.data.progression ?? { journeys: [], projects: [], masterQuests: [], skills: [], bosses: [] },
    rewards: backup.data.rewards,
    focus_sessions: backup.data.focusSessions,
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase.from("profiles").upsert(profilePayload);

  if (profileError) {
    throw profileError;
  }

  const { error: deleteError } = await supabase.from("quests").delete().eq("user_id", userId);

  if (deleteError) {
    throw deleteError;
  }

  if (backup.data.quests.length > 0) {
    const { error: insertError } = await supabase.from("quests").insert(
      backup.data.quests.map((quest) => ({
        id: quest.id,
        user_id: userId,
        quest,
        created_at: quest.createdAt,
      })),
    );

    if (insertError) {
      throw insertError;
    }
  }

  if (backup.data.visualPreferences) {
    writeJson(keys.visualPreferences, backup.data.visualPreferences);
  }

  writeJson(keys.focusSessions, backup.data.focusSessions);
  localStorage.setItem(keys.onboardingComplete, backup.data.onboardingComplete ? "true" : "false");
};

export const readActiveBackup = async () =>
  isSupabaseConfigured ? readSupabaseBackup() : Promise.resolve(readLocalBackup());

export const writeActiveBackup = async (backup: AppBackup) => {
  if (isSupabaseConfigured) {
    await writeSupabaseBackup(backup);
    return;
  }

  writeLocalBackup(backup);
};

export const migrateLocalBackupToSupabase = async () => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase nao esta configurado.");
  }

  await writeSupabaseBackup({ ...readLocalBackup(), source: "supabase" });
};

export const clearLocalBackupData = () => {
  Object.values(keys).forEach((key) => localStorage.removeItem(key));
};

export const getSyncStatus = async (): Promise<SyncStatus> => {
  const backup = await readActiveBackup();

  return {
    source: backup.source,
    updatedAt: backup.exportedAt,
    quests: backup.data.quests.length,
    skills: backup.data.progression?.skills.length ?? 0,
    rewards: backup.data.rewards.length,
    focusSessions: backup.data.focusSessions.length,
  };
};
