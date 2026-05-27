import type { Player } from "../domain/player";
import type { ProgressionSystem } from "../domain/progressionSystem";
import type { Reward } from "../domain/reward";
import type { CreateQuestInput, Quest } from "../domain/task";

export interface QuestRepository {
  list(): Promise<Quest[]>;
  saveAll(quests: Quest[]): Promise<void>;
}

export interface PlayerRepository {
  get(): Promise<Player>;
  save(player: Player): Promise<void>;
}

export interface ProgressionRepository {
  get(): Promise<ProgressionSystem>;
  save(progression: ProgressionSystem): Promise<void>;
}

export interface RewardRepository {
  list(): Promise<Reward[]>;
  saveAll(rewards: Reward[]): Promise<void>;
}

export interface IdProvider {
  createId(): string;
}

export interface Clock {
  now(): Date;
}

export interface QuestSuggestionGateway {
  suggestQuest(goal: string): Promise<CreateQuestInput>;
}
