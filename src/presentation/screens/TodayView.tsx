import { Coins, Target, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { calculateHabitStreak } from "../../domain/habitStats";
import { isHabitDoneToday, isQuestForToday, toDateKey } from "../../domain/schedule";
import type { Player } from "../../domain/player";
import type { Quest } from "../../domain/task";
import { QuestCard } from "../components/QuestCard";
import { DailyReviewOverlay } from "../components/DailyReviewOverlay";
import { Metric } from "../components/Metric";
import { Tabs } from "../components/Tabs";

type TodayViewProps = {
  player: Player;
  quests: Quest[];
  onCompleteQuest: (id: string) => Promise<void>;
  onEndDay: (date: string) => Promise<unknown>;
  reviewRequestId?: number;
};

export const TodayView = ({ player, quests, onCompleteQuest, onEndDay, reviewRequestId = 0 }: TodayViewProps) => {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"habits" | "missions" | "projects">("habits");
  const today = toDateKey(new Date());
  const todayQuests = quests.filter((quest) => isQuestForToday(quest, today));
  const todayHistory = player.dailyHistory.find((entry) => entry.date === today);
  const todayReview = player.dailyReviews.find((entry) => entry.date === today);
  const pendingHabits = todayQuests.filter((quest) => quest.kind === "habit" && !isHabitDoneToday(quest, today));
  const doneHabits = todayQuests.filter((quest) => quest.kind === "habit" && isHabitDoneToday(quest, today));
  const dueToday = todayQuests.filter((quest) => quest.kind !== "habit");
  const plannedXp = todayQuests.length * 50;

  useEffect(() => {
    if (reviewRequestId > 0) {
      setIsReviewOpen(true);
    }
  }, [reviewRequestId]);

  return (
    <div className="view-grid view-grid-wide">
      <section className="content-panel span-all">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Hoje</p>
            <h1>Painel diario</h1>
          </div>
          <button type="button" onClick={() => setIsReviewOpen(true)}>
            {todayReview ? "Ver fechamento" : "Encerrar dia"}
          </button>
        </div>
        <div className="summary-strip">
          <Metric icon={<Target size={18} />} label="Pendentes" value={todayQuests.length} />
          <Metric icon={<Trophy size={18} />} label="Habitos" value={pendingHabits.length} />
          <Metric icon={<Coins size={18} />} label="XP previsto" value={plannedXp} />
        </div>
      </section>

      <section className="content-panel span-all">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Revisao diaria</p>
            <h2>Resumo de hoje</h2>
          </div>
        </div>
        <div className="summary-strip">
          <Metric icon={<Target size={18} />} label="Missoes feitas" value={todayHistory?.completedQuestIds.length ?? 0} />
          <Metric icon={<Trophy size={18} />} label="Habitos feitos" value={todayHistory?.completedHabitIds.length ?? 0} />
          <Metric icon={<Coins size={18} />} label="Moedas hoje" value={todayHistory?.coinsEarned ?? 0} />
          <Metric icon={<Trophy size={18} />} label="Fechamento" value={todayReview ? 1 : 0} />
        </div>
      </section>

      <section className="content-panel span-all">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Cockpit</p>
            <h2>Foco do dia</h2>
          </div>
        </div>
        <Tabs
          activeId={activeTab}
          onChange={setActiveTab}
          items={[
            { id: "habits", label: "Habitos", indicator: pendingHabits.length },
            { id: "missions", label: "Missoes", indicator: dueToday.length },
            {
              id: "projects",
              label: "Projetos",
              indicator: quests.filter((quest) => quest.status === "open" && quest.projectId).length,
            },
          ]}
        >
          {activeTab === "habits" && (
            <div className="quest-list">
              {pendingHabits.length === 0 && doneHabits.length === 0 ? (
                <div className="empty-state visual-empty-state">Habitos de hoje em dia.</div>
              ) : (
                <>
                  {pendingHabits.map((quest) => (
                    <div className="habit-card-wrap" key={quest.id}>
                      <QuestCard quest={quest} onCompleteQuest={onCompleteQuest} />
                      <span>Streak: {calculateHabitStreak(quest)} dias</span>
                    </div>
                  ))}
                  {doneHabits.map((quest) => (
                    <div className="habit-card-wrap" key={quest.id}>
                      <QuestCard quest={quest} onCompleteQuest={onCompleteQuest} />
                      <span>Concluido hoje · Streak: {calculateHabitStreak(quest)} dias</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
          {activeTab === "missions" && (
            <div className="quest-list">
              {dueToday.length === 0 ? (
                <div className="empty-state visual-empty-state">Nenhuma missao para hoje.</div>
              ) : (
                dueToday.map((quest) => <QuestCard key={quest.id} quest={quest} onCompleteQuest={onCompleteQuest} />)
              )}
            </div>
          )}
          {activeTab === "projects" && (
            <div className="quest-list">
              {quests.filter((quest) => quest.status === "open" && quest.projectId).length === 0 ? (
                <div className="empty-state visual-empty-state">Nenhuma missao de projeto em aberto.</div>
              ) : (
                quests
                  .filter((quest) => quest.status === "open" && quest.projectId)
                  .slice(0, 5)
                  .map((quest) => <QuestCard key={quest.id} quest={quest} onCompleteQuest={onCompleteQuest} />)
              )}
            </div>
          )}
        </Tabs>
      </section>
      <DailyReviewOverlay
        isOpen={isReviewOpen}
        player={player}
        quests={quests}
        date={today}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={() => onEndDay(today)}
      />
    </div>
  );
};
