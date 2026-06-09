import type { Attribute } from "./task";

export type Rank = "E" | "D" | "C" | "B" | "A" | "S";

export type AttributeMap = Record<Attribute, number>;

export type Player = {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  avatarSymbol?: string;
  focus?: string;
  onboardingProfile?: OnboardingProfile;
  level: number;
  xp: number;
  totalXp: number;
  rank: Rank;
  coins: number;
  skillPoints: number;
  streak: number;
  completedQuestCount: number;
  unlockedAchievementIds: string[];
  redeemedRewards: RedeemedReward[];
  dailyHistory: DailyHistoryEntry[];
  dailyReviews: DailyReview[];
  attributes: AttributeMap;
  appPreferences?: AppPreferences;
};

export type OnboardingProfile = {
  reason?: string;
  primaryAreas?: Attribute[];
  cadence?: "gentle" | "steady" | "intense";
  rewardStyle?: "rest" | "leisure" | "learning" | "social";
};

export type AppPreferences = {
  visualTheme?: "auto" | "cyan" | "green" | "red";
  visualIntensity?: "off" | "subtle" | "normal" | "high";
  audioIntensity?: "off" | "subtle" | "normal" | "high";
  audioVolume?: number;
  onboardingComplete?: boolean;
  lastView?: AppViewPreference;
};

export type AppViewPreference =
  | "home"
  | "today"
  | "focus"
  | "missions"
  | "calendar"
  | "create"
  | "projects"
  | "skills"
  | "rewards"
  | "reports"
  | "achievements"
  | "status"
  | "credits"
  | "settings"
  | "evidence";

export type RedeemedReward = {
  id: string;
  rewardId: string;
  title: string;
  cost: number;
  category?: string;
  redeemedAt: string;
};

export type DailyHistoryEntry = {
  date: string;
  completedQuestIds: string[];
  completedHabitIds: string[];
  xpEarned: number;
  coinsEarned: number;
};

export type DailyReviewBonus = {
  xp: number;
  coins: number;
  skillPoints: number;
};

export type DailyReview = {
  id: string;
  date: string;
  rank: Rank;
  completedQuestCount: number;
  completedHabitCount: number;
  xpEarned: number;
  coinsEarned: number;
  bonus: DailyReviewBonus;
  closedAt: string;
};

export const createNewPlayer = (name = "Hunter"): Player => ({
  id: "local-player",
  name,
  title: "Iniciante",
  bio: "",
  avatarSymbol: "spark",
  focus: "",
  onboardingProfile: {},
  level: 1,
  xp: 0,
  totalXp: 0,
  rank: "E",
  coins: 0,
  skillPoints: 0,
  streak: 0,
  completedQuestCount: 0,
  unlockedAchievementIds: [],
  redeemedRewards: [],
  dailyHistory: [],
  dailyReviews: [],
  attributes: {
    strength: 1,
    intelligence: 1,
    discipline: 1,
    social: 1,
    vitality: 1,
  },
  appPreferences: {},
});
