import type { Player } from "../../domain/player";
import type { UpdatePlayerProfileInput } from "../../application/questService";
import type { Quest } from "../../domain/task";
import { StatusPanel } from "../components/StatusPanel";
import type { AppView } from "../navigation/appViews";
import type { AppFocus } from "../navigation/navigationIntent";

type StatusViewProps = {
  player: Player;
  quests: Quest[];
  onUpdateProfile: (input: UpdatePlayerProfileInput) => Promise<unknown>;
  onFocusNavigate?: (view: AppView, focus: AppFocus) => void;
};

export const StatusView = ({ player, quests, onUpdateProfile, onFocusNavigate }: StatusViewProps) => (
  <div className="view-grid">
    <StatusPanel
      player={player}
      quests={quests}
      onUpdateProfile={onUpdateProfile}
      onFocusNavigate={onFocusNavigate}
    />
  </div>
);
