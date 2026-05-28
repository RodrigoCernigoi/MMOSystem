import { Award, BadgeCheck, Coins, IdCard, Medal, Save, Sparkles, Swords, Trophy } from "lucide-react";
import { FormEvent, useState } from "react";
import { achievements } from "../../domain/achievements";
import { xpRequiredForLevel } from "../../domain/progression";
import type { Player } from "../../domain/player";
import type { UpdatePlayerProfileInput } from "../../application/questService";
import type { Attribute, Quest } from "../../domain/task";
import { useFocusSessions } from "../useFocusSessions";
import { useProgressionSystem } from "../useProgressionSystem";
import type { AppView } from "../navigation/appViews";
import type { AppFocus } from "../navigation/navigationIntent";
import { attributeLabels } from "../viewModels";
import { Metric } from "./Metric";

type StatusPanelProps = {
  player: Player;
  quests: Quest[];
  onUpdateProfile?: (input: UpdatePlayerProfileInput) => Promise<unknown>;
  onFocusNavigate?: (view: AppView, focus: AppFocus) => void;
};

const avatarOptions = [
  { value: "spark", label: "Spark" },
  { value: "focus", label: "Focus" },
  { value: "forge", label: "Forge" },
  { value: "vital", label: "Vital" },
];

const avatarLabel = (value?: string) => avatarOptions.find((option) => option.value === value)?.label ?? "Spark";

