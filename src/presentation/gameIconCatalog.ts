import type { Attribute } from "../domain/task";

export const attributeGameIcons: Record<Attribute, string> = {
  strength: "weight-scale",
  intelligence: "brain",
  discipline: "compass",
  social: "join",
  vitality: "health-normal",
};

export const achievementGameIcons: Record<string, string> = {
  "first-clear": "check-mark",
  "streak-7": "flame",
  "rank-b-clear": "trophy",
  "intelligence-10": "brain",
};

export const fallbackAchievementIcon = "skills";
