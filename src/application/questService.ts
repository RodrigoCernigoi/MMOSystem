import { unlockAvailableAchievements } from "../domain/achievements";
import { applyQuestFailure, applyQuestReward, getRewardForQuest } from "../domain/progression";
import type { AppPreferences, OnboardingProfile, Player } from "../domain/player";
import { isDifferentMonth, isQuestScheduledForDate } from "../domain/schedule";
import type { CompleteQuestInput, CreateQuestInput, Quest, UpdateQuestInput, Weekday } from "../domain/task";
import type { Clock, IdProvider, PlayerRepository, QuestRepository, QuestSuggestionGateway } from "./ports";

export type QuestService = ReturnType<typeof createQuestService>;

export type UpdatePlayerProfileInput = {
  name?: string;
  title?: string;
  bio?: string;
  avatarSymbol?: string;
  focus?: string;
  onboardingProfile?: OnboardingProfile;
  appPreferences?: AppPreferences;
};

type QuestServiceDependencies = {
  questRepository: QuestRepository;
  playerRepository: PlayerRepository;
  idProvider: IdProvider;
  clock: Clock;
  questSuggestionGateway: QuestSuggestionGateway;
};

export const createQuestService = ({
  questRepository,
  playerRepository,
  idProvider,
  clock,
  questSuggestionGateway,
}: QuestServiceDependencies) => ({
  async getDashboard(): Promise<{ player: Player; quests: Quest[] }> {
    const [player, quests] = await Promise.all([playerRepository.get(), questRepository.list()]);
    const now = clock.now();
    const today = now.toISOString().slice(0, 10);
    let updatedPlayer = player;
    let changed = false;

    const updatedQuests = quests.map((quest) => {
      if (quest.status === "completed" && quest.recurrence !== "none" && quest.completedAt) {
        const completedDate = quest.completedAt.slice(0, 10);
        const hasSpecificSchedule = Boolean(
          quest.recurrenceRule?.weekdays?.length || quest.recurrenceRule?.monthDays?.length,
        );
        const shouldRenewDaily = quest.recurrence === "daily" && completedDate < today && isQuestScheduledForDate(quest, now);
        const shouldRenewWeekly =
          quest.recurrence === "weekly" &&
          (hasSpecificSchedule ? completedDate < today && isQuestScheduledForDate(quest, now) : isDifferentWeek(new Date(quest.completedAt), now));
        const shouldRenewMonthly =
          quest.recurrence === "monthly" &&
          (hasSpecificSchedule
            ? completedDate < today && isQuestScheduledForDate(quest, now)
            : isDifferentMonth(new Date(quest.completedAt), now));

        if (shouldRenewDaily || shouldRenewWeekly || shouldRenewMonthly) {
          changed = true;
          return {
            ...quest,
            status: "open" as const,
            completedAt: undefined,
            failedAt: undefined,
            lastRenewedAt: now.toISOString(),
          };
        }
      }

      if (quest.status !== "open" || !quest.dueAt || quest.kind === "habit") {
        return quest;
      }

      if (new Date(quest.dueAt).getTime() >= now.getTime()) {
        return quest;
      }

      changed = true;
      updatedPlayer = applyQuestFailure(updatedPlayer, quest);
      return { ...quest, status: "failed" as const, failedAt: now.toISOString() };
    });

    if (changed) {
      await Promise.all([playerRepository.save(updatedPlayer), questRepository.saveAll(updatedQuests)]);
    }

    return { player: updatedPlayer, quests: updatedQuests };
  },

  async createQuest(input: CreateQuestInput): Promise<Quest> {
    const quest: Quest = {
      id: idProvider.createId(),
      title: input.title.trim(),
      kind: input.kind,
      attribute: input.attribute,
      difficulty: input.difficulty,
      recurrence: input.recurrence,
      recurrenceRule: normalizeRecurrenceRule(input.recurrenceRule),
      status: "open",
      createdAt: clock.now().toISOString(),
      dueAt: input.dueAt || undefined,
      projectId: input.projectId || undefined,
      importance: input.importance?.trim() || undefined,
      requiresEvidence: input.requiresEvidence ?? (input.difficulty === "hard" || input.difficulty === "elite"),
      evidenceLog: [],
      habitLog: [],
    };

    if (!quest.title) {
      throw new Error("Quest title is required.");
    }

    const quests = await questRepository.list();
    await questRepository.saveAll([quest, ...quests]);
    return quest;
  },

  async updatePlayerProfile(input: UpdatePlayerProfileInput): Promise<Player> {
    const player = await playerRepository.get();
    const updatedPlayer: Player = {
      ...player,
      name: input.name?.trim() || player.name,
      title: input.title === undefined ? player.title : input.title.trim() || undefined,
      bio: input.bio === undefined ? player.bio : input.bio.trim() || undefined,
      avatarSymbol: input.avatarSymbol?.trim() || player.avatarSymbol,
      focus: input.focus === undefined ? player.focus : input.focus.trim() || undefined,
      onboardingProfile: input.onboardingProfile
        ? { ...(player.onboardingProfile ?? {}), ...input.onboardingProfile }
        : player.onboardingProfile,
      appPreferences: input.appPreferences ? { ...(player.appPreferences ?? {}), ...input.appPreferences } : player.appPreferences,
    };

    await playerRepository.save(updatedPlayer);
    return updatedPlayer;
  },

  async suggestQuest(goal: string): Promise<CreateQuestInput> {
    return questSuggestionGateway.suggestQuest(goal);
  },

  async updateQuest(questId: string, input: UpdateQuestInput): Promise<Quest> {
    const quests = await questRepository.list();
    const quest = quests.find((item) => item.id === questId);

    if (!quest) {
      throw new Error("Quest not found.");
    }

    if (quest.status !== "open") {
      throw new Error("Only open quests can be edited.");
    }

    const updatedQuest: Quest = {
      ...quest,
      ...input,
      title: input.title === undefined ? quest.title : input.title.trim(),
      recurrenceRule: input.recurrenceRule === undefined ? quest.recurrenceRule : normalizeRecurrenceRule(input.recurrenceRule),
      dueAt: input.dueAt || undefined,
      projectId: input.projectId || undefined,
      importance: input.importance === undefined ? quest.importance : input.importance.trim() || undefined,
      requiresEvidence:
        input.difficulty === "hard" || input.difficulty === "elite"
          ? true
          : input.requiresEvidence ?? quest.requiresEvidence,
    };

    if (!updatedQuest.title) {
      throw new Error("Quest title is required.");
    }

    await questRepository.saveAll(quests.map((item) => (item.id === questId ? updatedQuest : item)));
    return updatedQuest;
  },

  async archiveQuest(questId: string): Promise<Quest> {
    const quests = await questRepository.list();
    const quest = quests.find((item) => item.id === questId);

    if (!quest) {
      throw new Error("Quest not found.");
    }

    const archivedQuest: Quest = {
      ...quest,
      status: "archived",
    };

    await questRepository.saveAll(quests.map((item) => (item.id === questId ? archivedQuest : item)));
    return archivedQuest;
  },

  async deleteQuest(questId: string): Promise<void> {
    const quests = await questRepository.list();
    await questRepository.saveAll(quests.filter((item) => item.id !== questId));
  },

  async completeQuest(questId: string, input: CompleteQuestInput = {}): Promise<{ player: Player; quest: Quest }> {
    const [player, quests] = await Promise.all([playerRepository.get(), questRepository.list()]);
    const quest = quests.find((item) => item.id === questId);

    if (!quest) {
      throw new Error("Quest not found.");
    }

    if (quest.status !== "open") {
      return { player, quest };
    }

    const today = clock.now().toISOString().slice(0, 10);
    const evidenceText = input.evidence?.trim();

    if (quest.requiresEvidence && !evidenceText) {
      throw new Error("Esta missao exige evidencia para ser concluida.");
    }

    const evidenceLog = evidenceText
      ? [
          {
            id: idProvider.createId(),
            text: evidenceText,
            createdAt: clock.now().toISOString(),
          },
          ...(quest.evidenceLog ?? []),
        ]
      : (quest.evidenceLog ?? []);

    if (quest.kind === "habit") {
      if ((quest.habitLog ?? []).includes(today)) {
        return { player, quest };
      }

      const completedHabit: Quest = {
        ...quest,
        evidenceLog,
        habitLog: [today, ...(quest.habitLog ?? [])],
        completedAt: clock.now().toISOString(),
      };
      const reward = getRewardForQuest(completedHabit, player.streak);
      const rewardedPlayer = applyQuestReward(player, completedHabit);
      const updatedQuests = quests.map((item) => (item.id === questId ? completedHabit : item));
      const updatedPlayer = unlockAvailableAchievements(
        recordDailyCompletion(rewardedPlayer, today, completedHabit.id, "habit", reward.xp, reward.coins),
        updatedQuests,
      );

      await Promise.all([playerRepository.save(updatedPlayer), questRepository.saveAll(updatedQuests)]);
      return { player: updatedPlayer, quest: completedHabit };
    }

    const completedQuest: Quest = {
      ...quest,
      status: "completed",
      evidenceLog,
      completedAt: clock.now().toISOString(),
    };
    const reward = getRewardForQuest(completedQuest, player.streak);
    const rewardedPlayer = applyQuestReward(player, completedQuest);
    const updatedQuests = quests.map((item) => (item.id === questId ? completedQuest : item));
    const updatedPlayer = unlockAvailableAchievements(
      recordDailyCompletion(rewardedPlayer, today, completedQuest.id, "quest", reward.xp, reward.coins),
      updatedQuests,
    );

    await Promise.all([
      playerRepository.save(updatedPlayer),
      questRepository.saveAll(updatedQuests),
    ]);

    return { player: updatedPlayer, quest: completedQuest };
  },
});

