import { AnimatePresence, motion } from "motion/react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useDashboard } from "./useDashboard";
import type { RewardFeedback } from "./useDashboard";
import { useToneGameFeel } from "./audio/useToneGameFeel";
import { AppShell } from "./components/AppShell";
import { OnboardingOverlay } from "./components/OnboardingOverlay";
import { QuickActions } from "./components/QuickActions";
import { RewardToast } from "./components/RewardToast";
import { SplashScreen } from "./components/SplashScreen";
import { SyncStatusBadge } from "./components/SyncStatusBadge";
import type { SyncStatus } from "./components/SyncStatusBadge";
import { viewMotion } from "./motion/transitions";
import type { AppView } from "./navigation/appViews";
import type { AppFocus, CreateQuestIntent } from "./navigation/navigationIntent";
import { HomeView } from "./screens/HomeView";
import { TodayView } from "./screens/TodayView";
import { emitVisualEvent, intensityMultiplier, useVisualPreferences } from "./visualPreferences";

const loadAchievementsView = () => import("./screens/AchievementsView");
const loadCalendarView = () => import("./screens/CalendarView");
const loadCreateQuestView = () => import("./screens/CreateQuestView");
const loadCreditsView = () => import("./screens/CreditsView");
const loadEvidenceView = () => import("./screens/EvidenceView");
const loadFocusView = () => import("./screens/FocusView");
const loadMissionsView = () => import("./screens/MissionsView");
const loadProjectsView = () => import("./screens/ProjectsView");
const loadRewardsView = () => import("./screens/RewardsView");
const loadReportsView = () => import("./screens/ReportsView");
const loadSettingsView = () => import("./screens/SettingsView");
const loadSkillsView = () => import("./screens/SkillsView");
const loadStatusView = () => import("./screens/StatusView");
const lazyScreenLoaders = [
  loadAchievementsView,
  loadCalendarView,
  loadCreateQuestView,
  loadCreditsView,
  loadEvidenceView,
  loadFocusView,
  loadMissionsView,
  loadProjectsView,
  loadRewardsView,
  loadReportsView,
  loadSettingsView,
  loadSkillsView,
  loadStatusView,
];

