import { AnimatePresence, motion } from "motion/react";
import { BarChart3, Gift, GitBranch, Plus, Sparkles, Sun, Target, X } from "lucide-react";
import { useState } from "react";
import type { AppView } from "../navigation/appViews";

type QuickActionsProps = {
  onNavigate: (view: AppView) => void;
  onOpenDailyReview: () => void;
};

const actionMotion = {
  initial: { opacity: 0, y: 10, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.96 },
  transition: { duration: 0.18 },
};

export const QuickActions = ({ onNavigate, onOpenDailyReview }: QuickActionsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const runAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="quick-actions">
      <AnimatePresence>
        {isOpen && (
          <motion.div className="quick-actions-panel" {...actionMotion}>
            <button type="button" onClick={() => runAction(() => onNavigate("create"))}>
              <Target size={18} />
              <span>Nova missao</span>
            </button>
            <button type="button" onClick={() => runAction(onOpenDailyReview)}>
              <Sun size={18} />
              <span>Encerrar dia</span>
            </button>
            <button type="button" onClick={() => runAction(() => onNavigate("skills"))}>
              <Sparkles size={18} />
              <span>Registrar skill</span>
            </button>
            <button type="button" onClick={() => runAction(() => onNavigate("projects"))}>
              <GitBranch size={18} />
              <span>Projetos</span>
            </button>
            <button type="button" onClick={() => runAction(() => onNavigate("rewards"))}>
              <Gift size={18} />
              <span>Loja</span>
            </button>
            <button type="button" onClick={() => runAction(() => onNavigate("reports"))}>
              <BarChart3 size={18} />
              <span>Relatorios</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        className={isOpen ? "quick-action-fab quick-action-fab-open" : "quick-action-fab"}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        title={isOpen ? "Fechar acoes rapidas" : "Abrir acoes rapidas"}
        whileTap={{ scale: 0.94 }}
      >
        {isOpen ? <X size={22} /> : <Plus size={24} />}
      </motion.button>
    </div>
  );
};