const isDifferentWeek = (left: Date, right: Date) => {
  const startOfWeek = (date: Date) => {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    next.setDate(next.getDate() - next.getDay());
    return next.toISOString().slice(0, 10);
  };

  return startOfWeek(left) !== startOfWeek(right);
};

const normalizeRecurrenceRule = (rule: Quest["recurrenceRule"]): Quest["recurrenceRule"] | undefined => {
  const weekdays = Array.from(new Set(rule?.weekdays ?? []))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((left, right) => left - right) as Weekday[];
  const monthDays = Array.from(new Set(rule?.monthDays ?? []))
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= 31)
    .sort((left, right) => left - right);

  if (!weekdays.length && !monthDays.length) {
    return undefined;
  }

  return {
    ...(weekdays.length ? { weekdays } : {}),
    ...(monthDays.length ? { monthDays } : {}),
  };
};

const recordDailyCompletion = (
  player: Player,
  date: string,
  questId: string,
  type: "quest" | "habit",
  xpEarned: number,
  coinsEarned: number,
): Player => {
  const existingEntry = player.dailyHistory.find((entry) => entry.date === date);
  const nextEntry = existingEntry ?? {
    date,
    completedQuestIds: [],
    completedHabitIds: [],
    xpEarned: 0,
    coinsEarned: 0,
  };
  const completedQuestIds =
    type === "quest" ? Array.from(new Set([...nextEntry.completedQuestIds, questId])) : nextEntry.completedQuestIds;
  const completedHabitIds =
    type === "habit" ? Array.from(new Set([...nextEntry.completedHabitIds, questId])) : nextEntry.completedHabitIds;
  const updatedEntry = {
    ...nextEntry,
    completedQuestIds,
    completedHabitIds,
    xpEarned: nextEntry.xpEarned + xpEarned,
    coinsEarned: nextEntry.coinsEarned + coinsEarned,
  };

  return {
    ...player,
    dailyHistory: [updatedEntry, ...player.dailyHistory.filter((entry) => entry.date !== date)].slice(0, 90),
  };
};
