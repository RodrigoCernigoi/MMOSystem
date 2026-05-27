import { BarChart3, Coins, Sparkles, Target, Trophy } from "lucide-react";
import { useState } from "react";
import type { Player } from "../../domain/player";
import { Metric } from "../components/Metric";
import { Tabs } from "../components/Tabs";

type ReportsViewProps = {
  player: Player;
};

export const ReportsView = ({ player }: ReportsViewProps) => {
  const [activeTab, setActiveTab] = useState<"chart" | "history">("chart");
  const reviews = [...player.dailyReviews].sort((left, right) => right.date.localeCompare(left.date));
  const recentReviews = reviews.slice(0, 14).reverse();
  const totalClosedDays = reviews.length;
  const totalBonusXp = reviews.reduce((total, review) => total + review.bonus.xp, 0);
  const totalBonusCoins = reviews.reduce((total, review) => total + review.bonus.coins, 0);
  const totalSkillPoints = reviews.reduce((total, review) => total + review.bonus.skillPoints, 0);
  const maxXp = Math.max(1, ...recentReviews.map((review) => review.xpEarned + review.bonus.xp));
  const maxTasks = Math.max(1, ...recentReviews.map((review) => review.completedQuestCount + review.completedHabitCount));

  return (
    <div className="view-grid view-grid-wide">
      <section className="content-panel span-all">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Historico</p>
            <h1>Relatorios diarios</h1>
          </div>
        </div>
        <div className="summary-strip">
          <Metric icon={<BarChart3 size={18} />} label="Dias fechados" value={totalClosedDays} />
          <Metric icon={<Sparkles size={18} />} label="Bonus XP" value={totalBonusXp} />
          <Metric icon={<Coins size={18} />} label="Bonus moedas" value={totalBonusCoins} />
          <Metric icon={<Trophy size={18} />} label="Skill points" value={totalSkillPoints} />
        </div>
      </section>

      <section className="content-panel span-all">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Navegacao</p>
            <h2>Analise</h2>
          </div>
        </div>
        <Tabs
          activeId={activeTab}
          onChange={setActiveTab}
          items={[
            { id: "chart", label: "Grafico", indicator: recentReviews.length },
            { id: "history", label: "Historico", indicator: reviews.length },
          ]}
        >
          {activeTab === "chart" && (
            recentReviews.length === 0 ? (
              <div className="empty-state visual-empty-state">Nenhum dia encerrado ainda.</div>
            ) : (
              <div className="review-chart">
                {recentReviews.map((review) => {
                  const xpHeight = Math.max(8, ((review.xpEarned + review.bonus.xp) / maxXp) * 100);
                  const taskHeight =
                    Math.max(8, ((review.completedQuestCount + review.completedHabitCount) / maxTasks) * 100);

                  return (
                    <div className="review-chart-day" key={review.id}>
                      <div className="review-chart-bars">
                        <span className="review-bar review-bar-xp" style={{ height: `${xpHeight}%` }} />
                        <span className="review-bar review-bar-tasks" style={{ height: `${taskHeight}%` }} />
                      </div>
                      <strong>{review.rank}</strong>
                      <span>{review.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            )
          )}
          {activeTab === "history" && (
            <div className="quest-list">
              {reviews.length === 0 ? (
                <div className="empty-state visual-empty-state">Encerrar o dia cria o primeiro registro aqui.</div>
              ) : (
                reviews.map((review) => (
                  <article className="daily-report-row" key={review.id}>
                    <div>
                      <p className="eyebrow">{new Date(review.closedAt).toLocaleString()}</p>
                      <h3>{review.date}</h3>
                    </div>
                    <div className="daily-report-stats">
                      <span>
                        <Target size={16} />
                        {review.completedQuestCount + review.completedHabitCount} feitas
                      </span>
                      <span>
                        <Sparkles size={16} />
                        {review.xpEarned}+{review.bonus.xp} XP
                      </span>
                      <span>
                        <Coins size={16} />
                        {review.coinsEarned}+{review.bonus.coins}
                      </span>
                      <strong>Rank {review.rank}</strong>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}
        </Tabs>
      </section>
    </div>
  );
};