export const StatusPanel = ({ player, quests, onUpdateProfile, onFocusNavigate }: StatusPanelProps) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const { progression } = useProgressionSystem();
  const { sessions } = useFocusSessions();
  const openQuests = quests.filter((quest) => quest.status === "open");
  const completedQuests = quests.filter((quest) => quest.status === "completed");
  const xpProgress = Math.round((player.xp / xpRequiredForLevel(player.level)) * 100);
  const unlockedAchievements = achievements.filter((achievement) =>
    player.unlockedAchievementIds.includes(achievement.id),
  );
  const unlockedSkills = progression.skills.filter((skill) => skill.isUnlocked);
  const completedProjects = progression.projects.filter((project) => project.status === "completed");
  const completedMasterQuests = progression.masterQuests.filter((masterQuest) => masterQuest.status === "completed");
  const maxAttributeValue = Math.max(1, ...Object.values(player.attributes));
  const dominantAttribute = Object.entries(player.attributes).sort(([, left], [, right]) => right - left)[0]?.[0] as
    | Attribute
    | undefined;
  const focusMinutes = Math.round(sessions.reduce((total, session) => total + session.elapsedSeconds, 0) / 60);
  const earnedTitles = [
    player.streak >= 7 ? { title: "Consistente", detail: `${player.streak} dias de streak` } : null,
    completedQuests.length >= 20 ? { title: "Executor", detail: `${completedQuests.length} missoes concluidas` } : null,
    unlockedSkills.length >= 3 ? { title: "Aprendiz real", detail: `${unlockedSkills.length} skills registradas` } : null,
    completedProjects.length > 0 ? { title: "Finalizador", detail: `${completedProjects.length} projeto finalizado` } : null,
    focusMinutes >= 120 ? { title: "Foco profundo", detail: `${focusMinutes} minutos registrados` } : null,
    dominantAttribute
      ? { title: `Treino em ${attributeLabels[dominantAttribute]}`, detail: "Atributo dominante da ficha" }
      : null,
  ].filter(Boolean) as Array<{ title: string; detail: string }>;
  const evidenceItems = [
    ...unlockedSkills
      .filter((skill) => skill.evidence)
      .map((skill) => ({
        label: "Skill adquirida",
        title: skill.title,
        detail: skill.evidence ?? "",
        focus: { view: "skills" as AppView, focus: { type: "skill" as const, id: skill.id } },
      })),
    ...completedMasterQuests.map((masterQuest) => ({
      label: "Missao Mestra",
      title: masterQuest.title,
      detail: masterQuest.completedAt ? new Date(masterQuest.completedAt).toLocaleDateString("pt-BR") : "Concluida",
      focus: { view: "projects" as AppView, focus: { type: "masterQuest" as const, id: masterQuest.id } },
    })),
    ...completedProjects.map((project) => ({
      label: "Projeto finalizado",
      title: project.title,
      detail: project.description,
      focus: { view: "projects" as AppView, focus: { type: "project" as const, id: project.id } },
    })),
    ...sessions
      .filter((session) => session.completedQuest || session.elapsedSeconds >= 25 * 60)
      .slice(0, 3)
      .map((session) => ({
        label: "Sessao de foco",
        title: session.questTitle,
        detail: `${Math.round(session.elapsedSeconds / 60)} min registrados`,
        focus: null,
      })),
  ].slice(0, 6);
  const identitySummary = dominantAttribute
    ? `Fase marcada por ${attributeLabels[dominantAttribute].toLowerCase()}, ${openQuests.length} missoes abertas e ${unlockedSkills.length} habilidades registradas.`
    : "A ficha ganha identidade conforme voce registra missoes, foco e habilidades reais.";

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!onUpdateProfile) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    await onUpdateProfile({
      name: String(formData.get("name") ?? ""),
      title: String(formData.get("title") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      avatarSymbol: String(formData.get("avatarSymbol") ?? ""),
      focus: String(formData.get("focus") ?? ""),
    });
    setIsEditingProfile(false);
  };

  return (
    <section className="status-panel">
      <div className="system-tag">
        <Sparkles size={16} />
        SYSTEM ONLINE
      </div>
      <div className="profile-card">
        <div className={`profile-avatar profile-avatar-${player.avatarSymbol ?? "spark"}`}>
          <IdCard size={26} />
          <span>{avatarLabel(player.avatarSymbol)}</span>
        </div>
        <div>
          <p className="eyebrow">Ficha do usuario</p>
          <h1>{player.name}</h1>
          <strong>{player.title || "Sem titulo definido"}</strong>
          {player.bio && <p>{player.bio}</p>}
          {player.focus && <span>Foco atual: {player.focus}</span>}
        </div>
        <div className="rank-badge">Rank {player.rank}</div>
      </div>

      {onUpdateProfile && (
        <button className="profile-edit-toggle" type="button" onClick={() => setIsEditingProfile((current) => !current)}>
          {isEditingProfile ? "Fechar ficha" : "Editar ficha"}
        </button>
      )}

      {isEditingProfile && (
        <form className="profile-form" onSubmit={handleProfileSubmit}>
          <input name="name" defaultValue={player.name} placeholder="Nome" aria-label="Nome do usuario" />
          <input name="title" defaultValue={player.title ?? ""} placeholder="Titulo pessoal" aria-label="Titulo pessoal" />
          <input name="focus" defaultValue={player.focus ?? ""} placeholder="Foco atual" aria-label="Foco atual" />
          <select name="avatarSymbol" defaultValue={player.avatarSymbol ?? "spark"} aria-label="Simbolo da ficha">
            {avatarOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <textarea name="bio" defaultValue={player.bio ?? ""} placeholder="Uma nota curta sobre seu momento atual" />
          <button type="submit">
            <Save size={18} />
            Salvar ficha
          </button>
        </form>
      )}

      <div className="level-row">
        <div>
          <span>Nivel</span>
          <strong>{player.level}</strong>
        </div>
        <div>
          <span>XP</span>
          <strong>
            {player.xp}/{xpRequiredForLevel(player.level)}
          </strong>
        </div>
      </div>
      <div className="xp-track" aria-label="Progresso de experiencia">
        <div style={{ width: `${xpProgress}%` }} />
      </div>

      <div className="stat-grid">
        <Metric icon={<Coins size={18} />} label="Moedas" value={player.coins} />
        <Metric icon={<Sparkles size={18} />} label="Skill points" value={player.skillPoints} />
        <Metric icon={<Trophy size={18} />} label="Streak" value={player.streak} />
        <Metric icon={<Swords size={18} />} label="Ativas" value={openQuests.length} />
        <Metric icon={<Award size={18} />} label="Conquistas" value={unlockedAchievements.length} />
      </div>

      <div className="identity-summary-card">
        <BadgeCheck size={18} />
        <p>{identitySummary}</p>
      </div>

      <div className="attributes">
        {Object.entries(player.attributes).map(([key, value]) => (
          <div className="attribute-row" key={key}>
            <span>{attributeLabels[key as Attribute]}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="training-distribution">
        <div>
          <p className="eyebrow">Distribuicao de treino</p>
          <h2>Atributos em evidencia</h2>
        </div>
        {Object.entries(player.attributes).map(([key, value]) => {
          const attribute = key as Attribute;
          const percent = Math.max(8, Math.round((value / maxAttributeValue) * 100));

          return (
            <div className="training-row" key={attribute}>
              <span>{attributeLabels[attribute]}</span>
              <div className="training-track">
                <div style={{ width: `${percent}%` }} />
              </div>
              <strong>{value}</strong>
            </div>
          );
        })}
      </div>

      <div className="earned-title-grid">
        <div className="status-section-heading">
          <Medal size={18} />
          <div>
            <p className="eyebrow">Titulos conquistados</p>
            <h2>Derivados da sua rotina</h2>
          </div>
        </div>
        {earnedTitles.length === 0 ? (
          <span className="muted-text">Titulos aparecem quando houver consistencia, projetos e skills registradas.</span>
        ) : (
          earnedTitles.map((title) => (
            <article className="earned-title-card" key={title.title}>
              <strong>{title.title}</strong>
              <span>{title.detail}</span>
            </article>
          ))
        )}
      </div>

      <div className="evidence-list">
        <div className="status-section-heading">
          <Award size={18} />
          <div>
            <p className="eyebrow">Evidencias reais</p>
            <h2>Provas de progresso</h2>
          </div>
        </div>
        {evidenceItems.length === 0 ? (
          <span className="muted-text">Concluir projetos, desbloquear skills e registrar foco cria evidencias aqui.</span>
        ) : (
          evidenceItems.map((item) => (
            <article className="evidence-item" key={`${item.label}-${item.title}`}>
              <span>{item.label}</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
              {item.focus && onFocusNavigate && (
                <button type="button" onClick={() => onFocusNavigate(item.focus.view, item.focus.focus)}>
                  Abrir registro
                </button>
              )}
            </article>
          ))
        )}
      </div>

      <div className="achievements">
        <p className="eyebrow">Conquistas</p>
        {unlockedAchievements.length === 0 ? (
          <span className="muted-text">Nenhuma conquista liberada.</span>
        ) : (
          unlockedAchievements.map((achievement) => (
            <div className="achievement-row" key={achievement.id}>
              <strong>{achievement.title}</strong>
              <span>{achievement.description}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
