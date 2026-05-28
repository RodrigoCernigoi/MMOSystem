import { Award, Coins, IdCard, Save, Sparkles, Swords, Trophy } from "lucide-react";
import { FormEvent, useState } from "react";
import { achievements } from "../../domain/achievements";
import { xpRequiredForLevel } from "../../domain/progression";
import type { Player } from "../../domain/player";
import type { UpdatePlayerProfileInput } from "../../application/questService";
import type { Attribute, Quest } from "../../domain/task";
import { attributeLabels } from "../viewModels";
import { Metric } from "./Metric";

type StatusPanelProps = {
  player: Player;
  quests: Quest[];
  onUpdateProfile?: (input: UpdatePlayerProfileInput) => Promise<unknown>;
};

const avatarOptions = [
  { value: "spark", label: "Spark" },
  { value: "focus", label: "Focus" },
  { value: "forge", label: "Forge" },
  { value: "vital", label: "Vital" },
];

const avatarLabel = (value?: string) => avatarOptions.find((option) => option.value === value)?.label ?? "Spark";

export const StatusPanel = ({ player, quests, onUpdateProfile }: StatusPanelProps) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const openQuests = quests.filter((quest) => quest.status === "open");
  const completedQuests = quests.filter((quest) => quest.status === "completed");
  const xpProgress = Math.round((player.xp / xpRequiredForLevel(player.level)) * 100);
  const unlockedAchievements = achievements.filter((achievement) =>
    player.unlockedAchievementIds.includes(achievement.id),
  );
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

      <div className="attributes">
        {Object.entries(player.attributes).map(([key, value]) => (
          <div className="attribute-row" key={key}>
            <span>{attributeLabels[key as Attribute]}</span>
            <strong>{value}</strong>
          </div>
        ))}
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
