const attributes = new Set(["strength", "intelligence", "discipline", "social", "vitality"]);
const kinds = new Set(["single", "daily", "weekly", "habit"]);
const difficulties = new Set(["easy", "normal", "hard", "elite"]);
const recurrences = new Set(["none", "daily", "weekly", "monthly"]);
const rewardCategories = new Set(["leisure", "rest", "social", "purchase", "health", "learning"]);

const asString = (value, fallback = "") => (typeof value === "string" && value.trim() ? value.trim() : fallback);
const asAttribute = (value, fallback = "discipline") => (attributes.has(value) ? value : fallback);

const normalizeRule = (rule = {}) => {
  const weekdays = Array.isArray(rule.weekdays)
    ? [...new Set(rule.weekdays.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
    : [];
  const monthDays = Array.isArray(rule.monthDays)
    ? [...new Set(rule.monthDays.map(Number).filter((day) => Number.isInteger(day) && day >= 1 && day <= 31))]
    : [];

  return {
    ...(weekdays.length ? { weekdays } : {}),
    ...(monthDays.length ? { monthDays } : {}),
  };
};

export const normalizeJourneySuggestion = (payload, fallback) => {
  const quests = Array.isArray(payload?.quests) && payload.quests.length ? payload.quests : fallback.quests;
  const projects = Array.isArray(payload?.projects) && payload.projects.length ? payload.projects : fallback.projects;
  const skills = Array.isArray(payload?.skills) && payload.skills.length ? payload.skills : fallback.skills;
  const masterQuests = Array.isArray(payload?.masterQuests) && payload.masterQuests.length
    ? payload.masterQuests
    : fallback.masterQuests;
  const rewards = Array.isArray(payload?.rewards) && payload.rewards.length ? payload.rewards : fallback.rewards;
  const milestones = Array.isArray(payload?.milestones) ? payload.milestones : fallback.milestones;

  return {
    title: asString(payload?.title, fallback.title),
    summary: asString(payload?.summary, fallback.summary),
    quests: quests.slice(0, 10).map((quest, index) => ({
      title: asString(quest.title, fallback.quests[index % fallback.quests.length].title),
      kind: kinds.has(quest.kind) ? quest.kind : "single",
      attribute: asAttribute(quest.attribute),
      difficulty: difficulties.has(quest.difficulty) ? quest.difficulty : "normal",
      recurrence: recurrences.has(quest.recurrence) ? quest.recurrence : "none",
      recurrenceRule: normalizeRule(quest.recurrenceRule),
      importance: asString(quest.importance, "Acao ligada a jornada."),
      requiresEvidence: Boolean(quest.requiresEvidence),
    })),
    projects: projects.slice(0, 4).map((project, index) => ({
      title: asString(project.title, fallback.projects[index % fallback.projects.length].title),
      description: asString(project.description, "Projeto da jornada."),
      attribute: asAttribute(project.attribute),
      questTitleRefs: Array.isArray(project.questTitleRefs) ? project.questTitleRefs.map(String) : [],
    })),
    skills: skills.slice(0, 8).map((skill) => ({
      title: asString(skill.title, "Skill da jornada"),
      description: asString(skill.description, "Habilidade real rastreada pela jornada."),
      attribute: asAttribute(skill.attribute),
      icon: asString(skill.icon, "skills"),
      prerequisiteSkillIds: [],
    })),
    masterQuests: masterQuests.slice(0, 3).map((masterQuest, index) => ({
      title: asString(masterQuest.title, fallback.masterQuests[index % fallback.masterQuests.length].title),
      description: asString(masterQuest.description, "Marco principal da jornada."),
      attribute: asAttribute(masterQuest.attribute),
      projectTitleRefs: Array.isArray(masterQuest.projectTitleRefs) ? masterQuest.projectTitleRefs.map(String) : [],
      skill: {
        title: asString(masterQuest.skill?.title, "Skill mestra"),
        description: asString(masterQuest.skill?.description, "Desbloqueada ao concluir a missao mestra."),
        icon: asString(masterQuest.skill?.icon, "skills"),
        prerequisiteSkillIds: [],
      },
    })),
    rewards: rewards.slice(0, 6).map((reward) => ({
      title: asString(reward.title, "Recompensa da jornada"),
      description: asString(reward.description, "Recompensa pessoal alinhada a fase."),
      cost: Math.max(20, Math.floor(Number(reward.cost) || 80)),
      category: rewardCategories.has(reward.category) ? reward.category : "leisure",
    })),
    milestones: milestones.slice(0, 8).map((milestone) => ({
      title: asString(milestone.title, "Marco da jornada"),
      description: asString(milestone.description, "Conquista sugerida para esta fase."),
      attribute: asAttribute(milestone.attribute),
    })),
  };
};
