import { motion } from "motion/react";
import type { ReactNode } from "react";

type TabItem<T extends string> = {
  id: T;
  label: string;
  indicator?: number;
};

type TabsProps<T extends string> = {
  items: Array<TabItem<T>>;
  activeId: T;
  onChange: (id: T) => void;
  children: ReactNode;
};

export const Tabs = <T extends string>({ items, activeId, onChange, children }: TabsProps<T>) => (
  <div className="tabs-shell">
    <div className="tabs-list" role="tablist">
      {items.map((item) => (
        <button
          className={activeId === item.id ? "tab-button tab-button-active" : "tab-button"}
          key={item.id}
          type="button"
          role="tab"
          aria-selected={activeId === item.id}
          onClick={() => onChange(item.id)}
        >
          <span>{item.label}</span>
          {item.indicator !== undefined && <strong>{item.indicator}</strong>}
          {activeId === item.id && <motion.i layoutId="active-tab-indicator" />}
        </button>
      ))}
    </div>
    <motion.div
      className="tabs-content"
      key={activeId}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  </div>
);
