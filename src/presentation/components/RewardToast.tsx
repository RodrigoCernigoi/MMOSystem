import { motion } from "motion/react";
import { Coins, Sparkles, Star, Trophy } from "lucide-react";
import type { RewardFeedback } from "../useDashboard";
import { toastMotion } from "../motion/transitions";

type RewardToastProps = {
  reward: RewardFeedback | null;
};

export const RewardToast = ({ reward }: RewardToastProps) => {
  if (!reward) {
    return null;
  }

  return (
    <motion.div className="reward-toast" role="status" aria-live="polite" {...toastMotion}>
      <div className="reward-core">
        <Sparkles size={22} />
      </div>
      <div>
        <strong>Missao concluida</strong>
        <div className="reward-lines">
          <span>
            <Star size={14} /> +{reward.xp} XP
          </span>
          <span>
            <Coins size={14} /> +{reward.coins}
          </span>
          {reward.leveledUp && (
            <span>
              <Trophy size={14} /> Level up
            </span>
          )}
          {reward.newAchievements > 0 && <span>+{reward.newAchievements} conquista</span>}
        </div>
      </div>
    </motion.div>
  );
};
