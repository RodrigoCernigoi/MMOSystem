import { Cloud, CloudOff, Loader2, TriangleAlert } from "lucide-react";
import { isSupabaseConfigured } from "../../infrastructure/supabaseClient";

export type SyncStatus = "idle" | "saving" | "error";

type SyncStatusBadgeProps = {
  status: SyncStatus;
  detail?: string | null;
};

export const SyncStatusBadge = ({ status, detail }: SyncStatusBadgeProps) => {
  const Icon = status === "saving" ? Loader2 : status === "error" ? TriangleAlert : isSupabaseConfigured ? Cloud : CloudOff;
  const label = status === "saving" ? "Salvando" : status === "error" ? "Erro de sync" : isSupabaseConfigured ? "Sincronizado" : "Local";

  return (
    <div className={`sync-status sync-status-${status}`} title={detail ?? label}>
      <Icon size={15} />
      <span>{label}</span>
    </div>
  );
};
