import { motion } from "motion/react";
import { lazy, Suspense, type ReactNode } from "react";
import type { AppView } from "../navigation/appViews";
import { navItems } from "../navigation/appViews";

const PixiGameFeelLayer = lazy(() =>
  import("./PixiGameFeelLayer").then((module) => ({ default: module.PixiGameFeelLayer })),
);

type AppShellProps = {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  pixiIntensity?: number;
  pixiAccent?: "cyan" | "green" | "red";
  pixiEnabled?: boolean;
  children: ReactNode;
};

export const AppShell = ({
  activeView,
  onNavigate,
  pixiIntensity = 0.35,
  pixiAccent = "cyan",
  pixiEnabled = true,
  children,
}: AppShellProps) => (
  <main className="app-layout">
    {pixiEnabled && (
      <Suspense fallback={null}>
        <PixiGameFeelLayer intensity={pixiIntensity} accent={pixiAccent} />
      </Suspense>
    )}
    <aside className="app-nav" aria-label="Navegacao principal">
      <div className="app-brand">
        <span>MMO</span>
        <strong>System</strong>
      </div>
      <nav>
        {navItems.map(({ id, label, Icon }) => (
          <motion.button
            key={id}
            className={activeView === id ? "nav-button nav-button-active" : "nav-button"}
            type="button"
            onClick={() => onNavigate(id)}
            title={label}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.97 }}
          >
            <Icon size={18} />
            <span>{label}</span>
          </motion.button>
        ))}
      </nav>
    </aside>
    <section className="view-frame">{children}</section>
  </main>
);
