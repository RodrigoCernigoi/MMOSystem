import { FormEvent } from "react";
import { Coins, Gift, Scale, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRewards } from "../useRewards";

export const RewardsView = () => {
  const { rewards, player, isLoading, error, createReward, redeemReward, archiveReward } = useRewards();
  const [rewardActionError, setRewardActionError] = useState<string | null>(null);

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
        <form className="stacked-form" onSubmit={handleCreateReward}>
          <input name="title" placeholder="Ex: noite de filme" aria-label="Titulo da recompensa" />
          <textarea name="description" placeholder="Recompensa real que voce pode usar" aria-label="Descricao" />
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
                  <span>{reward.cost} moedas</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="content-panel span-all">
        <div className="reward-grid">
          {rewards.length === 0 ? (
            <div className="empty-state">Crie recompensas reais para gastar suas moedas.</div>
          ) : (
            rewards.map((reward) => (
              <article className="reward-card" key={reward.id}>
                <span>{reward.cost} moedas</span>
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
