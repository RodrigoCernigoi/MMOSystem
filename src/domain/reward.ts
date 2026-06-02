export type RewardCategory = "leisure" | "rest" | "social" | "purchase" | "health" | "learning";

export type Reward = {
  id: string;
  title: string;
  description: string;
  cost: number;
  category: RewardCategory;
  createdAt: string;
  archivedAt?: string;
};

export type CreateRewardInput = {
  title: string;
  description: string;
  cost: number;
  category?: RewardCategory;
};

export const rewardCategoryLabels: Record<RewardCategory, string> = {
  leisure: "Lazer",
  rest: "Descanso",
  social: "Social",
  purchase: "Compra",
  health: "Saude",
  learning: "Aprendizado",
};
