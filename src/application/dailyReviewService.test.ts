import { describe, expect, it } from "vitest";
import { createNewPlayer } from "../domain/player";
import type { Player } from "../domain/player";
import { createDailyReviewService } from "./dailyReviewService";

describe("dailyReviewService", () => {
  it("closes a day and applies its bonus once", async () => {
    let player: Player = {
      ...createNewPlayer(),
      dailyHistory: [
        {
          date: "2026-05-27",
          completedQuestIds: ["quest-1", "quest-2", "quest-3", "quest-4", "quest-5"],
          completedHabitIds: [],
          xpEarned: 250,
          coinsEarned: 50,
        },
      ],
    };
    const service = createDailyReviewService({
      playerRepository: {
        async get() {
          return player;
        },
        async save(nextPlayer) {
          player = nextPlayer;
        },
      },
      idProvider: { createId: () => "review-1" },
      clock: { now: () => new Date("2026-05-27T21:00:00.000Z") },
    });

    const firstClose = await service.endDay("2026-05-27");
    const secondClose = await service.endDay("2026-05-27");

    expect(firstClose.alreadyClosed).toBe(false);
    expect(firstClose.review.rank).toBe("A");
    expect(secondClose.alreadyClosed).toBe(true);
    expect(player.dailyReviews).toHaveLength(1);
    expect(player.totalXp).toBe(60);
    expect(player.coins).toBe(18);
    expect(player.skillPoints).toBe(1);
  });
});
