import { describe, expect, it } from "vitest";
import { createNewPlayer } from "./player";
import { applyQuestReward } from "./progression";
import type { Quest } from "./task";

const makeQuest = (overrides: Partial<Quest> = {}): Quest => ({
  id: "quest-1",
  title: "Train",
  kind: "single",
  attribute: "strength",
  difficulty: "elite",
  recurrence: "none",
  status: "completed",
  createdAt: new Date(0).toISOString(),
  completedAt: new Date(1).toISOString(),
  ...overrides,
});

describe("progression", () => {
  it("applies quest rewards to the right attribute", () => {
    const player = applyQuestReward(createNewPlayer(), makeQuest());

    expect(player.level).toBe(2);
    expect(player.xp).toBe(40);
    expect(player.coins).toBe(32);
    expect(player.attributes.strength).toBe(6);
  });

  it("does not mutate the original player", () => {
    const player = createNewPlayer();

    applyQuestReward(player, makeQuest({ difficulty: "easy" }));

    expect(player.xp).toBe(0);
    expect(player.attributes.strength).toBe(1);
  });
});
