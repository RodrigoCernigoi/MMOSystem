import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CreateMasterQuestInput,
  CreateProjectInput,
  CreateSkillInput,
  ProgressionSystem,
  UnlockSkillInput,
  UpdateMasterQuestInput,
  UpdateProjectInput,
  UpdateSkillInput,
} from "../domain/progressionSystem";
import type { Quest } from "../domain/task";
import { createAppContainer } from "../infrastructure/container";

const container = createAppContainer();

type ProgressionState = {
  progression: ProgressionSystem;
  quests: Quest[];
  isLoading: boolean;
  error: string | null;
};

export const useProgressionSystem = () => {
  const [state, setState] = useState<ProgressionState>({
    progression: { projects: [], masterQuests: [], skills: [], bosses: [] },
    quests: [],
    isLoading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      const dashboard = await container.progressionService.getProgression();
      setState({ ...dashboard, isLoading: false, error: null });
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unexpected error.",
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const actions = useMemo(
    () => ({
      async createProject(input: CreateProjectInput) {
        const project = await container.progressionService.createProject(input);
        await refresh();
        return project;
      },
      async createMasterQuest(input: CreateMasterQuestInput) {
        const masterQuest = await container.progressionService.createMasterQuest(input);
        await refresh();
        return masterQuest;
      },
      async createSkill(input: CreateSkillInput) {
        const skill = await container.progressionService.createSkill(input);
        await refresh();
        return skill;
      },
      async updateSkill(id: string, input: UpdateSkillInput) {
        await container.progressionService.updateSkill(id, input);
        await refresh();
      },
      async updateProject(id: string, input: UpdateProjectInput) {
        await container.progressionService.updateProject(id, input);
        await refresh();
      },
      async archiveProject(id: string) {
        await container.progressionService.archiveProject(id);
        await refresh();
      },
      async deleteProject(id: string) {
        await container.progressionService.deleteProject(id);
        await refresh();
      },
      async updateMasterQuest(id: string, input: UpdateMasterQuestInput) {
        await container.progressionService.updateMasterQuest(id, input);
        await refresh();
      },
      async archiveMasterQuest(id: string) {
        await container.progressionService.archiveMasterQuest(id);
        await refresh();
      },
      async completeMasterQuest(id: string) {
        await container.progressionService.completeMasterQuest(id);
        await refresh();
      },
      async unlockSkill(id: string, input: UnlockSkillInput) {
        await container.progressionService.unlockSkill(id, input);
        await refresh();
      },
      async deleteMasterQuest(id: string) {
        await container.progressionService.deleteMasterQuest(id);
        await refresh();
      },
      refreshProgression: refresh,
    }),
    [refresh],
  );

  return { ...state, ...actions };
};
