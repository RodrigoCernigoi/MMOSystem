import { createDailyReviewService } from "../application/dailyReviewService";
import { createQuestService } from "../application/questService";
import { createProgressionService } from "../application/progressionService";
import { createRewardService } from "../application/rewardService";
import {
  browserIdProvider,
  createLocalPlayerRepository,
  createLocalProgressionRepository,
  createLocalQuestRepository,
  createLocalRewardRepository,
  systemClock,
} from "./browserStorage";
import { createHttpQuestSuggestionGateway } from "./httpQuestSuggestionGateway";
import { isSupabaseConfigured } from "./supabaseClient";
import {
  createSupabasePlayerRepository,
  createSupabaseProgressionRepository,
  createSupabaseQuestRepository,
  createSupabaseRewardRepository,
} from "./supabaseRepositories";

export const createAppContainer = () => {
  const questRepository = isSupabaseConfigured ? createSupabaseQuestRepository() : createLocalQuestRepository();
  const playerRepository = isSupabaseConfigured ? createSupabasePlayerRepository() : createLocalPlayerRepository();
  const progressionRepository = isSupabaseConfigured
    ? createSupabaseProgressionRepository()
    : createLocalProgressionRepository();
  const rewardRepository = isSupabaseConfigured ? createSupabaseRewardRepository() : createLocalRewardRepository();

  return {
    isSupabaseConfigured,
    questService: createQuestService({
      questRepository,
      playerRepository,
      idProvider: browserIdProvider,
      clock: systemClock,
      questSuggestionGateway: createHttpQuestSuggestionGateway(),
    }),
    progressionService: createProgressionService({
      progressionRepository,
      questRepository,
      idProvider: browserIdProvider,
      clock: systemClock,
    }),
    rewardService: createRewardService({
      rewardRepository,
      playerRepository,
      idProvider: browserIdProvider,
      clock: systemClock,
    }),
    dailyReviewService: createDailyReviewService({
      playerRepository,
      idProvider: browserIdProvider,
      clock: systemClock,
    }),
  };
};
