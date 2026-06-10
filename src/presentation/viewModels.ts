import type { Attribute, QuestKind, Recurrence, TaskDifficulty, TaskStatus } from "../domain/task";

export const attributeLabels: Record<Attribute, string> = {
  strength: "Forca",
  intelligence: "Inteligencia",
  discipline: "Disciplina",
  social: "Social",
  vitality: "Vitalidade",
};

export const difficultyLabels: Record<TaskDifficulty, string> = {
  easy: "E",
  normal: "D",
  hard: "C",
  elite: "B",
};

export const questKindLabels: Record<QuestKind, string> = {
  single: "Unica",
  daily: "Diaria",
  weekly: "Semanal",
  habit: "Habito",
};

export const recurrenceLabels: Record<Recurrence, string> = {
  none: "Sem recorrencia",
  daily: "Diaria",
  weekly: "Semanal",
  monthly: "Mensal",
};

export const statusLabels: Record<TaskStatus, string> = {
  open: "Ativa",
  completed: "Concluida",
  failed: "Falhou",
  archived: "Arquivada",
};

export const attributeOptions = Object.entries(attributeLabels).map(([value, label]) => ({
  value: value as Attribute,
  label,
}));

export const difficultyOptions = Object.entries(difficultyLabels).map(([value, label]) => ({
  value: value as TaskDifficulty,
  label,
}));

export const questKindOptions = Object.entries(questKindLabels).map(([value, label]) => ({
  value: value as QuestKind,
  label,
}));

export const recurrenceOptions = Object.entries(recurrenceLabels).map(([value, label]) => ({
  value: value as Recurrence,
  label,
}));
