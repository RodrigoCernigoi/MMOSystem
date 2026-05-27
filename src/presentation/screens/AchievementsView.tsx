import { motion } from "motion/react";
import { achievements } from "../../domain/achievements";
import type { Player } from "../../domain/player";
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
            <span>{unlocked ? "Liberada" : "Bloqueada"}</span>
            <strong>{achievement.title}</strong>
            <p>{achievement.description}</p>
          </motion.article>
        );
      })}
    </div>
  </section>
);
