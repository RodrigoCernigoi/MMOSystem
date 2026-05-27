import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

type CollapsiblePanelProps = {
  title: string;
  eyebrow?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export const CollapsiblePanel = ({ title, eyebrow, isOpen, onToggle, children }: CollapsiblePanelProps) => (
  <section className="collapsible-panel">
    <button className="collapsible-trigger" type="button" onClick={onToggle} aria-expanded={isOpen}>
      <span>
        {eyebrow && <small>{eyebrow}</small>}
        <strong>{title}</strong>
      </span>
      <ChevronDown className={isOpen ? "collapsible-chevron-open" : ""} size={20} />
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          className="collapsible-body"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <div>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </section>
);
