import { describe, expect, it } from "vitest";
import type { ProgressionSystem } from "../domain/progressionSystem";
import type { Quest } from "../domain/task";
import { createProgressionService } from "./progressionService";
import type { ProgressionRepository, QuestRepository } from "./ports";

const makeQuest = (id: string, status: Quest["status"]): Quest => ({
  id,
  title: `Quest ${id}`,
  kind: "single",
  attribute: "discipline",
  difficulty: "normal",
  recurrence: "none",
  status,
  createdAt: new Date(0).toISOString(),
});

describe("progressionService", () => {
  it("completes a project when every linked quest is completed", async () => {
    let progression: ProgressionSystem = {
      journeys: [],
      projects: [
        {
          id: "project-1",
          title: "Build habit",
          description: "A real habit project",
          attribute: "discipline",
          status: "active",
          questIds: ["quest-1", "quest-2"],
          createdAt: new Date(0).toISOString(),
        },
      ],
      masterQuests: [],
      skills: [],
      bosses: [],
    };
    const quests = [makeQuest("quest-1", "completed"), makeQuest("quest-2", "completed")];
    const progressionRepository: ProgressionRepository = {
      async get() {
        return progression;
      },
      async save(nextProgression) {
        progression = nextProgression;
      },
    };
    const questRepository: QuestRepository = {
      async list() {
        return quests;
      },
      async saveAll() {},
    };
    const service = createProgressionService({
      progressionRepository,
      questRepository,
      idProvider: { createId: () => "id" },
      clock: { now: () => new Date("2026-01-01T00:00:00.000Z") },
    });

    const dashboard = await service.getProgression();

    expect(dashboard.progression.projects[0].status).toBe("completed");
    expect(dashboard.progression.projects[0].completedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("also counts quests linked by projectId", async () => {
    let progression: ProgressionSystem = {
      journeys: [],
      projects: [
        {
          id: "project-1",
          title: "Build habit",
          description: "A real habit project",
          attribute: "discipline",
          status: "active",
          questIds: [],
          createdAt: new Date(0).toISOString(),
        },
      ],
      masterQuests: [],
      skills: [],
      bosses: [],
    };
    const quests = [{ ...makeQuest("quest-1", "completed"), projectId: "project-1" }];
    const progressionRepository: ProgressionRepository = {
      async get() {
        return progression;
      },
      async save(nextProgression) {
        progression = nextProgression;
      },
    };
    const questRepository: QuestRepository = {
      async list() {
        return quests;
      },
      async saveAll() {},
    };
    const service = createProgressionService({
      progressionRepository,
      questRepository,
      idProvider: { createId: () => "id" },
      clock: { now: () => new Date("2026-01-01T00:00:00.000Z") },
    });

    const dashboard = await service.getProgression();

    expect(dashboard.progression.projects[0].status).toBe("completed");
  });

  it("manually completes a master quest and unlocks its skill", async () => {
    let progression: ProgressionSystem = {
      journeys: [],
      projects: [],
      masterQuests: [
        {
          id: "master-1",
          title: "Win competition",
          description: "A real-life milestone",
          attribute: "discipline",
          status: "active",
          projectIds: [],
          unlocksSkillId: "skill-1",
          createdAt: new Date(0).toISOString(),
        },
      ],
      skills: [
        {
          id: "skill-1",
          title: "Competitive composure",
          description: "Stay steady under pressure.",
          attribute: "discipline",
          prerequisiteSkillIds: [],
          isUnlocked: false,
        },
      ],
      bosses: [],
    };
    const progressionRepository: ProgressionRepository = {
      async get() {
        return progression;
      },
      async save(nextProgression) {
        progression = nextProgression;
      },
    };
    const service = createProgressionService({
      progressionRepository,
      questRepository: {
        async list() {
          return [];
        },
        async saveAll() {},
      },
      idProvider: { createId: () => "id" },
      clock: { now: () => new Date("2026-01-01T00:00:00.000Z") },
    });

    await service.completeMasterQuest("master-1");

    expect(progression.masterQuests[0].status).toBe("completed");
    expect(progression.skills[0].isUnlocked).toBe(true);
  });
});
