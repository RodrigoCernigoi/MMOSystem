import { useEffect, useRef } from "react";
import type { AudioIntensity, GameFeelEventType } from "../visualPreferences";
import { audioIntensityMultiplier } from "../visualPreferences";

type ToneModule = typeof import("tone");

type ToneGameFeelOptions = {
  intensity: AudioIntensity;
  volume: number;
};

type ToneState = {
  tone: ToneModule;
  gain: import("tone").Gain;
  synth: import("tone").PolySynth;
  pluck: import("tone").PluckSynth;
  noise: import("tone").NoiseSynth;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
