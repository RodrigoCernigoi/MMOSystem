import { motion } from "motion/react";
import { lazy, Suspense, type ReactNode, useMemo, useState } from "react";
import type { AppView } from "../navigation/appViews";
import { MoreIcon, navItems, primaryMobileNavIds } from "../navigation/appViews";

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
}: AppShellProps) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const primaryMobileItems = useMemo(
    () => navItems.filter((item) => primaryMobileNavIds.includes(item.id)),
    [],
  );
  const secondaryMobileItems = useMemo(
    () => navItems.filter((item) => !primaryMobileNavIds.includes(item.id)),
    [],
  );
  const secondaryActive = secondaryMobileItems.some((item) => item.id === activeView);
  const navigate = (view: AppView) => {
    onNavigate(view);
    setIsMoreOpen(false);
  };

  return (
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
              onClick={() => navigate(id)}
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
      <nav className="mobile-tabbar" aria-label="Navegacao mobile">
        {primaryMobileItems.map(({ id, label, Icon }) => (
          <button
            className={activeView === id ? "mobile-tab mobile-tab-active" : "mobile-tab"}
            key={id}
            type="button"
            onClick={() => navigate(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
        <button
          className={secondaryActive || isMoreOpen ? "mobile-tab mobile-tab-active" : "mobile-tab"}
          type="button"
          onClick={() => setIsMoreOpen((current) => !current)}
        >
          <MoreIcon size={18} />
          <span>Mais</span>
        </button>
      </nav>
      {isMoreOpen && (
        <div className="mobile-more-panel">
          {secondaryMobileItems.map(({ id, label, Icon }) => (
            <button
              className={activeView === id ? "mobile-more-item mobile-more-item-active" : "mobile-more-item"}
              key={id}
              type="button"
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
};
