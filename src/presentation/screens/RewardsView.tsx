import { FormEvent } from "react";
import { Coins, Gift, Trash2 } from "lucide-react";
import { useRewards } from "../useRewards";

export const RewardsView = () => {
  const { rewards, player, isLoading, error, createReward, redeemReward, archiveReward } = useRewards();

  const handleCreateReward = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await createReward({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      cost: Number(formData.get("cost") ?? 1),
    });
    event.currentTarget.reset();
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
        <form className="stacked-form" onSubmit={handleCreateReward}>
          <input name="title" placeholder="Ex: noite de filme" aria-label="Titulo da recompensa" />
          <textarea name="description" placeholder="Recompensa real que voce pode usar" aria-label="Descricao" />
          <input name="cost" type="number" min="1" defaultValue="50" aria-label="Custo" />
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
                  <button type="button" onClick={() => redeemReward(reward.id)} disabled={player.coins < reward.cost}>
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
