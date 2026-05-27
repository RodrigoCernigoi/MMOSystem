import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { toastMotion } from "../motion/transitions";

type SkillUnlockToastProps = {
  skillTitle: string | null;
};

export const SkillUnlockToast = ({ skillTitle }: SkillUnlockToastProps) => {
  if (!skillTitle) {
    return null;
  }

  return (
    <motion.div className="reward-toast skill-toast" role="status" aria-live="polite" {...toastMotion}>
      <div className="reward-core">
        <Sparkles size={22} />
      </div>
      <div>
        <strong>Habilidade desbloqueada</strong>
        <div className="reward-lines">
          <span>{skillTitle}</span>
        </div>
      </div>
    </motion.div>
  );
};
