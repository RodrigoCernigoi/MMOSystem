export type FocusSession = {
  id: string;
  questId: string;
  questTitle: string;
  startedAt: string;
  endedAt: string;
  plannedMinutes: number;
  elapsedSeconds: number;
  interruptionCount: number;
  checklist: FocusChecklistItem[];
  note?: string;
  completedQuest: boolean;
};

export type FocusChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
};

export const defaultFocusChecklist: FocusChecklistItem[] = [
  { id: "next-step", label: "Defini o menor proximo passo", checked: false },
  { id: "no-context-switch", label: "Evitei troca de contexto", checked: false },
  { id: "record-result", label: "Registrei o resultado", checked: false },
];
