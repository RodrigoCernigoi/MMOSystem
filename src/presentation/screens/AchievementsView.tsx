import { motion } from "motion/react";
import { achievements } from "../../domain/achievements";
import type { Player } from "../../domain/player";
import { GameIcon } from "../components/GameIcon";
import { achievementGameIcons, fallbackAchievementIcon } from "../gameIconCatalog";
import { cardMotion } from "../motion/transitions";

type AchievementsViewProps = {
  player: Player;
};

export const AchievementsView = ({ player }: AchievementsViewProps) => (
  <section className="content-panel">
    <div className="section-heading">
      <div>
        <p className="eyebrow">Collection</p>
        <h1>Conquistas</h1>
      </div>
      <span className="rank-badge">
        {player.unlockedAchievementIds.length}/{achievements.length}
      </span>
    </div>
    <div className="achievement-grid">
      {achievements.map((achievement) => {
        const unlocked = player.unlockedAchievementIds.includes(achievement.id);

        return (
          <motion.article
            className={unlocked ? "achievement-card achievement-card-unlocked" : "achievement-card"}
            key={achievement.id}
            layout
            {...cardMotion}
          >
            <div className="achievement-emblem">
              <GameIcon name={achievementGameIcons[achievement.id] ?? fallbackAchievementIcon} size={32} />
            </div>
            <span>{unlocked ? "Liberada" : "Bloqueada"}</span>
            <strong>{achievement.title}</strong>
            <p>{achievement.description}</p>
          </motion.article>
        );
      })}
    </div>
  </section>
);
