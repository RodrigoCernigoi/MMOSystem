import { FormEvent } from "react";
import { BarChart3, Coins, Gift, Scale, ShieldAlert, Trash2, WalletCards } from "lucide-react";
import { useState } from "react";
import type { RewardCategory } from "../../domain/reward";
import { rewardCategoryLabels } from "../../domain/reward";
import { useRewards } from "../useRewards";

const rewardCategories: Array<{ value: RewardCategory; label: string }> = Object.entries(rewardCategoryLabels).map(
  ([value, label]) => ({ value: value as RewardCategory, label }),
);

export const RewardsView = () => {
  const { rewards, player, isLoading, error, createReward, redeemReward, archiveReward } = useRewards();
  const [rewardActionError, setRewardActionError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<RewardCategory | "all">("all");

  const handleCreateReward = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const cost = Math.max(20, Number(formData.get("cost") ?? 20));

    try {
      setRewardActionError(null);
      await createReward({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        cost,
        category: String(formData.get("category") ?? "leisure") as RewardCategory,
      });
      event.currentTarget.reset();
    } catch (actionError) {
      setRewardActionError(
        actionError instanceof Error ? actionError.message : "Nao consegui criar essa recompensa agora.",
      );
    }
  };

  const handleRedeemReward = async (rewardId: string) => {
    try {
      setRewardActionError(null);
      await redeemReward(rewardId);
    } catch (actionError) {
      setRewardActionError(
        actionError instanceof Error ? actionError.message : "Nao consegui resgatar essa recompensa agora.",
      );
    }
  };

  if (isLoading || !player) {
    return <main className="loading">Carregando recompensas...</main>;
  }

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekStartKey = weekStart.toISOString().slice(0, 10);
  const weeklyHistory = player.dailyHistory.filter((entry) => entry.date >= weekStartKey);
  const weeklyEarned = weeklyHistory.reduce((total, entry) => total + entry.coinsEarned, 0);
  const weeklyBonusCoins = player.dailyReviews
    .filter((review) => review.date >= weekStartKey)
    .reduce((total, review) => total + review.bonus.coins, 0);
  const weeklyIncome = weeklyEarned + weeklyBonusCoins;
  const weeklySpent = (player.redeemedRewards ?? [])
    .filter((reward) => reward.redeemedAt.slice(0, 10) >= weekStartKey)
    .reduce((total, reward) => total + reward.cost, 0);
  const weeklyBudget = Math.max(120, Math.round(weeklyIncome * 0.75));
  const budgetUsage = weeklyBudget === 0 ? 0 : Math.round((weeklySpent / weeklyBudget) * 100);
  const cheapRewardCount = rewards.filter((reward) => reward.cost <= 40).length;
  const economyWarnings = [
    budgetUsage > 100 ? "Voce ja passou do orçamento semanal sugerido de recompensas." : null,
    cheapRewardCount >= 4 ? "Ha muitas recompensas baratas. Isso pode diluir o valor das moedas." : null,
    weeklyIncome > 180 && weeklySpent === 0 ? "Boa acumulacao. Planeje um resgate intencional para manter o ciclo saudavel." : null,
  ].filter(Boolean) as string[];
  const visibleRewards = rewards.filter((reward) => categoryFilter === "all" || reward.category === categoryFilter);

  return (
    <div className="view-grid view-grid-wide">
      <section className="content-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Real rewards</p>
            <h1>Loja</h1>
          </div>
          <span className="rank-badge">
            <Coins size={16} />
            {player.coins}
          </span>
        </div>
        {error && <div className="error-banner">{error}</div>}
        {rewardActionError && <div className="error-banner">{rewardActionError}</div>}
        <div className="economy-panel">
          <Scale size={20} />
          <div>
            <strong>Escala economica</strong>
            <span>30 moedas = pausa curta · 80 = lazer comum · 140+ = experiencia maior · 300+ = recompensa de ciclo.</span>
          </div>
        </div>
        <div className="economy-dashboard">
          <div>
            <WalletCards size={18} />
            <span>Ganho semanal</span>
            <strong>{weeklyIncome}</strong>
          </div>
          <div>
            <Coins size={18} />
            <span>Gasto semanal</span>
            <strong>{weeklySpent}</strong>
          </div>
          <div>
            <BarChart3 size={18} />
            <span>Orcamento sugerido</span>
            <strong>{weeklyBudget}</strong>
          </div>
        </div>
        <div className="budget-panel">
          <div>
            <strong>Uso do orçamento semanal</strong>
            <span>{Math.min(999, budgetUsage)}%</span>
          </div>
          <div className="budget-track">
            <div style={{ width: `${Math.min(100, budgetUsage)}%` }} />
          </div>
        </div>
        {economyWarnings.length > 0 && (
          <div className="economy-warning-list">
            {economyWarnings.map((warning) => (
              <span key={warning}>
                <ShieldAlert size={16} />
                {warning}
              </span>
            ))}
          </div>
        )}
        <form className="stacked-form" onSubmit={handleCreateReward}>
          <input name="title" placeholder="Ex: noite de filme" aria-label="Titulo da recompensa" />
          <textarea name="description" placeholder="Recompensa real que voce pode usar" aria-label="Descricao" />
          <select name="category" defaultValue="leisure" aria-label="Categoria da recompensa">
            {rewardCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          <input name="cost" type="number" min="20" defaultValue="80" aria-label="Custo" />
          <button type="submit">Criar recompensa</button>
        </form>
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Historico</p>
            <h1>Resgates</h1>
          </div>
        </div>
        <div className="settings-list">
          {(player.redeemedRewards ?? []).length === 0 ? (
            <div className="empty-state">Nenhuma recompensa resgatada.</div>
          ) : (
            player.redeemedRewards.map((reward) => (
              <div className="settings-row" key={reward.id}>
                <Gift size={20} />
                <div>
                  <strong>{reward.title}</strong>
                  <span>
                    {reward.cost} moedas · {reward.category ? rewardCategoryLabels[reward.category as RewardCategory] : "Lazer"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="content-panel span-all">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Catalogo</p>
            <h1>Recompensas</h1>
          </div>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as RewardCategory | "all")}>
            <option value="all">Todas categorias</option>
            {rewardCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <div className="reward-grid">
          {visibleRewards.length === 0 ? (
            <div className="empty-state">Crie recompensas reais para gastar suas moedas.</div>
          ) : (
            visibleRewards.map((reward) => (
              <article className="reward-card" key={reward.id}>
                <span>
                  {reward.cost} moedas · {rewardCategoryLabels[reward.category]}
                </span>
                <strong>{reward.title}</strong>
                <p>{reward.description}</p>
                <div className="inline-actions">
                  <button type="button" onClick={() => handleRedeemReward(reward.id)} disabled={player.coins < reward.cost}>
                    Resgatar
                  </button>
                  <button type="button" className="danger-button" onClick={() => archiveReward(reward.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
