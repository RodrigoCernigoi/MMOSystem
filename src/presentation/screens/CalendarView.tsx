import { getWeekDays } from "../../domain/schedule";
import type { Quest } from "../../domain/task";

type CalendarViewProps = {
  quests: Quest[];
};

export const CalendarView = ({ quests }: CalendarViewProps) => {
  const days = getWeekDays();
  const overdue = quests.filter(
    (quest) => quest.status === "open" && quest.dueAt && quest.dueAt < new Date().toISOString().slice(0, 10),
  );

  return (
    <section className="content-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Agenda</p>
          <h1>Semana</h1>
        </div>
      </div>
      {overdue.length > 0 && <div className="error-banner">{overdue.length} missao atrasada</div>}
      <div className="calendar-grid">
        {days.map((day) => {
          const dayQuests = quests.filter((quest) => quest.dueAt === day);
          return (
            <article className="calendar-day" key={day}>
              <strong>{new Date(`${day}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" })}</strong>
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
  );
};
