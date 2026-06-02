import { createNewPlayer } from "../domain/player";
import type { Player } from "../domain/player";
import { createEmptyProgressionSystem } from "../domain/progressionSystem";
import type { ProgressionSystem } from "../domain/progressionSystem";
import type { Reward } from "../domain/reward";
import type { Quest } from "../domain/task";
import type { PlayerRepository, ProgressionRepository, QuestRepository, RewardRepository } from "../application/ports";
import { supabase } from "./supabaseClient";

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase nao esta configurado.");
  }

  return supabase;
};

const getCurrentUserId = async () => {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new Error("Usuario nao autenticado.");
  }

  return data.user.id;
};

const normalizePlayer = (player: Partial<Player>, userId: string): Player => {
  const fallback = createNewPlayer();

  return {
    ...fallback,
    ...player,
    id: userId,
    title: player.title ?? fallback.title,
    bio: player.bio ?? fallback.bio,
    avatarSymbol: player.avatarSymbol ?? fallback.avatarSymbol,
    focus: player.focus ?? fallback.focus,
    appPreferences: player.appPreferences ?? fallback.appPreferences,
    totalXp: player.totalXp ?? player.xp ?? fallback.totalXp,
    skillPoints: player.skillPoints ?? 0,
    completedQuestCount: player.completedQuestCount ?? 0,
    unlockedAchievementIds: player.unlockedAchievementIds ?? [],
    redeemedRewards: player.redeemedRewards ?? [],
    dailyHistory: player.dailyHistory ?? [],
    dailyReviews: player.dailyReviews ?? [],
    attributes: {
      ...fallback.attributes,
      ...player.attributes,
    },
  };
};

type ProfilePatch = {
  player?: Player;
  progression?: ProgressionSystem;
  rewards?: Reward[];
  focus_sessions?: unknown[];
};

export const upsertProfilePatch = async (patch: ProfilePatch) => {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { data, error: readError } = await client
    .from("profiles")
    .select("player,progression,rewards,focus_sessions")
    .eq("id", userId)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  const payload = {
    id: userId,
    player: patch.player ? normalizePlayer(patch.player, userId) : normalizePlayer((data?.player ?? {}) as Partial<Player>, userId),
    progression: patch.progression ?? ((data?.progression ?? createEmptyProgressionSystem()) as ProgressionSystem),
    rewards: patch.rewards ?? ((data?.rewards ?? []) as Reward[]),
    focus_sessions: patch.focus_sessions ?? ((data?.focus_sessions ?? []) as unknown[]),
    updated_at: new Date().toISOString(),
  };
  const { error } = await client.from("profiles").upsert(payload);

  if (error) {
    throw error;
  }
};

export const createSupabasePlayerRepository = (): PlayerRepository => ({
  async get() {
    const client = requireSupabase();
    const userId = await getCurrentUserId();
    const { data, error } = await client.from("profiles").select("player").eq("id", userId).maybeSingle();

    if (error) {
      throw error;
    }

    if (data?.player) {
      return normalizePlayer(data.player as Partial<Player>, userId);
    }

    const player = normalizePlayer({ id: userId }, userId);
    const { error: insertError } = await client.from("profiles").insert({ id: userId, player });

    if (insertError) {
      throw insertError;
    }

    return player;
  },

  async save(player) {
    await upsertProfilePatch({ player });
  },
});

export const createSupabaseRewardRepository = (): RewardRepository => ({
  async list() {
    const client = requireSupabase();
    const userId = await getCurrentUserId();
    const { data, error } = await client.from("profiles").select("rewards").eq("id", userId).maybeSingle();

    if (error) {
      throw error;
    }

    return (data?.rewards ?? []) as Reward[];
  },

  async saveAll(rewards) {
    await upsertProfilePatch({ rewards });
  },
});

export const createSupabaseProgressionRepository = (): ProgressionRepository => ({
  async get() {
    const client = requireSupabase();
    const userId = await getCurrentUserId();
    const { data, error } = await client.from("profiles").select("progression").eq("id", userId).maybeSingle();

    if (error) {
      throw error;
    }

    const progression = (data?.progression ?? createEmptyProgressionSystem()) as Partial<ProgressionSystem>;

    return {
      projects: progression.projects ?? [],
      masterQuests: progression.masterQuests ?? [],
      skills: (progression.skills ?? []).map((skill) => ({
        ...skill,
        prerequisiteSkillIds: skill.prerequisiteSkillIds ?? [],
      })),
      bosses: progression.bosses ?? [],
    };
  },

  async save(progression) {
    await upsertProfilePatch({ progression });
  },
});

export const createSupabaseQuestRepository = (): QuestRepository => ({
  async list() {
    const client = requireSupabase();
    const userId = await getCurrentUserId();
    const { data, error } = await client
      .from("quests")
      .select("quest")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => row.quest as Quest);
  },

  async saveAll(quests) {
    const client = requireSupabase();
    const userId = await getCurrentUserId();
    const { error: deleteError } = await client.from("quests").delete().eq("user_id", userId);

    if (deleteError) {
      throw deleteError;
    }

    if (quests.length === 0) {
      return;
    }

    const { error: insertError } = await client.from("quests").insert(
      quests.map((quest) => ({
        id: quest.id,
        user_id: userId,
        quest,
        created_at: quest.createdAt,
      })),
    );

    if (insertError) {
      throw insertError;
    }
  },
});
