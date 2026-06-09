import { createNewPlayer } from "../domain/player";
import type { Player } from "../domain/player";
import { createEmptyProgressionSystem } from "../domain/progressionSystem";
import type { ProgressionSystem } from "../domain/progressionSystem";
import type { Reward } from "../domain/reward";
import type { Quest } from "../domain/task";
import type {
  Clock,
  IdProvider,
  PlayerRepository,
  ProgressionRepository,
  QuestRepository,
  QuestSuggestionGateway,
  RewardRepository,
} from "../application/ports";

const questsKey = "mmo-system:quests";
const playerKey = "mmo-system:player";
const progressionKey = "mmo-system:progression";
const rewardsKey = "mmo-system:rewards";

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

export const createLocalQuestRepository = (): QuestRepository => ({
  async list() {
    return readJson<Array<Partial<Quest>>>(questsKey, []).map((quest) => ({
      id: quest.id ?? crypto.randomUUID(),
      title: quest.title ?? "Missao sem titulo",
      kind: quest.kind ?? "single",
      attribute: quest.attribute ?? "discipline",
      difficulty: quest.difficulty ?? "normal",
      recurrence: quest.recurrence ?? "none",
      status: quest.status ?? "open",
      createdAt: quest.createdAt ?? new Date().toISOString(),
      dueAt: quest.dueAt,
      completedAt: quest.completedAt,
      failedAt: quest.failedAt,
      projectId: quest.projectId,
      importance: quest.importance,
      requiresEvidence: quest.requiresEvidence ?? false,
      evidenceLog: quest.evidenceLog ?? [],
      habitLog: quest.habitLog ?? [],
      lastRenewedAt: quest.lastRenewedAt,
    }));
  },
  async saveAll(quests) {
    localStorage.setItem(questsKey, JSON.stringify(quests));
  },
});

export const createLocalProgressionRepository = (): ProgressionRepository => ({
  async get() {
    const fallback = createEmptyProgressionSystem();
    const storedProgression = readJson<Partial<ProgressionSystem>>(progressionKey, fallback);

    return {
      projects: storedProgression.projects ?? [],
      masterQuests: storedProgression.masterQuests ?? [],
      skills: (storedProgression.skills ?? []).map((skill) => ({
        ...skill,
        prerequisiteSkillIds: skill.prerequisiteSkillIds ?? [],
      })),
      bosses: storedProgression.bosses ?? [],
    };
  },
  async save(progression) {
    localStorage.setItem(progressionKey, JSON.stringify(progression));
  },
});

export const createLocalPlayerRepository = (): PlayerRepository => ({
  async get() {
    const fallback = createNewPlayer();
    const storedPlayer = readJson<Partial<Player>>(playerKey, fallback);

    return {
      ...fallback,
      ...storedPlayer,
      title: storedPlayer.title ?? fallback.title,
      bio: storedPlayer.bio ?? fallback.bio,
      avatarSymbol: storedPlayer.avatarSymbol ?? fallback.avatarSymbol,
      focus: storedPlayer.focus ?? fallback.focus,
      onboardingProfile: storedPlayer.onboardingProfile ?? fallback.onboardingProfile,
      appPreferences: storedPlayer.appPreferences ?? fallback.appPreferences,
      totalXp: storedPlayer.totalXp ?? storedPlayer.xp ?? fallback.totalXp,
      skillPoints: storedPlayer.skillPoints ?? 0,
      completedQuestCount: storedPlayer.completedQuestCount ?? 0,
      unlockedAchievementIds: storedPlayer.unlockedAchievementIds ?? [],
      redeemedRewards: storedPlayer.redeemedRewards ?? [],
      dailyHistory: storedPlayer.dailyHistory ?? [],
      dailyReviews: storedPlayer.dailyReviews ?? [],
      attributes: {
        ...fallback.attributes,
        ...storedPlayer.attributes,
      },
    };
  },
  async save(player) {
    localStorage.setItem(playerKey, JSON.stringify(player));
  },
});

export const createLocalRewardRepository = (): RewardRepository => ({
  async list() {
    return readJson<Reward[]>(rewardsKey, []);
  },
  async saveAll(rewards) {
    localStorage.setItem(rewardsKey, JSON.stringify(rewards));
  },
});

export const browserIdProvider: IdProvider = {
  createId: () => crypto.randomUUID(),
};

export const systemClock: Clock = {
  now: () => new Date(),
};

export const localQuestSuggestionGateway: QuestSuggestionGateway = {
  async suggestQuest(goal) {
    const normalizedGoal = goal.trim() || "avancar em uma prioridade importante";
    const lowerGoal = normalizedGoal.toLowerCase();
    const attribute = lowerGoal.includes("trein") || lowerGoal.includes("academ")
      ? "strength"
      : lowerGoal.includes("estud") || lowerGoal.includes("ler") || lowerGoal.includes("program")
        ? "intelligence"
        : lowerGoal.includes("pessoa") || lowerGoal.includes("social")
          ? "social"
          : "discipline";

    return {
      title: `Avancar em: ${normalizedGoal}`,
      kind: "daily",
      attribute,
      difficulty: "normal",
      recurrence: "daily",
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    };
  },
};
