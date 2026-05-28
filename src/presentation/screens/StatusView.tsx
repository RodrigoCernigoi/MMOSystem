import type { Player } from "../../domain/player";
import type { UpdatePlayerProfileInput } from "../../application/questService";
import type { Quest } from "../../domain/task";
import { StatusPanel } from "../components/StatusPanel";

type StatusViewProps = {
  player: Player;
  quests: Quest[];
  onUpdateProfile: (input: UpdatePlayerProfileInput) => Promise<unknown>;
};

export const StatusView = ({ player, quests, onUpdateProfile }: StatusViewProps) => (
  <div className="view-grid">
    <StatusPanel player={player} quests={quests} onUpdateProfile={onUpdateProfile} />
  </div>
);
