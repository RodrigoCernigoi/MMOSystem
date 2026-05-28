import { useCallback, useEffect, useMemo, useState } from "react";
import type { Player } from "../domain/player";
import type { UpdatePlayerProfileInput } from "../application/questService";
import type { CompleteQuestInput, CreateQuestInput, Quest, UpdateQuestInput } from "../domain/task";
import { createAppContainer } from "../infrastructure/container";

const container = createAppContainer();

type DashboardState = {
  player: Player | null;
  quests: Quest[];
  isLoading: boolean;
  error: string | null;
};

export type RewardFeedback = {
  xp: number;
  coins: number;
  leveledUp: boolean;
  newAchievements: number;
};

export const useDashboard = () => {
  const [state, setState] = useState<DashboardState>({
    player: null,
    quests: [],
    isLoading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      const dashboard = await container.questService.getDashboard();
      setState({ ...dashboard, isLoading: false, error: null });
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unexpected error.",
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const actions = useMemo(
    () => ({
      async createQuest(input: CreateQuestInput) {
        await container.questService.createQuest(input);
        await refresh();
      },
      async updatePlayerProfile(input: UpdatePlayerProfileInput) {
        await container.questService.updatePlayerProfile(input);
        await refresh();
      },
      async completeQuest(id: string, input?: CompleteQuestInput) {
        const before = await container.questService.getDashboard();
        const result = await container.questService.completeQuest(id, input);
        const after = await container.questService.getDashboard();
        setState({ ...after, isLoading: false, error: null });

        return {
          xp: Math.max(0, result.player.totalXp - before.player.totalXp),
          coins: Math.max(0, result.player.coins - before.player.coins),
          leveledUp: result.player.level > before.player.level,
          newAchievements: Math.max(
            0,
            result.player.unlockedAchievementIds.length - before.player.unlockedAchievementIds.length,
          ),
        } satisfies RewardFeedback;
      },
      async updateQuest(id: string, input: UpdateQuestInput) {
        await container.questService.updateQuest(id, input);
        await refresh();
      },
      async archiveQuest(id: string) {
        await container.questService.archiveQuest(id);
        await refresh();
      },
      async deleteQuest(id: string) {
        await container.questService.deleteQuest(id);
        await refresh();
      },
      async suggestQuest(goal: string) {
        return container.questService.suggestQuest(goal);
      },
      async endDay(date: string) {
        const result = await container.dailyReviewService.endDay(date);
        const dashboard = await container.questService.getDashboard();
        setState({ ...dashboard, isLoading: false, error: null });
        return result;
      },
    }),
    [refresh],
  );

  return { ...state, ...actions };
};
