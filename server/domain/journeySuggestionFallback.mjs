const attributeWords = {
  strength: ["treino", "forca", "academia", "corpo", "fisico", "correr"],
  intelligence: ["estudo", "programacao", "curso", "ler", "aprender", "tecnico"],
  discipline: ["disciplina", "rotina", "organizacao", "consistencia", "foco"],
  social: ["social", "conversa", "amigo", "relacionamento", "namorada", "network"],
  vitality: ["saude", "sono", "energia", "descanso", "alimentacao", "bem-estar"],
};

const labels = {
  strength: "Corpo",
  intelligence: "Mente",
  discipline: "Disciplina",
  social: "Social",
  vitality: "Vitalidade",
};

const icons = {
  strength: "weight-scale",
  intelligence: "brain",
  discipline: "compass",
  social: "talk",
  vitality: "health-normal",
};

export const inferJourneyAttributes = (goal = "") => {
  const lowerGoal = goal.toLowerCase();
  const matches = Object.entries(attributeWords)
    .filter(([_attribute, words]) => words.some((word) => lowerGoal.includes(word)))
    .map(([attribute]) => attribute);

  return matches.length ? matches.slice(0, 3) : ["discipline", "vitality"];
};

export const createFallbackJourneySuggestion = (prompt = {}) => {
  const goal = String(prompt.goal || "Nova fase de evolucao").trim();
  const title = goal.length > 58 ? `${goal.slice(0, 55)}...` : goal;
  const attributes = Array.isArray(prompt.attributes) && prompt.attributes.length
    ? prompt.attributes.slice(0, 3)
    : inferJourneyAttributes(goal);
  const primary = attributes[0] || "discipline";
  const intense = prompt.tone === "intense";
  const gentle = prompt.tone === "gentle";
  const dailyMinutes = intense ? 45 : gentle ? 15 : 25;
  const projectTitle = `Projeto: ${title}`;
  const quests = [
    {
      title: `Bloco diario de ${dailyMinutes} min para ${title.toLowerCase()}`,
      kind: "habit",
      attribute: primary,
      difficulty: intense ? "normal" : "easy",
      recurrence: "daily",
      recurrenceRule: { weekdays: [1, 2, 3, 4, 5] },
      importance: "Ritual pequeno e repetivel para gerar tracao real.",
    },
    {
      title: `Revisar progresso da jornada ${title}`,
      kind: "weekly",
      attribute: "discipline",
      difficulty: gentle ? "easy" : "normal",
      recurrence: "weekly",
      recurrenceRule: { weekdays: [0] },
      importance: "Fechar a semana, ajustar rota e evitar piloto automatico.",
      requiresEvidence: true,
    },
    {
      title: `Revisao mensal da fase ${title}`,
      kind: "single",
      attribute: "discipline",
      difficulty: "normal",
      recurrence: "monthly",
      recurrenceRule: { monthDays: [1, 15] },
      importance: "Reavaliar a fase duas vezes ao mes e recalibrar o sistema.",
      requiresEvidence: true,
    },
  ];

  return {
    title: `Jornada: ${title}`,
    summary: `Plano para transformar "${goal}" em rotina, evidencias e recompensas reais.`,
    quests,
    projects: [
      {
        title: projectTitle,
        description: prompt.context || `Projeto principal da jornada ${title}.`,
        attribute: primary,
        questTitleRefs: quests.map((quest) => quest.title),
      },
    ],
    skills: attributes.map((attribute) => ({
      title: `${labels[attribute] || "Habilidade"} aplicado`,
      description: `Habilidade real desenvolvida durante a jornada: ${title}.`,
      attribute,
      icon: icons[attribute] || "skills",
      prerequisiteSkillIds: [],
    })),
    masterQuests: [
      {
        title: `Missao mestra: concluir ${title}`,
        description: `Marco manual para reconhecer que a fase ${title} foi concluida de forma real.`,
        attribute: primary,
        projectTitleRefs: [projectTitle],
        skill: {
          title: `Constelacao de ${title}`,
          description: "Skill especial desbloqueada ao concluir a missao mestra da jornada.",
          icon: icons[primary] || "skills",
          prerequisiteSkillIds: [],
        },
      },
    ],
    rewards: [
      {
        title: gentle ? "Descanso planejado" : "Recompensa de progresso",
        description: "Recompensa pessoal depois de uma semana com evidencias reais.",
        cost: intense ? 140 : 90,
        category: gentle ? "rest" : "leisure",
      },
      {
        title: "Investimento na jornada",
        description: "Livro, material, aula ou recurso que fortalece essa fase.",
        cost: intense ? 220 : 160,
        category: "learning",
      },
    ],
    milestones: [
      {
        title: `Primeira semana de ${title}`,
        description: "Completar ao menos tres acoes da jornada.",
        attribute: primary,
      },
    ],
  };
};
