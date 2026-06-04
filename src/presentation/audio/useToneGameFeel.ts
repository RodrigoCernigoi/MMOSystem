import { useEffect, useRef } from "react";
import type { AudioIntensity, GameFeelEventType } from "../visualPreferences";
import { audioIntensityMultiplier } from "../visualPreferences";

type ToneModule = typeof import("tone");

type ToneGameFeelOptions = {
  intensity: AudioIntensity;
  volume: number;
};

type AudioAssetCue = {
  src: string;
  delayMs?: number;
  gain?: number;
};

type ToneState = {
  tone: ToneModule;
  gain: import("tone").Gain;
  synth: import("tone").PolySynth;
  pluck: import("tone").PluckSynth;
  noise: import("tone").NoiseSynth;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const audioAssetsByEvent: Partial<Record<GameFeelEventType, AudioAssetCue[]>> = {
  "ui-navigate": [{ src: "/sounds/select.mp3", gain: 0.48 }],
  "ui-confirm": [
    { src: "/sounds/button01.mp3", gain: 0.72 },
    { src: "/sounds/item-select-2.mp3", delayMs: 45, gain: 0.28 },
  ],
  "ui-popup": [{ src: "/sounds/popup-show.mp3", gain: 0.62 }],
  "quest-complete": [
    { src: "/sounds/clear-combo.mp3", gain: 0.72 },
    { src: "/sounds/drop-coin01.mp3", delayMs: 120, gain: 0.42 },
  ],
  "level-up": [{ src: "/sounds/level-win.mp3", gain: 0.78 }],
  "skill-unlock": [{ src: "/sounds/get-item.mp3", gain: 0.74 }],
  "daily-review": [
    { src: "/sounds/material-level-complete.mp3", gain: 0.72 },
    { src: "/sounds/drop-coin01.mp3", delayMs: 420, gain: 0.36 },
  ],
};

const createAudioCache = () => {
  const urls = new Set(Object.values(audioAssetsByEvent).flatMap((cues) => cues?.map((cue) => cue.src) ?? []));

  return new Map(
    Array.from(urls).map((src) => {
      const audio = new Audio(src);
      audio.preload = "auto";
      return [src, audio] as const;
    }),
  );
};

const playAudioAsset = async (audio: HTMLAudioElement, volume: number) => {
  const instance = audio.cloneNode(true) as HTMLAudioElement;
  instance.volume = clamp(volume, 0, 1);
  await instance.play();
};

const playAssetEvent = (
  cache: Map<string, HTMLAudioElement>,
  type: GameFeelEventType,
  multiplier: number,
  volume: number,
) => {
  const cues = audioAssetsByEvent[type];

  if (!cues?.length) {
    return false;
  }

  cues.forEach((cue) => {
    const audio = cache.get(cue.src);

    if (!audio) {
      return;
    }

    window.setTimeout(() => {
      void playAudioAsset(audio, volume * multiplier * (cue.gain ?? 1)).catch(() => undefined);
    }, cue.delayMs ?? 0);
  });

  return true;
};

const playEvent = (state: ToneState, type: GameFeelEventType, multiplier: number) => {
  const now = state.tone.now();
  const velocity = clamp(0.35 * multiplier, 0.12, 0.72);

  if (type === "quest-complete") {
    state.pluck.triggerAttack("C5", now);
    state.pluck.triggerAttack("G5", now + 0.08);
    return;
  }

  if (type === "level-up") {
    state.synth.triggerAttackRelease(["C4", "E4", "G4", "B4"], "16n", now, velocity);
    state.synth.triggerAttackRelease(["E4", "G4", "B4", "D5"], "8n", now + 0.14, velocity * 0.9);
    state.noise.triggerAttackRelease("16n", now + 0.04);
    return;
  }

  if (type === "skill-unlock") {
    state.synth.triggerAttackRelease(["A4", "C5", "E5"], "8n", now, velocity);
    state.pluck.triggerAttack("A5", now + 0.18);
    return;
  }

  if (type === "daily-review") {
    state.synth.triggerAttackRelease(["D4", "A4", "D5"], "8n", now, velocity);
    state.synth.triggerAttackRelease(["F4", "A4", "C5"], "8n", now + 0.16, velocity * 0.92);
    state.noise.triggerAttackRelease("16n", now + 0.08);
    return;
  }

  if (type === "ui-popup") {
    state.pluck.triggerAttack("C5", now);
    return;
  }

  if (type === "ui-confirm") {
    state.pluck.triggerAttack("E5", now);
    return;
  }

  if (type === "ui-navigate") {
    state.pluck.triggerAttack("A4", now);
  }
};

const createToneState = async (): Promise<ToneState> => {
  const tone = await import("tone");
  const gain = new tone.Gain(0).toDestination();
  const synth = new tone.PolySynth(tone.Synth, {
    envelope: { attack: 0.005, decay: 0.16, sustain: 0.12, release: 0.35 },
    oscillator: { type: "triangle" },
  }).connect(gain);
  const pluck = new tone.PluckSynth({
    attackNoise: 0.45,
    dampening: 5200,
    resonance: 0.78,
  }).connect(gain);
  const noise = new tone.NoiseSynth({
    envelope: { attack: 0.005, decay: 0.12, sustain: 0, release: 0.08 },
    noise: { type: "pink" },
  }).connect(gain);

  return { tone, gain, synth, pluck, noise };
};

export const useToneGameFeel = ({ intensity, volume }: ToneGameFeelOptions) => {
  const stateRef = useRef<ToneState | null>(null);
  const audioCacheRef = useRef<Map<string, HTMLAudioElement> | null>(null);
  const preferencesRef = useRef({ intensity, volume });

  useEffect(() => {
    preferencesRef.current = { intensity, volume };

    if (stateRef.current) {
      stateRef.current.gain.gain.rampTo(
        clamp(volume, 0, 1) * audioIntensityMultiplier[intensity],
        0.08,
      );
    }
  }, [intensity, volume]);

  useEffect(() => {
    let isMounted = true;

    const ensureAudio = async () => {
      if (preferencesRef.current.intensity === "off") {
        return null;
      }

      if (!audioCacheRef.current) {
        audioCacheRef.current = createAudioCache();
      }

      if (!stateRef.current) {
        stateRef.current = await createToneState();
      }

      if (!isMounted) {
        return null;
      }

      await stateRef.current.tone.start();
      stateRef.current.gain.gain.rampTo(
        clamp(preferencesRef.current.volume, 0, 1) *
          audioIntensityMultiplier[preferencesRef.current.intensity],
        0.08,
      );

      return stateRef.current;
    };

    const handleAudioUnlock = () => {
      void ensureAudio();
    };

    const handleAudioEvent = (event: Event) => {
      const type = (event as CustomEvent<{ type: GameFeelEventType }>).detail?.type;

      if (!type || preferencesRef.current.intensity === "off") {
        return;
      }

      if (!audioCacheRef.current) {
        audioCacheRef.current = createAudioCache();
      }

      const didPlayAsset = playAssetEvent(
        audioCacheRef.current,
        type,
        audioIntensityMultiplier[preferencesRef.current.intensity],
        preferencesRef.current.volume,
      );

      if (didPlayAsset) {
        return;
      }

      void ensureAudio().then((state) => {
        if (state) {
          playEvent(state, type, audioIntensityMultiplier[preferencesRef.current.intensity]);
        }
      });
    };

    window.addEventListener("pointerdown", handleAudioUnlock, { once: true });
    window.addEventListener("keydown", handleAudioUnlock, { once: true });
    window.addEventListener("mmo-system:audio-event", handleAudioEvent);

    return () => {
      isMounted = false;
      window.removeEventListener("pointerdown", handleAudioUnlock);
      window.removeEventListener("keydown", handleAudioUnlock);
      window.removeEventListener("mmo-system:audio-event", handleAudioEvent);
    };
  }, []);
};
