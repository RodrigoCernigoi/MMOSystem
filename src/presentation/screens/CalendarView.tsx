import { CalendarCheck2, Coins, Flame, Sparkles, Target } from "lucide-react";
import type { Player } from "../../domain/player";
import { getWeekDays, toDateKey } from "../../domain/schedule";
import type { Quest } from "../../domain/task";
import { Metric } from "../components/Metric";

type CalendarViewProps = {
  player: Player;
  quests: Quest[];
};

const getRecentDays = (amount: number) =>
  Array.from({ length: amount }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (amount - 1 - index));
    return toDateKey(date);
  });

export const CalendarView = ({ player, quests }: CalendarViewProps) => {
  const days = getWeekDays();
  const recentDays = getRecentDays(35);
  const historyByDate = new Map(player.dailyHistory.map((entry) => [entry.date, entry]));
  const reviewByDate = new Map(player.dailyReviews.map((entry) => [entry.date, entry]));
  const closedDays = player.dailyReviews.length;
  const actionsTracked = player.dailyHistory.reduce(
    (total, entry) => total + entry.completedQuestIds.length + entry.completedHabitIds.length,
    0,
  );
  const bonusTotal = player.dailyReviews.reduce((total, review) => total + review.bonus.xp + review.bonus.coins, 0);
  const overdue = quests.filter(
    (quest) => quest.status === "open" && quest.dueAt && quest.dueAt < new Date().toISOString().slice(0, 10),
  );

  return (
    <div className="view-grid view-grid-wide">
      <section className="content-panel span-all">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Agenda</p>
            <h1>Calendario operacional</h1>
          </div>
        </div>
        {overdue.length > 0 && <div className="error-banner">{overdue.length} missao atrasada</div>}
        <div className="summary-strip">
          <Metric icon={<Flame size={18} />} label="Streak atual" value={player.streak} />
          <Metric icon={<CalendarCheck2 size={18} />} label="Dias fechados" value={closedDays} />
          <Metric icon={<Target size={18} />} label="Acoes registradas" value={actionsTracked} />
          <Metric icon={<Sparkles size={18} />} label="Bonus total" value={bonusTotal} />
        </div>
      </section>

      <section className="content-panel span-all">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Semana</p>
            <h2>Missoes agendadas</h2>
          </div>
        </div>
        <div className="calendar-grid">
          {days.map((day) => {
            const dayQuests = quests.filter((quest) => quest.dueAt === day);
            return (
              <article className="calendar-day" key={day}>
                <strong>
                  {new Date(`${day}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" })}
                </strong>
                {dayQuests.length === 0 ? (
                  <span>Nada marcado</span>
                ) : (
                  dayQuests.map((quest) => <span key={quest.id}>{quest.title}</span>)
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="content-panel span-all">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Consistencia</p>
            <h2>Ultimos 35 dias</h2>
          </div>
        </div>
        <div className="history-calendar">
          {recentDays.map((day) => {
            const history = historyByDate.get(day);
            const review = reviewByDate.get(day);
            const completed = (history?.completedQuestIds.length ?? 0) + (history?.completedHabitIds.length ?? 0);
            const intensity = Math.min(4, completed);

            return (
              <article
                className={`history-day history-day-level-${intensity}${review ? " history-day-closed" : ""}`}
                key={day}
                title={`${day}: ${completed} acoes${review ? `, rank ${review.rank}` : ""}`}
              >
                <span>{new Date(`${day}T00:00:00`).getDate()}</span>
                {review ? <strong>{review.rank}</strong> : <small>{completed}</small>}
              </article>
            );
          })}
        </div>
        <div className="calendar-legend">
          <span>
            <Coins size={15} />
            Cor mais intensa = mais acoes concluidas
          </span>
          <span>
            <CalendarCheck2 size={15} />
            Letra = dia encerrado com rank
          </span>
        </div>
      </section>
    </div>
  );
};
