import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Clock3, Crosshair, ExternalLink, Sparkles, Target, X } from "lucide-react";
import { FormEvent, useState } from "react";
import type { CompleteQuestInput, Quest } from "../../domain/task";
import { attributeLabels, difficultyLabels, questKindLabels, statusLabels } from "../viewModels";

type QuestDetailModalProps = {
  quest: Quest | null;
  projectTitle?: string;
  onClose: () => void;
  onCompleteQuest: (id: string, input?: CompleteQuestInput) => Promise<void>;
  onOpenFocus?: (id: string) => void;
  onOpenProject?: (projectId: string) => void;
};

export const QuestDetailModal = ({
  quest,
  projectTitle,
  onClose,
  onCompleteQuest,
  onOpenFocus,
  onOpenProject,
}: QuestDetailModalProps) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!quest) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    setIsCompleting(true);

    try {
      await onCompleteQuest(quest.id, { evidence: String(formData.get("evidence") ?? "") });
      onClose();
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <AnimatePresence>
      {quest && (
        <motion.div
          className="quest-detail-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            className="quest-detail-modal"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
          >
            <button className="daily-review-close" type="button" onClick={onClose} title="Fechar ficha">
              <X size={18} />
            </button>
            <div className="quest-detail-header">
              <div>
                <p className="eyebrow">Ficha da missao</p>
                <h1>{quest.title}</h1>
                <span>{statusLabels[quest.status]}</span>
              </div>
              <div className="quest-detail-rank">Rank {difficultyLabels[quest.difficulty]}</div>
            </div>

            <div className="quest-detail-grid">
              <div>
                <Target size={18} />
                <span>Atributo</span>
                <strong>{attributeLabels[quest.attribute]}</strong>
              </div>
              <div>
                <Sparkles size={18} />
                <span>Tipo</span>
                <strong>{questKindLabels[quest.kind]}</strong>
              </div>
              <div>
                <Clock3 size={18} />
                <span>Prazo</span>
                <strong>{quest.dueAt ? new Date(`${quest.dueAt}T00:00:00`).toLocaleDateString("pt-BR") : "Livre"}</strong>
              </div>
            </div>

            {quest.importance && (
              <div className="quest-detail-block">
                <span>Por que importa</span>
                <p>{quest.importance}</p>
              </div>
            )}

            {projectTitle && (
              <button
                className="quest-project-link"
                type="button"
                onClick={() => quest.projectId && onOpenProject?.(quest.projectId)}
              >
                <ExternalLink size={16} />
                {projectTitle}
              </button>
            )}

            <div className="quest-detail-block">
              <span>Evidencias registradas</span>
              {quest.evidenceLog?.length ? (
                <div className="quest-evidence-log">
                  {quest.evidenceLog.map((evidence) => (
                    <article key={evidence.id}>
                      <strong>{new Date(evidence.createdAt).toLocaleDateString("pt-BR")}</strong>
                      <p>{evidence.text}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted-text">Nenhuma evidencia ainda. Use a conclusao com nota para registrar uma prova real.</p>
              )}
            </div>

            {quest.status === "open" && (
              <form className="quest-evidence-form" onSubmit={handleComplete}>
                <textarea
                  name="evidence"
                  placeholder="O que foi feito? Qual prova real, aprendizado ou resultado essa missao gerou?"
                  aria-label="Evidencia da missao"
                />
                <div className="quest-detail-actions">
                  {onOpenFocus && (
                    <button type="button" className="secondary-button" onClick={() => onOpenFocus(quest.id)}>
                      <Crosshair size={18} />
                      Foco
                    </button>
                  )}
                  <button type="submit" disabled={isCompleting}>
                    <CheckCircle2 size={18} />
                    {isCompleting ? "Computando..." : "Concluir com evidencia"}
                  </button>
                </div>
              </form>
            )}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
