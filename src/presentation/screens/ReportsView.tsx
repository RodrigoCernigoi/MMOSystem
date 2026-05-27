import { BarChart3, Clock3, Coins, Flame, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { useState } from "react";
import type { Player } from "../../domain/player";
import { Metric } from "../components/Metric";
import { Tabs } from "../components/Tabs";
import { useFocusSessions } from "../useFocusSessions";

type ReportsViewProps = {
  player: Player;
};

export const ReportsView = ({ player }: ReportsViewProps) => {
  const [activeTab, setActiveTab] = useState<"chart" | "weekly" | "history">("chart");
  const { sessions } = useFocusSessions();
  const reviews = [...player.dailyReviews].sort((left, right) => right.date.localeCompare(left.date));
  const recentReviews = reviews.slice(0, 14).reverse();
  const totalClosedDays = reviews.length;
  const totalBonusXp = reviews.reduce((total, review) => total + review.bonus.xp, 0);
  const totalBonusCoins = reviews.reduce((total, review) => total + review.bonus.coins, 0);
  const totalSkillPoints = reviews.reduce((total, review) => total + review.bonus.skillPoints, 0);
  const maxXp = Math.max(1, ...recentReviews.map((review) => review.xpEarned + review.bonus.xp));
  const maxTasks = Math.max(1, ...recentReviews.map((review) => review.completedQuestCount + review.completedHabitCount));
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartKey = weekStart.toISOString().slice(0, 10);
  const weekReviews = player.dailyReviews.filter((review) => review.date >= weekStartKey);
  const weekHistory = player.dailyHistory.filter((entry) => entry.date >= weekStartKey);
  const weekSessions = sessions.filter((session) => session.startedAt.slice(0, 10) >= weekStartKey);
  const weekActions = weekHistory.reduce(
    (total, entry) => total + entry.completedQuestIds.length + entry.completedHabitIds.length,
    0,
  );
  const weekFocusMinutes = Math.round(weekSessions.reduce((total, session) => total + session.elapsedSeconds, 0) / 60);
  const weekInterruptions = weekSessions.reduce((total, session) => total + session.interruptionCount, 0);
  const bestDay = [...weekReviews].sort(
    (left, right) =>
      right.completedQuestCount + right.completedHabitCount - (left.completedQuestCount + left.completedHabitCount),
  )[0];
  const weeklySignal =
    weekActions >= 20
      ? "Semana forte: mantenha o volume e proteja recuperacao."
      : weekFocusMinutes >= 120
        ? "Boa profundidade: transforme foco em conclusoes menores."
        : "Semana em aquecimento: escolha uma missao diaria simples para estabilizar ritmo.";

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
            { id: "weekly", label: "Semana", indicator: weekActions },
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
          {activeTab === "weekly" && (
            <div className="weekly-report">
              <div className="summary-strip">
                <Metric icon={<Target size={18} />} label="Acoes na semana" value={weekActions} />
                <Metric icon={<Clock3 size={18} />} label="Minutos em foco" value={weekFocusMinutes} />
                <Metric icon={<Zap size={18} />} label="Interrupcoes" value={weekInterruptions} />
                <Metric icon={<Flame size={18} />} label="Dias fechados" value={weekReviews.length} />
              </div>
              <article className="weekly-insight">
                <p className="eyebrow">Leitura semanal</p>
                <h3>{weeklySignal}</h3>
                <span>
                  Melhor dia:{" "}
                  {bestDay
                    ? `${bestDay.date} · ${bestDay.completedQuestCount + bestDay.completedHabitCount} acoes · Rank ${bestDay.rank}`
                    : "ainda sem fechamento nesta semana"}
                </span>
              </article>
              <div className="weekly-session-list">
                {weekSessions.length === 0 ? (
                  <div className="empty-state visual-empty-state">Sessões de foco aparecerão aqui durante a semana.</div>
                ) : (
                  weekSessions.slice(0, 6).map((session) => (
                    <article className="weekly-session-card" key={session.id}>
                      <strong>{session.questTitle}</strong>
                      <span>{Math.round(session.elapsedSeconds / 60)} min em foco</span>
                      <span>{session.interruptionCount} interrupcoes</span>
                      {session.note && <p>{session.note}</p>}
                    </article>
                  ))
                )}
              </div>
            </div>
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
