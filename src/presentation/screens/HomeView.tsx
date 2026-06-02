import { ArrowRight, Award, CheckCircle2, FileText, Flag, Swords, Trophy } from "lucide-react";
import { useState } from "react";
import { achievements } from "../../domain/achievements";
import type { Player } from "../../domain/player";
import type { CompleteQuestInput, Quest } from "../../domain/task";
import type { AppView } from "../navigation/appViews";
import type { AppFocus, CreateQuestIntent } from "../navigation/navigationIntent";
import { useProgressionSystem } from "../useProgressionSystem";
import { QuestCard } from "../components/QuestCard";
import { QuestDetailModal } from "../components/QuestDetailModal";
import { StatusPanel } from "../components/StatusPanel";
import { Metric } from "../components/Metric";

type HomeViewProps = {
  player: Player;
  quests: Quest[];
  onCompleteQuest: (id: string, input?: CompleteQuestInput) => Promise<void>;
  onNavigate: (view: AppView) => void;
  onCreateQuestIntent: (intent: CreateQuestIntent) => void;
  onFocusNavigate: (view: AppView, focus: AppFocus) => void;
};

export const HomeView = ({
  player,
  quests,
  onCompleteQuest,
  onNavigate,
  onCreateQuestIntent,
  onFocusNavigate,
}: HomeViewProps) => {
  const { progression } = useProgressionSystem();
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const openQuests = quests.filter((quest) => quest.status === "open").slice(0, 3);
  const completedQuests = quests.filter((quest) => quest.status === "completed");
  const unlockedCount = achievements.filter((achievement) =>
    player.unlockedAchievementIds.includes(achievement.id),
  ).length;
  const activeProject = progression.projects.find((project) => project.status === "active");
  const developingSkill = progression.skills.find((skill) => !skill.isUnlocked);
  const latestReview = player.dailyReviews[0];
  const hasEvidence = quests.some((quest) => quest.evidenceLog?.length) || progression.skills.some((skill) => skill.evidence);
  const hasEvidenceQuest = quests.some((quest) => quest.requiresEvidence);
  const firstOpenQuest = quests.find((quest) => quest.status === "open");
  const shouldShowFirstDayGuide = !latestReview || !hasEvidence || !hasEvidenceQuest;
  const selectedQuestProjectTitle = selectedQuest?.projectId
    ? progression.projects.find((project) => project.id === selectedQuest.projectId)?.title
    : undefined;

  return (
    <div className="view-grid view-grid-home">
      <QuestDetailModal
        quest={selectedQuest}
        projectTitle={selectedQuestProjectTitle}
        onClose={() => setSelectedQuest(null)}
        onCompleteQuest={onCompleteQuest}
        onOpenProject={(projectId) => onFocusNavigate("projects", { type: "project", id: projectId })}
      />
      <section className="welcome-panel command-panel">
        <div>
          <p className="eyebrow">Painel de comando</p>
          <h1>{player.name}</h1>
          <p className="welcome-copy">
            {player.focus
              ? `Foco atual: ${player.focus}`
              : "Escolha uma missao, registre evidencias reais e deixe o sistema cuidar do progresso."}
          </p>
        </div>
        <button type="button" onClick={() => onNavigate("create")}>
          Criar missao
          <ArrowRight size={18} />
        </button>
      </section>

      <div className="summary-strip">
        <Metric icon={<Swords size={18} />} label="Ativas" value={quests.filter((quest) => quest.status === "open").length} />
        <Metric icon={<Trophy size={18} />} label="Concluidas" value={completedQuests.length} />
        <Metric icon={<Award size={18} />} label="Conquistas" value={unlockedCount} />
      </div>

      {shouldShowFirstDayGuide && (
        <section className="content-panel span-all first-day-guide">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Setup guiado</p>
              <h2>Primeiro dia no sistema</h2>
            </div>
            <Flag size={24} />
          </div>
          <div className="first-day-steps">
            <button
              type="button"
              className={quests.length > 0 ? "first-day-step first-day-step-done" : "first-day-step"}
              onClick={() =>
                onCreateQuestIntent({
                  kind: "single",
                  recurrence: "none",
                  difficulty: "normal",
                  attribute: "discipline",
                  requiresEvidence: true,
                  importance: "Primeira missao real para registrar uma evidencia concreta.",
                })
              }
            >
              <CheckCircle2 size={18} />
              <strong>Criar uma missao real</strong>
              <span>{quests.length > 0 ? "Missao criada" : "Comece com uma acao pequena e concreta"}</span>
            </button>
            <button
              type="button"
              className={hasEvidence ? "first-day-step first-day-step-done" : "first-day-step"}
              onClick={() => (firstOpenQuest ? setSelectedQuest(firstOpenQuest) : onNavigate("create"))}
            >
              <FileText size={18} />
              <strong>Registrar evidencia</strong>
              <span>{hasEvidence ? "Prova registrada" : "Conclua uma missao com nota real"}</span>
            </button>
            <button
              type="button"
              className={latestReview ? "first-day-step first-day-step-done" : "first-day-step"}
              onClick={() => onNavigate("today")}
            >
              <Trophy size={18} />
              <strong>Encerrar o dia</strong>
              <span>{latestReview ? `Ultimo rank ${latestReview.rank}` : "Compute XP, moedas e resumo"}</span>
            </button>
          </div>
        </section>
      )}

      <section className="content-panel span-all command-center-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Continuar fluxo</p>
            <h2>Proximos atalhos</h2>
          </div>
        </div>
        <div className="context-action-grid">
          <button
            type="button"
            onClick={() =>
              onCreateQuestIntent({
                kind: "daily",
                recurrence: "daily",
                difficulty: "normal",
                projectId: activeProject?.id,
                attribute: activeProject?.attribute ?? "discipline",
              })
            }
          >
            <strong>Adicionar missao</strong>
            <span>{activeProject ? `Vinculada a ${activeProject.title}` : "Criar proxima acao"}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              activeProject
                ? onFocusNavigate("projects", { type: "project", id: activeProject.id })
                : onNavigate("projects")
            }
          >
            <strong>Projeto em foco</strong>
            <span>{activeProject?.title ?? "Criar ou revisar projetos"}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              developingSkill
                ? onFocusNavigate("skills", { type: "skill", id: developingSkill.id })
                : onNavigate("skills")
            }
          >
            <strong>Skill em desenvolvimento</strong>
            <span>{developingSkill?.title ?? "Registrar habilidade real"}</span>
          </button>
          <button type="button" onClick={() => onNavigate("reports")}>
            <strong>Ultimo fechamento</strong>
            <span>{latestReview ? `${latestReview.date} · Rank ${latestReview.rank}` : "Encerrar o primeiro dia"}</span>
          </button>
        </div>
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Proximas missoes</p>
            <h2>Fila ativa</h2>
          </div>
          <button type="button" onClick={() => onNavigate("missions")}>
            Ver todas
          </button>
        </div>
        <div className="quest-list">
          {openQuests.length === 0 ? (
            <div className="empty-state">Nenhuma missao ativa.</div>
          ) : (
            openQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} onCompleteQuest={onCompleteQuest} onOpenDetails={setSelectedQuest} />
            ))
          )}
        </div>
      </section>

      <StatusPanel player={player} quests={quests} onFocusNavigate={onFocusNavigate} />
    </div>
  );
};
