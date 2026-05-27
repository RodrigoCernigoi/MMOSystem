import { AnimatePresence, motion } from "motion/react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useDashboard } from "./useDashboard";
import type { RewardFeedback } from "./useDashboard";
import { useToneGameFeel } from "./audio/useToneGameFeel";
import { AppShell } from "./components/AppShell";
import { QuickActions } from "./components/QuickActions";
import { RewardToast } from "./components/RewardToast";
import { SplashScreen } from "./components/SplashScreen";
import { viewMotion } from "./motion/transitions";
import type { AppView } from "./navigation/appViews";
import type { AppFocus, CreateQuestIntent } from "./navigation/navigationIntent";
import { HomeView } from "./screens/HomeView";
import { TodayView } from "./screens/TodayView";
import { emitVisualEvent, intensityMultiplier, useVisualPreferences } from "./visualPreferences";

const AchievementsView = lazy(() => import("./screens/AchievementsView").then((module) => ({ default: module.AchievementsView })));
const CalendarView = lazy(() => import("./screens/CalendarView").then((module) => ({ default: module.CalendarView })));
const CreateQuestView = lazy(() => import("./screens/CreateQuestView").then((module) => ({ default: module.CreateQuestView })));
const MissionsView = lazy(() => import("./screens/MissionsView").then((module) => ({ default: module.MissionsView })));
const ProjectsView = lazy(() => import("./screens/ProjectsView").then((module) => ({ default: module.ProjectsView })));
const RewardsView = lazy(() => import("./screens/RewardsView").then((module) => ({ default: module.RewardsView })));
const ReportsView = lazy(() => import("./screens/ReportsView").then((module) => ({ default: module.ReportsView })));
const SettingsView = lazy(() => import("./screens/SettingsView").then((module) => ({ default: module.SettingsView })));
const SkillsView = lazy(() => import("./screens/SkillsView").then((module) => ({ default: module.SkillsView })));
const StatusView = lazy(() => import("./screens/StatusView").then((module) => ({ default: module.StatusView })));

export const App = () => {
  const {
    player,
    quests,
    isLoading,
    error,
    createQuest,
    completeQuest,
    updateQuest,
    archiveQuest,
    deleteQuest,
    suggestQuest,
    endDay,
  } = useDashboard();
  const [activeView, setActiveView] = useState<AppView>("home");
  const [rewardFeedback, setRewardFeedback] = useState<RewardFeedback | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [dailyReviewRequestId, setDailyReviewRequestId] = useState(0);
  const [createQuestIntent, setCreateQuestIntent] = useState<CreateQuestIntent | null>(null);
  const [appFocus, setAppFocus] = useState<AppFocus | null>(null);
  const { preferences, setPreferences } = useVisualPreferences();
  useToneGameFeel({ intensity: preferences.audioIntensity, volume: preferences.audioVolume });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShowSplash(false), 3000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!rewardFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => setRewardFeedback(null), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [rewardFeedback]);

  const handleCompleteQuest = useCallback(
    async (id: string) => {
      const reward = await completeQuest(id);
      setRewardFeedback(reward);
      emitVisualEvent("quest-complete");
      if (reward.leveledUp) {
        emitVisualEvent("level-up");
      }
    },
    [completeQuest],
  );

  const handleNavigate = useCallback((view: AppView) => {
    setActiveView(view);
    emitVisualEvent("ui-navigate");
  }, []);

  const handleOpenDailyReview = useCallback(() => {
    setActiveView("today");
    setDailyReviewRequestId((current) => current + 1);
    emitVisualEvent("ui-confirm");
  }, []);

  const handleCreateQuestWithIntent = useCallback((intent: CreateQuestIntent) => {
    setCreateQuestIntent(intent);
    setActiveView("create");
    emitVisualEvent("ui-confirm");
  }, []);

  const handleFocusNavigate = useCallback((view: AppView, focus: AppFocus) => {
    setAppFocus(focus);
    setActiveView(view);
    emitVisualEvent("ui-navigate");
  }, []);

  if (isLoading || !player) {
    return <main className="loading">Inicializando sistema...</main>;
  }

  const views: Record<AppView, ReactNode> = {
    home: (
      <HomeView
        player={player}
        quests={quests}
        onCompleteQuest={handleCompleteQuest}
        onNavigate={handleNavigate}
        onCreateQuestIntent={handleCreateQuestWithIntent}
        onFocusNavigate={handleFocusNavigate}
      />
    ),
    today: (
      <TodayView
        player={player}
        quests={quests}
        onCompleteQuest={handleCompleteQuest}
        onEndDay={endDay}
        reviewRequestId={dailyReviewRequestId}
      />
    ),
    missions: (
      <MissionsView
        quests={quests}
        error={error}
        onCompleteQuest={handleCompleteQuest}
        onUpdateQuest={updateQuest}
        onArchiveQuest={archiveQuest}
        onDeleteQuest={deleteQuest}
      />
    ),
    calendar: <CalendarView quests={quests} />,
    create: (
      <CreateQuestView
        error={error}
        onCreateQuest={createQuest}
        onSuggestQuest={suggestQuest}
        intent={createQuestIntent}
      />
    ),
    projects: (
      <ProjectsView
        focus={appFocus?.type === "project" || appFocus?.type === "masterQuest" ? appFocus : null}
        onCreateQuestIntent={handleCreateQuestWithIntent}
        onFocusNavigate={handleFocusNavigate}
      />
    ),
    skills: (
      <SkillsView
        focus={appFocus?.type === "skill" ? appFocus : null}
        onFocusNavigate={handleFocusNavigate}
      />
    ),
    rewards: <RewardsView />,
    reports: <ReportsView player={player} />,
    achievements: <AchievementsView player={player} />,
    status: <StatusView player={player} quests={quests} />,
    settings: <SettingsView preferences={preferences} onChangePreferences={setPreferences} />,
  };
  const failedQuestCount = quests.filter((quest) => quest.status === "failed").length;
  const openQuestCount = quests.filter((quest) => quest.status === "open").length;
  const basePixiIntensity = Math.min(1, 0.18 + player.streak * 0.04 + openQuestCount * 0.025 + player.level * 0.012);
  const pixiIntensity = Math.min(1, basePixiIntensity * intensityMultiplier[preferences.intensity]);
  const automaticAccent = failedQuestCount > openQuestCount ? "red" : player.streak >= 5 ? "green" : "cyan";
  const pixiAccent = preferences.theme === "auto" ? automaticAccent : preferences.theme;

  return (
    <AnimatePresence mode="wait">
      {showSplash ? (
        <SplashScreen key="splash" />
      ) : (
    <AppShell
      activeView={activeView}
      onNavigate={handleNavigate}
      pixiIntensity={pixiIntensity}
      pixiAccent={pixiAccent}
      pixiEnabled={preferences.intensity !== "off"}
    >
      <AnimatePresence mode="wait">
        <motion.div className="view-transition" key={activeView} {...viewMotion}>
          <Suspense fallback={<main className="loading">Carregando tela...</main>}>
            {views[activeView]}
          </Suspense>
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        <RewardToast reward={rewardFeedback} />
      </AnimatePresence>
      <QuickActions onNavigate={handleNavigate} onOpenDailyReview={handleOpenDailyReview} />
    </AppShell>
      )}
    </AnimatePresence>
  );
};
