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

export type SkillIconOption = {
  value: string;
  label: string;
  group: string;
};

export const skillIconOptions: SkillIconOption[] = [
  { value: "weight-scale", label: "Forca", group: "Corpo" },
  { value: "run", label: "Movimento", group: "Corpo" },
  { value: "health-normal", label: "Saude", group: "Corpo" },
  { value: "brain", label: "Estudo", group: "Mente" },
  { value: "book-cover", label: "Leitura", group: "Mente" },
  { value: "materials-science", label: "Tecnica", group: "Mente" },
  { value: "compass", label: "Direcao", group: "Disciplina" },
  { value: "check-mark", label: "Execucao", group: "Disciplina" },
  { value: "clockwork", label: "Rotina", group: "Disciplina" },
  { value: "join", label: "Social", group: "Relacoes" },
  { value: "three-friends", label: "Grupo", group: "Relacoes" },
  { value: "talk", label: "Dialogo", group: "Relacoes" },
  { value: "sparkles", label: "Criatividade", group: "Expressao" },
  { value: "musical-notes", label: "Musica", group: "Expressao" },
  { value: "paint-brush", label: "Arte", group: "Expressao" },
];

export const getSkillIcon = (skill: { icon?: string; attribute: Attribute }) =>
  skill.icon || attributeGameIcons[skill.attribute];
