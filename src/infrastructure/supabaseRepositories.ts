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
    const client = requireSupabase();
    const userId = await getCurrentUserId();
    const normalizedPlayer = normalizePlayer(player, userId);
    const { error } = await client
      .from("profiles")
      .upsert({ id: userId, player: normalizedPlayer, updated_at: new Date().toISOString() });

    if (error) {
      throw error;
    }
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
    const client = requireSupabase();
    const userId = await getCurrentUserId();
    const { error } = await client
      .from("profiles")
      .upsert({ id: userId, rewards, updated_at: new Date().toISOString() });

    if (error) {
      throw error;
    }
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
    const client = requireSupabase();
    const userId = await getCurrentUserId();
    const { error } = await client
      .from("profiles")
      .upsert({ id: userId, progression, updated_at: new Date().toISOString() });

    if (error) {
      throw error;
    }
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