const AchievementsView = lazy(() => loadAchievementsView().then((module) => ({ default: module.AchievementsView })));
const CalendarView = lazy(() => loadCalendarView().then((module) => ({ default: module.CalendarView })));
const CreateQuestView = lazy(() => loadCreateQuestView().then((module) => ({ default: module.CreateQuestView })));
const CreditsView = lazy(() => loadCreditsView().then((module) => ({ default: module.CreditsView })));
const EvidenceView = lazy(() => loadEvidenceView().then((module) => ({ default: module.EvidenceView })));
const FocusView = lazy(() => loadFocusView().then((module) => ({ default: module.FocusView })));
const MissionsView = lazy(() => loadMissionsView().then((module) => ({ default: module.MissionsView })));
const ProjectsView = lazy(() => loadProjectsView().then((module) => ({ default: module.ProjectsView })));
const RewardsView = lazy(() => loadRewardsView().then((module) => ({ default: module.RewardsView })));
const ReportsView = lazy(() => loadReportsView().then((module) => ({ default: module.ReportsView })));
const SettingsView = lazy(() => loadSettingsView().then((module) => ({ default: module.SettingsView })));
const SkillsView = lazy(() => loadSkillsView().then((module) => ({ default: module.SkillsView })));
const StatusView = lazy(() => loadStatusView().then((module) => ({ default: module.StatusView })));

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
    updatePlayerProfile,
    suggestQuest,
    endDay,
  } = useDashboard();
  const [activeView, setActiveView] = useState<AppView>("home");
  const [rewardFeedback, setRewardFeedback] = useState<RewardFeedback | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dailyReviewRequestId, setDailyReviewRequestId] = useState(0);
  const [createQuestIntent, setCreateQuestIntent] = useState<CreateQuestIntent | null>(null);
  const [appFocus, setAppFocus] = useState<AppFocus | null>(null);
  const [focusQuestId, setFocusQuestId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncDetail, setSyncDetail] = useState<string | null>(null);
  const { preferences, setPreferences } = useVisualPreferences();
  const didHydrateRemotePreferences = useRef(false);
  useToneGameFeel({ intensity: preferences.audioIntensity, volume: preferences.audioVolume });

  useEffect(() => {
    const preloadScreens = () => {
      lazyScreenLoaders.forEach((loadScreen) => {
        void loadScreen();
      });
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preloadScreens, { timeout: 1800 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(preloadScreens, 600);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShowSplash(false), 3000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (showSplash || isLoading) {
      return;
    }

    const hasCompletedOnboarding =
      player?.appPreferences?.onboardingComplete || localStorage.getItem("mmo-system:onboarding-complete") === "true";
    setShowOnboarding(!hasCompletedOnboarding && quests.length === 0);
  }, [isLoading, player?.appPreferences?.onboardingComplete, quests.length, showSplash]);

  useEffect(() => {
    if (!rewardFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => setRewardFeedback(null), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [rewardFeedback]);

  useEffect(() => {
    if (syncStatus !== "saving") {
      return;
    }

    const timeoutId = window.setTimeout(() => setSyncStatus("idle"), 900);
    return () => window.clearTimeout(timeoutId);
  }, [syncStatus]);

  useEffect(() => {
    if (!player?.appPreferences || didHydrateRemotePreferences.current) {
      return;
    }

    didHydrateRemotePreferences.current = true;
    setPreferences({
      theme: player.appPreferences.visualTheme ?? preferences.theme,
      intensity: player.appPreferences.visualIntensity ?? preferences.intensity,
      audioIntensity: player.appPreferences.audioIntensity ?? preferences.audioIntensity,
      audioVolume: player.appPreferences.audioVolume ?? preferences.audioVolume,
    });

    if (player.appPreferences.lastView && player.appPreferences.lastView !== "focus") {
      setActiveView(player.appPreferences.lastView);
    }
  }, [player?.appPreferences, preferences.audioIntensity, preferences.audioVolume, preferences.intensity, preferences.theme, setPreferences]);

  const runSyncedAction = useCallback(async <T,>(action: () => Promise<T>) => {
    setSyncStatus("saving");
    setSyncDetail(null);

    try {
      const result = await action();
      setSyncStatus("saving");
      return result;
    } catch (actionError) {
      setSyncStatus("error");
      setSyncDetail(actionError instanceof Error ? actionError.message : "Erro ao sincronizar dados.");
      throw actionError;
    }
  }, []);

  const handleCompleteQuest = useCallback(
    async (id: string, input?: Parameters<typeof completeQuest>[1]) => {
      const reward = await runSyncedAction(() => completeQuest(id, input));
      setRewardFeedback(reward);
      emitVisualEvent("quest-complete");
      if (reward.leveledUp) {
        emitVisualEvent("level-up");
      }
    },
    [completeQuest, runSyncedAction],
  );

  const handleCreateQuest = useCallback(
    (input: Parameters<typeof createQuest>[0]) => runSyncedAction(() => createQuest(input)),
    [createQuest, runSyncedAction],
  );

  const handleUpdateQuest = useCallback(
    (id: string, input: Parameters<typeof updateQuest>[1]) => runSyncedAction(() => updateQuest(id, input)),
    [runSyncedAction, updateQuest],
  );

  const handleArchiveQuest = useCallback(
    (id: string) => runSyncedAction(() => archiveQuest(id)),
    [archiveQuest, runSyncedAction],
  );

  const handleDeleteQuest = useCallback(
    (id: string) => runSyncedAction(() => deleteQuest(id)),
    [deleteQuest, runSyncedAction],
  );

  const handleEndDay = useCallback(
    (date: string) => runSyncedAction(() => endDay(date)),
    [endDay, runSyncedAction],
  );

  const handleUpdatePlayerProfile = useCallback(
    (input: Parameters<typeof updatePlayerProfile>[0]) => runSyncedAction(() => updatePlayerProfile(input)),
    [runSyncedAction, updatePlayerProfile],
  );

  const handleChangePreferences = useCallback(
    (nextPreferences: typeof preferences) => {
      setPreferences(nextPreferences);
      void handleUpdatePlayerProfile({
        appPreferences: {
          visualTheme: nextPreferences.theme,
          visualIntensity: nextPreferences.intensity,
          audioIntensity: nextPreferences.audioIntensity,
          audioVolume: nextPreferences.audioVolume,
        },
      });
    },
    [handleUpdatePlayerProfile, setPreferences],
  );

  const handleNavigate = useCallback((view: AppView) => {
    setActiveView(view);
    void handleUpdatePlayerProfile({ appPreferences: { lastView: view } });
    emitVisualEvent("ui-navigate");
  }, [handleUpdatePlayerProfile]);

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

  const handleFinishOnboarding = useCallback(() => {
    localStorage.setItem("mmo-system:onboarding-complete", "true");
    void handleUpdatePlayerProfile({ appPreferences: { onboardingComplete: true } });
    setShowOnboarding(false);
    emitVisualEvent("ui-confirm");
  }, [handleUpdatePlayerProfile]);

  const handleOpenFocusMode = useCallback((questId: string) => {
    setFocusQuestId(questId);
    setActiveView("focus");
    emitVisualEvent("ui-confirm");
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
        onEndDay={handleEndDay}
        onOpenFocus={handleOpenFocusMode}
        reviewRequestId={dailyReviewRequestId}
      />
    ),
    focus: (
      <FocusView
        player={player}
        quests={quests}
        initialQuestId={focusQuestId}
        onCompleteQuest={handleCompleteQuest}
        onNavigate={handleNavigate}
      />
    ),
    missions: (
      <MissionsView
        quests={quests}
        error={error}
        onCompleteQuest={handleCompleteQuest}
        onUpdateQuest={handleUpdateQuest}
        onArchiveQuest={handleArchiveQuest}
        onDeleteQuest={handleDeleteQuest}
        onOpenFocus={handleOpenFocusMode}
        onFocusNavigate={handleFocusNavigate}
      />
    ),
    calendar: <CalendarView player={player} quests={quests} />,
    create: (
      <CreateQuestView
        error={error}
        onCreateQuest={handleCreateQuest}
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
    evidence: <EvidenceView quests={quests} onFocusNavigate={handleFocusNavigate} />,
    achievements: <AchievementsView player={player} />,
    credits: <CreditsView />,
    status: (
      <StatusView
        player={player}
        quests={quests}
        onUpdateProfile={handleUpdatePlayerProfile}
        onFocusNavigate={handleFocusNavigate}
      />
    ),
    settings: <SettingsView preferences={preferences} onChangePreferences={handleChangePreferences} />,
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
      <AnimatePresence initial={false}>
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
      <SyncStatusBadge status={syncStatus} detail={syncDetail} />
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingOverlay
            onCreateQuest={handleCreateQuest}
            onUpdateProfile={handleUpdatePlayerProfile}
            onDone={handleFinishOnboarding}
          />
        )}
      </AnimatePresence>
    </AppShell>
      )}
    </AnimatePresence>
  );
};
