import { motion } from "motion/react";
import { Archive, Check, Crosshair, ExternalLink, FileText, Pencil, Trash2 } from "lucide-react";
import { describeQuestSchedule } from "../../domain/schedule";
import type { CompleteQuestInput, Quest } from "../../domain/task";
import { cardMotion } from "../motion/transitions";
import { attributeLabels, difficultyLabels, questKindLabels, statusLabels } from "../viewModels";

type QuestCardProps = {
  quest: Quest;
  onCompleteQuest: (id: string, input?: CompleteQuestInput) => Promise<void>;
  onEditQuest?: (quest: Quest) => void;
  onArchiveQuest?: (id: string) => Promise<void>;
  onDeleteQuest?: (id: string) => Promise<void>;
  onOpenProject?: (projectId: string) => void;
  onOpenFocus?: (id: string) => void;
  onOpenDetails?: (quest: Quest) => void;
  projectTitle?: string;
  isUrgent?: boolean;
  isCompact?: boolean;
};

export const QuestCard = ({
  quest,
  onCompleteQuest,
  onEditQuest,
  onArchiveQuest,
  onDeleteQuest,
  onOpenProject,
  onOpenFocus,
  onOpenDetails,
  projectTitle,
  isUrgent = false,
  isCompact = false,
}: QuestCardProps) => {
  const scheduleDescription = describeQuestSchedule(quest);

  return (
    <motion.article
      className={[
        "quest-card",
        `quest-card-${quest.status}`,
        isUrgent ? "quest-card-urgent" : "",
        isCompact ? "quest-card-compact" : "",
      ].join(" ")}
      layout
      {...cardMotion}
    >
      <div>
        <div className="quest-meta">
          <span className="quest-rank">Rank {difficultyLabels[quest.difficulty]}</span>
          <span>{questKindLabels[quest.kind]}</span>
          <span>{statusLabels[quest.status]}</span>
          {scheduleDescription && <span>{scheduleDescription}</span>}
          {projectTitle && <span>{projectTitle}</span>}
          {quest.requiresEvidence && <span className="quest-evidence-chip">Evidencia</span>}
          {isUrgent && <span className="quest-urgency-chip">Prioridade</span>}
        </div>
        <h3>{quest.title}</h3>
        <p>
          {attributeLabels[quest.attribute]}
          {quest.dueAt ? ` · Prazo ${new Date(`${quest.dueAt}T00:00:00`).toLocaleDateString("pt-BR")}` : ""}
        </p>
        {quest.importance && <p>{quest.importance}</p>}
        {quest.evidenceLog?.[0] && <p className="quest-evidence-preview">Evidencia: {quest.evidenceLog[0].text}</p>}
      </div>
      <div className="quest-actions">
        {onOpenDetails && (
          <button type="button" onClick={() => onOpenDetails(quest)} title="Abrir ficha da missao">
            <FileText size={18} />
          </button>
        )}
        {quest.status === "open" && (
          <>
            <button
              type="button"
              onClick={() =>
                quest.requiresEvidence && onOpenDetails ? onOpenDetails(quest) : onCompleteQuest(quest.id)
              }
              title={quest.requiresEvidence ? "Abrir ficha para registrar evidencia" : "Concluir missao"}
            >
              <Check size={18} />
            </button>
            {onOpenFocus && (
              <button type="button" onClick={() => onOpenFocus(quest.id)} title="Modo foco">
                <Crosshair size={18} />
              </button>
            )}
            {onEditQuest && (
              <button type="button" onClick={() => onEditQuest(quest)} title="Editar missao">
                <Pencil size={18} />
              </button>
            )}
            {quest.projectId && onOpenProject && (
              <button type="button" onClick={() => onOpenProject(quest.projectId ?? "")} title="Abrir projeto">
                <ExternalLink size={18} />
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
};
