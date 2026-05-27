import type { Player } from "../../domain/player";
import type { Quest } from "../../domain/task";
import { StatusPanel } from "../components/StatusPanel";

type StatusViewProps = {
  player: Player;
  quests: Quest[];
};

export const StatusView = ({ player, quests }: StatusViewProps) => (
  <div className="view-grid">
    <StatusPanel player={player} quests={quests} />
  </div>
);
