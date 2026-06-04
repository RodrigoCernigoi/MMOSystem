import { useEffect, useState } from "react";

export type VisualTheme = "auto" | "cyan" | "green" | "red";
export type VisualIntensity = "off" | "subtle" | "normal" | "high";
export type AudioIntensity = "off" | "subtle" | "normal" | "high";

export type VisualPreferences = {
  theme: VisualTheme;
  intensity: VisualIntensity;
  audioIntensity: AudioIntensity;
  audioVolume: number;
};

const storageKey = "mmo-system:visual-preferences";

export const defaultVisualPreferences: VisualPreferences = {
  theme: "auto",
  intensity: "normal",
  audioIntensity: "normal",
  audioVolume: 0.42,
};

export const intensityMultiplier: Record<VisualIntensity, number> = {
  off: 0,
  subtle: 0.45,
  normal: 1,
  high: 1.35,
};

export const audioIntensityMultiplier: Record<AudioIntensity, number> = {
  off: 0,
  subtle: 0.55,
  normal: 1,
  high: 1.2,
};

const readVisualPreferences = (): VisualPreferences => {
  const raw = localStorage.getItem(storageKey);

  if (!raw) {
    return defaultVisualPreferences;
  }

  try {
    return { ...defaultVisualPreferences, ...JSON.parse(raw) };
  } catch {
    return defaultVisualPreferences;
  }
};

export const useVisualPreferences = () => {
  const [preferences, setPreferences] = useState<VisualPreferences>(() => readVisualPreferences());

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  }, [preferences]);

  return {
    preferences,
    setPreferences,
  };
};

export type GameFeelEventType =
  | "quest-complete"
  | "level-up"
  | "skill-unlock"
  | "daily-review"
  | "ui-popup"
  | "ui-confirm"
  | "ui-navigate";

export const emitVisualEvent = (type: GameFeelEventType) => {
  window.dispatchEvent(new CustomEvent("mmo-system:visual-event", { detail: { type } }));
  window.dispatchEvent(new CustomEvent("mmo-system:audio-event", { detail: { type } }));
};
