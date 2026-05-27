import { Shield } from "lucide-react";
import { useMemo } from "react";
import type { CreateQuestInput, Quest } from "../../domain/task";
import { QuestCard } from "./QuestCard";
import { QuestForm } from "./QuestForm";

type QuestBoardProps = {
  quests: Quest[];
  error: string | null;
  onCreateQuest: (input: CreateQuestInput) => Promise<void>;
  onCompleteQuest: (id: string) => Promise<void>;
  onSuggestQuest: (goal: string) => Promise<CreateQuestInput>;
};

export const QuestBoard = ({
  quests,
  error,
  onCreateQuest,
  onCompleteQuest,
  onSuggestQuest,
}: QuestBoardProps) => {
  const visibleQuests = useMemo(
    () =>
      [...quests].sort((left, right) => {
        const statusOrder = { open: 0, failed: 1, completed: 2, archived: 3 };
        return statusOrder[left.status] - statusOrder[right.status];
      }),
    [quests],
  );

  return (
    <section className="quest-board">
      <div className="board-header">
        <div>
          <p className="eyebrow">Quest board</p>
          <h2>Missoes atuais</h2>
        </div>
        <Shield size={30} />
      </div>

      <QuestForm onCreateQuest={onCreateQuest} onSuggestQuest={onSuggestQuest} />

      {error && <div className="error-banner">{error}</div>}

      <div className="quest-list">
        {visibleQuests.length === 0 ? (
          <div className="empty-state">Nenhuma missao ativa.</div>
        ) : (
          visibleQuests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} onCompleteQuest={onCompleteQuest} />
          ))
        )}
      </div>
    </section>
  );
};
