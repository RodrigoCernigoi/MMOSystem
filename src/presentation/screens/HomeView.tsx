import { ArrowRight, Award, Swords, Trophy } from "lucide-react";
import { achievements } from "../../domain/achievements";
import type { Player } from "../../domain/player";
import type { Quest } from "../../domain/task";
import type { AppView } from "../navigation/appViews";
import type { AppFocus, CreateQuestIntent } from "../navigation/navigationIntent";
import { useProgressionSystem } from "../useProgressionSystem";
import { QuestCard } from "../components/QuestCard";
import { StatusPanel } from "../components/StatusPanel";
import { Metric } from "../components/Metric";

type HomeViewProps = {
  player: Player;
  quests: Quest[];
  onCompleteQuest: (id: string) => Promise<void>;
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
  const openQuests = quests.filter((quest) => quest.status === "open").slice(0, 3);
  const completedQuests = quests.filter((quest) => quest.status === "completed");
  const unlockedCount = achievements.filter((achievement) =>
    player.unlockedAchievementIds.includes(achievement.id),
  ).length;
  const activeProject = progression.projects.find((project) => project.status === "active");
  const developingSkill = progression.skills.find((skill) => !skill.isUnlocked);
  const latestReview = player.dailyReviews[0];

  return (
    <div className="view-grid view-grid-home">
      <section className="welcome-panel">
        <div>
          <p className="eyebrow">Bem-vindo de volta</p>
          <h1>{player.name}</h1>
          <p className="welcome-copy">Escolha uma missao, mantenha o streak e deixe o sistema cuidar do progresso.</p>
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

      <section className="content-panel span-all">
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
              <QuestCard key={quest.id} quest={quest} onCompleteQuest={onCompleteQuest} />
            ))
          )}
        </div>
      </section>

      <StatusPanel player={player} quests={quests} />
    </div>
  );
};
