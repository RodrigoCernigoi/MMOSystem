import { WandSparkles } from "lucide-react";
import type { CreateQuestInput } from "../../domain/task";
import { QuestForm } from "../components/QuestForm";
import type { CreateQuestIntent } from "../navigation/navigationIntent";
import { useProgressionSystem } from "../useProgressionSystem";

type CreateQuestViewProps = {
  error: string | null;
  onCreateQuest: (input: CreateQuestInput) => Promise<unknown>;
  onSuggestQuest: (goal: string) => Promise<CreateQuestInput>;
  intent?: CreateQuestIntent | null;
};

export const CreateQuestView = ({ error, onCreateQuest, onSuggestQuest, intent }: CreateQuestViewProps) => {
  const { progression } = useProgressionSystem();

  return (
    <section className="content-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Mission forge</p>
          <h1>Criar missao</h1>
        </div>
        <WandSparkles size={30} />
      </div>
      {error && <div className="error-banner">{error}</div>}
      <QuestForm
        onCreateQuest={onCreateQuest}
        onSuggestQuest={onSuggestQuest}
        projects={progression.projects.filter((project) => project.status === "active")}
        intent={intent}
      />
    </section>
  );
};
