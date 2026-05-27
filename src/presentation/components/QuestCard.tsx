import { motion } from "motion/react";
import { Archive, Check, Pencil, Trash2 } from "lucide-react";
import type { Quest } from "../../domain/task";
import { cardMotion } from "../motion/transitions";
import { attributeLabels, difficultyLabels, questKindLabels, statusLabels } from "../viewModels";

type QuestCardProps = {
  quest: Quest;
  onCompleteQuest: (id: string) => Promise<void>;
  onEditQuest?: (quest: Quest) => void;
  onArchiveQuest?: (id: string) => Promise<void>;
  onDeleteQuest?: (id: string) => Promise<void>;
};

export const QuestCard = ({
  quest,
  onCompleteQuest,
  onEditQuest,
  onArchiveQuest,
  onDeleteQuest,
}: QuestCardProps) => (
  <motion.article className={`quest-card quest-card-${quest.status}`} layout {...cardMotion}>
    <div>
      <div className="quest-meta">
        <span className="quest-rank">Rank {difficultyLabels[quest.difficulty]}</span>
        <span>{questKindLabels[quest.kind]}</span>
        <span>{statusLabels[quest.status]}</span>
      </div>
      <h3>{quest.title}</h3>
      <p>
        {attributeLabels[quest.attribute]}
        {quest.dueAt ? ` · Prazo ${new Date(`${quest.dueAt}T00:00:00`).toLocaleDateString("pt-BR")}` : ""}
      </p>
      {quest.importance && <p>{quest.importance}</p>}
    </div>
    <div className="quest-actions">
      {quest.status === "open" && (
        <>
          <button type="button" onClick={() => onCompleteQuest(quest.id)} title="Concluir missao">
            <Check size={18} />
          </button>
          {onEditQuest && (
            <button type="button" onClick={() => onEditQuest(quest)} title="Editar missao">
              <Pencil size={18} />
            </button>
          )}
        </>
      )}
      {quest.status !== "archived" && onArchiveQuest && (
        <button type="button" onClick={() => onArchiveQuest(quest.id)} title="Arquivar missao">
          <Archive size={18} />
        </button>
      )}
      {onDeleteQuest && (
        <button type="button" className="danger-button" onClick={() => onDeleteQuest(quest.id)} title="Excluir missao">
          <Trash2 size={18} />
        </button>
      )}
    </div>
  </motion.article>
);
