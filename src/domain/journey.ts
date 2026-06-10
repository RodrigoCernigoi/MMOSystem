import type { CreateProjectInput, CreateSkillInput, CreateMasterQuestInput } from "./progressionSystem";
import type { CreateRewardInput } from "./reward";
import type { Attribute, CreateQuestInput } from "./task";

export type JourneyTone = "balanced" | "gentle" | "intense";

export type JourneyPrompt = {
  goal: string;
  context: string;
  horizonWeeks: number;
  attributes: Attribute[];
  tone: JourneyTone;
};

export type JourneyPlan = {
  title: string;
  summary: string;
  quests: CreateQuestInput[];
  projects: Array<Omit<CreateProjectInput, "questIds"> & { questTitleRefs: string[] }>;
  skills: CreateSkillInput[];
  masterQuests: Array<Omit<CreateMasterQuestInput, "projectIds"> & { projectTitleRefs: string[] }>;
  rewards: CreateRewardInput[];
  milestones: Array<{ title: string; description: string; attribute: Attribute }>;
};

const attributeGoalWords: Record<Attribute, string[]> = {
  strength: ["treino", "forca", "academia", "corpo", "fisico", "correr"],
  intelligence: ["estudo", "programacao", "curso", "ler", "aprender", "tecnico"],
  discipline: ["disciplina", "rotina", "organizacao", "consistencia", "foco"],
  social: ["social", "conversa", "amigo", "relacionamento", "namorada", "network"],
  vitality: ["saude", "sono", "energia", "descanso", "alimentacao", "bem-estar"],
};

const attributeLabels: Record<Attribute, string> = {
  strength: "Corpo",
  intelligence: "Mente",
  discipline: "Disciplina",
  social: "Social",
  vitality: "Vitalidade",
};

const skillIcons: Record<Attribute, string> = {
  strength: "weight-scale",
  intelligence: "brain",
  discipline: "compass",
  social: "talk",
  vitality: "health-normal",
};

export const inferJourneyAttributes = (goal: string): Attribute[] => {
  const normalizedGoal = goal.toLowerCase();
  const matches = (Object.entries(attributeGoalWords) as Array<[Attribute, string[]]>)
    .filter(([_attribute, words]) => words.some((word) => normalizedGoal.includes(word)))
    .map(([attribute]) => attribute);

  return matches.length > 0 ? matches.slice(0, 3) : ["discipline", "vitality"];
};

export const generateLocalJourneyPlan = (prompt: JourneyPrompt): JourneyPlan => {
  const attributes = prompt.attributes.length > 0 ? prompt.attributes.slice(0, 3) : inferJourneyAttributes(prompt.goal);
  const primary = attributes[0] ?? "discipline";
  const isGentle = prompt.tone === "gentle";
  const isIntense = prompt.tone === "intense";
  const focusTitle = normalizeTitle(prompt.goal || "Nova fase de evolucao");
  const projectTitle = `Projeto: ${focusTitle}`;
  const dailyDifficulty = isIntense ? "normal" : "easy";
  const weeklyDifficulty = isGentle ? "easy" : "normal";
  const dailyMinutes = isIntense ? 45 : isGentle ? 15 : 25;
  const horizon = Math.max(2, Math.min(24, prompt.horizonWeeks || 6));

  const quests: CreateQuestInput[] = [
    {
      title: `Bloco diario de ${dailyMinutes} min para ${focusTitle.toLowerCase()}`,
      kind: "habit",
      attribute: primary,
      difficulty: dailyDifficulty,
      recurrence: "daily",
      recurrenceRule: { weekdays: [1, 2, 3, 4, 5] },
      importance: "Ritual pequeno e repetivel para gerar tracao real.",
    },
    {
      title: `Revisar progresso da jornada ${focusTitle}`,
      kind: "weekly",
      attribute: "discipline",
      difficulty: weeklyDifficulty,
      recurrence: "weekly",
      recurrenceRule: { weekdays: [0] },
      importance: "Fechar a semana, ajustar rota e evitar piloto automatico.",
      requiresEvidence: true,
    },
    {
      title: `Registrar evidencia concreta de ${focusTitle.toLowerCase()}`,
      kind: "weekly",
      attribute: primary,
      difficulty: weeklyDifficulty,
      recurrence: "weekly",
      recurrenceRule: { weekdays: [5] },
      importance: "Transformar sensacao de progresso em prova observavel.",
      requiresEvidence: true,
    },
    {
      title: `Revisao mensal da fase ${focusTitle}`,
      kind: "single",
      attribute: "discipline",
      difficulty: "normal",
      recurrence: "monthly",
      recurrenceRule: { monthDays: [1, 15] },
      importance: "Reavaliar a fase duas vezes ao mes e recalibrar o sistema.",
      requiresEvidence: true,
    },
  ];

  attributes.slice(1).forEach((attribute) => {
    quests.push({
      title: `Acao de apoio em ${attributeLabels[attribute]}`,
      kind: "weekly",
      attribute,
      difficulty: weeklyDifficulty,
      recurrence: "weekly",
      recurrenceRule: { weekdays: [2] },
      importance: `Manter ${attributeLabels[attribute].toLowerCase()} conectado a jornada principal.`,
    });
  });

  const skills: CreateSkillInput[] = attributes.map((attribute, index) => ({
    title: `${attributeLabels[attribute]} aplicado`,
    description: `Habilidade real desenvolvida durante a jornada: ${focusTitle}.`,
    attribute,
    icon: skillIcons[attribute],
    prerequisiteSkillIds: index === 0 ? [] : [],
  }));

  return {
    title: `Jornada: ${focusTitle}`,
    summary: `Plano de ${horizon} semanas para transformar "${prompt.goal}" em rotina, evidencias e recompensas reais.`,
    quests,
    projects: [
      {
        title: projectTitle,
        description: prompt.context || `Projeto principal da jornada ${focusTitle}.`,
        attribute: primary,
        questTitleRefs: quests.map((quest) => quest.title),
      },
    ],
    skills,
    masterQuests: [
      {
        title: `Missao mestra: concluir ${focusTitle}`,
        description: `Marco manual para reconhecer que a fase ${focusTitle} foi concluida de forma real.`,
        attribute: primary,
        projectTitleRefs: [projectTitle],
        skill: {
          title: `Constelacao de ${focusTitle}`,
          description: "Skill especial desbloqueada ao concluir a missao mestra da jornada.",
          icon: skillIcons[primary],
          prerequisiteSkillIds: [],
        },
      },
    ],
    rewards: [
      {
        title: isGentle ? "Descanso planejado" : "Recompensa de progresso",
        description: "Recompensa pessoal depois de uma semana com evidencias reais.",
        cost: isIntense ? 140 : 90,
        category: isGentle ? "rest" : "leisure",
      },
      {
        title: "Investimento na jornada",
        description: "Livro, material, aula ou recurso que fortalece essa fase.",
        cost: isIntense ? 220 : 160,
        category: "learning",
      },
    ],
    milestones: [
      {
        title: `Primeira semana de ${focusTitle}`,
        description: "Completar ao menos tres acoes da jornada.",
        attribute: primary,
      },
      {
        title: "Evidencia real registrada",
        description: "Adicionar uma prova concreta de progresso.",
        attribute: primary,
      },
    ],
  };
};

const normalizeTitle = (value: string) => {
  const trimmed = value.trim();
  const compact = trimmed.length > 58 ? `${trimmed.slice(0, 55)}...` : trimmed;
  return compact.charAt(0).toUpperCase() + compact.slice(1);
};
