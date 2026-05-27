export type Reward = {
  id: string;
  title: string;
  description: string;
  cost: number;
  createdAt: string;
  archivedAt?: string;
};

export type CreateRewardInput = {
  title: string;
  description: string;
  cost: number;
};
