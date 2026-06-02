import type { PlayerRepository, RewardRepository, Clock, IdProvider } from "./ports";
import type { CreateRewardInput, Reward } from "../domain/reward";

export type RewardService = ReturnType<typeof createRewardService>;

type RewardServiceDependencies = {
  rewardRepository: RewardRepository;
  playerRepository: PlayerRepository;
  idProvider: IdProvider;
  clock: Clock;
};

export const createRewardService = ({
  rewardRepository,
  playerRepository,
  idProvider,
  clock,
}: RewardServiceDependencies) => ({
  async getRewards() {
    const [storedRewards, player] = await Promise.all([rewardRepository.list(), playerRepository.get()]);
    const rewards = storedRewards.length === 0 ? createDefaultRewards(clock.now().toISOString()) : storedRewards;

    if (storedRewards.length === 0) {
      await rewardRepository.saveAll(rewards);
    }

    return {
      rewards: rewards.filter((reward) => !reward.archivedAt),
      player,
    };
  },

  async createReward(input: CreateRewardInput): Promise<Reward> {
    const reward: Reward = {
      id: idProvider.createId(),
      title: input.title.trim(),
      description: input.description.trim(),
      cost: Math.max(20, Math.floor(input.cost)),
      createdAt: clock.now().toISOString(),
    };

    if (!reward.title) {
      throw new Error("Reward title is required.");
    }

    const rewards = await rewardRepository.list();
    await rewardRepository.saveAll([reward, ...rewards]);
    return reward;
  },

  async redeemReward(rewardId: string) {
    const [rewards, player] = await Promise.all([rewardRepository.list(), playerRepository.get()]);
    const reward = rewards.find((item) => item.id === rewardId && !item.archivedAt);

    if (!reward) {
      throw new Error("Reward not found.");
    }

    if (player.coins < reward.cost) {
      throw new Error("Moedas insuficientes.");
    }

    const updatedPlayer = {
      ...player,
      coins: player.coins - reward.cost,
      redeemedRewards: [
        {
          id: idProvider.createId(),
          rewardId: reward.id,
          title: reward.title,
          cost: reward.cost,
          redeemedAt: clock.now().toISOString(),
        },
        ...(player.redeemedRewards ?? []),
      ],
    };

    await playerRepository.save(updatedPlayer);
    return updatedPlayer;
  },

  async archiveReward(rewardId: string) {
    const rewards = await rewardRepository.list();
    await rewardRepository.saveAll(
      rewards.map((reward) =>
        reward.id === rewardId ? { ...reward, archivedAt: clock.now().toISOString() } : reward,
      ),
    );
  },
});

const createDefaultRewards = (createdAt: string): Reward[] => [
  {
    id: "preset-reward-short-break",
    title: "Pausa intencional",
    description: "20 a 30 minutos de descanso, cafe, caminhada curta ou tempo longe da tela.",
    cost: 30,
    createdAt,
  },
  {
    id: "preset-reward-entertainment",
    title: "Sessao de lazer",
    description: "Filme, episodio, jogo ou leitura leve sem culpa depois de um ciclo real de progresso.",
    cost: 80,
    createdAt,
  },
  {
    id: "preset-reward-social",
    title: "Role ou encontro simples",
    description: "Uma saida planejada, convite social ou experiencia pequena fora da rotina.",
    cost: 140,
    createdAt,
  },
  {
    id: "preset-reward-purchase",
    title: "Compra planejada",
    description: "Um item pessoal pequeno, comprado com intencao e dentro do seu orcamento real.",
    cost: 220,
    createdAt,
  },
  {
    id: "preset-reward-recovery",
    title: "Meio periodo de recuperacao",
    description: "Bloco maior de descanso, hobby ou cuidado pessoal depois de uma semana consistente.",
    cost: 360,
    createdAt,
  },
];
