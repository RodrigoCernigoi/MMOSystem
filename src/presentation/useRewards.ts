import { useCallback, useEffect, useMemo, useState } from "react";
import type { Player } from "../domain/player";
import type { CreateRewardInput, Reward } from "../domain/reward";
import { createAppContainer } from "../infrastructure/container";

const container = createAppContainer();

type RewardState = {
  rewards: Reward[];
  player: Player | null;
  isLoading: boolean;
  error: string | null;
};

export const useRewards = () => {
  const [state, setState] = useState<RewardState>({
    rewards: [],
    player: null,
    isLoading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      const rewardsDashboard = await container.rewardService.getRewards();
      setState({ ...rewardsDashboard, isLoading: false, error: null });
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
      async createReward(input: CreateRewardInput) {
        await container.rewardService.createReward(input);
        await refresh();
      },
      async redeemReward(id: string) {
        await container.rewardService.redeemReward(id);
        await refresh();
      },
      async archiveReward(id: string) {
        await container.rewardService.archiveReward(id);
        await refresh();
      },
    }),
    [refresh],
  );

  return { ...state, ...actions };
};
