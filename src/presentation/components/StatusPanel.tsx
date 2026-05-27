import { Award, Coins, Sparkles, Swords, Trophy } from "lucide-react";
import { achievements } from "../../domain/achievements";
import { xpRequiredForLevel } from "../../domain/progression";
import type { Player } from "../../domain/player";
import type { Attribute, Quest } from "../../domain/task";
import { attributeLabels } from "../viewModels";
import { Metric } from "./Metric";

type StatusPanelProps = {
  player: Player;
  quests: Quest[];
};

export const StatusPanel = ({ player, quests }: StatusPanelProps) => {
  const openQuests = quests.filter((quest) => quest.status === "open");
  const completedQuests = quests.filter((quest) => quest.status === "completed");
  const xpProgress = Math.round((player.xp / xpRequiredForLevel(player.level)) * 100);
  const unlockedAchievements = achievements.filter((achievement) =>
    player.unlockedAchievementIds.includes(achievement.id),
  );

  return (
    <section className="status-panel">
      <div className="system-tag">
        <Sparkles size={16} />
        SYSTEM ONLINE
      </div>
      <div className="hunter-header">
        <div>
          <p className="eyebrow">Hunter profile</p>
          <h1>{player.name}</h1>
        </div>
        <div className="rank-badge">Rank {player.rank}</div>
      </div>

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
