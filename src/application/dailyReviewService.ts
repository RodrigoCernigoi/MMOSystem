import { applyDailyReviewBonus, buildDailyReview } from "../domain/dailyReview";
import type { DailyReview, Player } from "../domain/player";
import type { Clock, IdProvider, PlayerRepository } from "./ports";

type DailyReviewServiceDependencies = {
  playerRepository: PlayerRepository;
  idProvider: IdProvider;
  clock: Clock;
};

export const createDailyReviewService = ({ playerRepository, idProvider, clock }: DailyReviewServiceDependencies) => ({
  async endDay(date = clock.now().toISOString().slice(0, 10)): Promise<{ player: Player; review: DailyReview; alreadyClosed: boolean }> {
    const player = await playerRepository.get();
    const existingReview = player.dailyReviews.find((review) => review.date === date);

    if (existingReview) {
      return { player, review: existingReview, alreadyClosed: true };
    }

    const review = buildDailyReview(
      idProvider.createId(),
      date,
      player.dailyHistory.find((entry) => entry.date === date),
      clock.now().toISOString(),
    );
    const updatedPlayer = applyDailyReviewBonus(player, review);

    await playerRepository.save(updatedPlayer);

    return { player: updatedPlayer, review, alreadyClosed: false };
  },
});

export type DailyReviewService = ReturnType<typeof createDailyReviewService>;
