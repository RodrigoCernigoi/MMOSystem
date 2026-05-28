import { CloudUpload, Database, Download, LogOut, RefreshCw, ShieldCheck, Trash2, Upload, UserRound, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { AppBackup, SyncStatus } from "../../infrastructure/dataBackup";
import {
  clearLocalBackupData,
  getSyncStatus,
  migrateLocalBackupToSupabase,
  readActiveBackup,
  writeActiveBackup,
} from "../../infrastructure/dataBackup";
import { isSupabaseConfigured } from "../../infrastructure/supabaseClient";
import { useAuth } from "../useAuth";
import { useFocusSessions } from "../useFocusSessions";
import type { AudioIntensity, VisualPreferences, VisualIntensity, VisualTheme } from "../visualPreferences";
import { emitVisualEvent } from "../visualPreferences";

type SettingsViewProps = {
  preferences: VisualPreferences;
  onChangePreferences: (preferences: VisualPreferences) => void;
};

export const SettingsView = ({ preferences, onChangePreferences }: SettingsViewProps) => {
  const { user, signOut } = useAuth();
  const { sessions, error: focusSyncError, storageMode } = useFocusSessions();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [dataActionMessage, setDataActionMessage] = useState<string | null>(null);
  const [dataActionError, setDataActionError] = useState<string | null>(null);
  const [isDataActionRunning, setIsDataActionRunning] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const refreshSyncStatus = async () => {
    try {
      setSyncStatus(await getSyncStatus());
    } catch (error) {
      setDataActionError(error instanceof Error ? error.message : "Erro ao carregar status de sincronizacao.");
    }
  };

  useEffect(() => {
    void refreshSyncStatus();
  }, []);

  const runDataAction = async (action: () => Promise<void>, successMessage: string, shouldReload = false) => {
    setIsDataActionRunning(true);
    setDataActionError(null);
    setDataActionMessage(null);

    try {
      await action();
      setDataActionMessage(successMessage);
      await refreshSyncStatus();

      if (shouldReload) {
        window.setTimeout(() => window.location.reload(), 700);
      }
    } catch (error) {
      setDataActionError(error instanceof Error ? error.message : "Erro ao executar acao de dados.");
    } finally {
      setIsDataActionRunning(false);
    }
  };

  const handleExport = async () => {
    await runDataAction(async () => {
      const backup = await readActiveBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `mmo-system-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    }, "Backup exportado.");
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!confirm("Importar este backup vai substituir os dados do modo atual. Continuar?")) {
      return;
    }

    await runDataAction(async () => {
      const backup = JSON.parse(await file.text()) as AppBackup;

      if (backup.version !== 1 || !backup.data) {
        throw new Error("Arquivo de backup invalido.");
      }

      await writeActiveBackup(backup);
    }, "Backup importado. Recarregando dados...", true);
  };

  const handleMigrateLocalToSupabase = async () => {
    if (!confirm("Enviar os dados locais para o Supabase vai substituir os dados atuais da nuvem. Continuar?")) {
      return;
    }

    await runDataAction(
      async () => migrateLocalBackupToSupabase(),
      "Dados locais enviados para o Supabase. Recarregando...",
      true,
    );
  };

  const handleClearLocal = async () => {
    if (!confirm("Limpar dados locais deste navegador? Dados no Supabase nao serao apagados.")) {
      return;
    }

    await runDataAction(async () => clearLocalBackupData(), "Dados locais apagados. Recarregando...", true);
  };

  return (
    <section className="content-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">System menu</p>
          <h1>Configuracoes</h1>
        </div>
        <ShieldCheck size={30} />
      </div>
      <div className="settings-list">
        <div className="settings-row">
          <Database size={20} />
          <div>
            <strong>Persistencia</strong>
            <span>{isSupabaseConfigured ? "Supabase ativo" : "Modo localStorage"}</span>
          </div>
        </div>
        <div className="settings-row">
          <ShieldCheck size={20} />
          <div>
            <strong>Autenticacao</strong>
            <span>{isSupabaseConfigured ? "Login habilitado" : "Desabilitada no modo local"}</span>
          </div>
        </div>
        <div className="settings-row settings-row-account">
          <UserRound size={20} />
          <div>
            <strong>Conta</strong>
            <span>{user?.email ?? "Usuario local"}</span>
            <small>
              Sessoes de foco: {sessions.length} · {storageMode === "supabase" ? "sincronizadas no Supabase" : "salvas neste navegador"}
            </small>
            {focusSyncError && <small className="settings-warning">{focusSyncError}</small>}
          </div>
          {isSupabaseConfigured && user && (
            <button type="button" className="secondary-button" onClick={signOut}>
              <LogOut size={16} />
              Sair
            </button>
          )}
        </div>
        <div className="settings-row settings-row-data">
          <Database size={20} />
          <div>
            <strong>Dados e sincronizacao</strong>
            <span>
              Fonte: {syncStatus?.source === "supabase" ? "Supabase" : "localStorage"} · Missoes:{" "}
              {syncStatus?.quests ?? 0} · Skills: {syncStatus?.skills ?? 0} · Recompensas:{" "}
              {syncStatus?.rewards ?? 0} · Foco: {syncStatus?.focusSessions ?? 0}
            </span>
            {syncStatus?.updatedAt && <small>Ultima leitura: {new Date(syncStatus.updatedAt).toLocaleString()}</small>}
            {dataActionMessage && <small>{dataActionMessage}</small>}
            {dataActionError && <small className="settings-warning">{dataActionError}</small>}
          </div>
          <div className="settings-data-actions">
            <button type="button" className="secondary-button" onClick={handleExport} disabled={isDataActionRunning}>
              <Download size={16} />
              Exportar
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => importInputRef.current?.click()}
              disabled={isDataActionRunning}
            >
              <Upload size={16} />
              Importar
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleMigrateLocalToSupabase}
              disabled={!isSupabaseConfigured || !user || isDataActionRunning}
            >
              <CloudUpload size={16} />
              Local para nuvem
            </button>
            <button type="button" className="secondary-button" onClick={refreshSyncStatus} disabled={isDataActionRunning}>
              <RefreshCw size={16} />
              Atualizar
            </button>
            <button type="button" className="secondary-button" onClick={handleClearLocal} disabled={isDataActionRunning}>
              <Trash2 size={16} />
              Limpar local
            </button>
            <input ref={importInputRef} type="file" accept="application/json" hidden onChange={handleImport} />
          </div>
        </div>
        <div className="settings-row settings-row-controls">
          <ShieldCheck size={20} />
          <div>
            <strong>Tema visual</strong>
            <select
              value={preferences.theme}
              onChange={(event) =>
                onChangePreferences({ ...preferences, theme: event.target.value as VisualTheme })
              }
            >
              <option value="auto">Automatico</option>
              <option value="cyan">Ciano</option>
              <option value="green">Verde</option>
              <option value="red">Vermelho</option>
            </select>
          </div>
        </div>
        <div className="settings-row settings-row-controls">
          <Database size={20} />
          <div>
            <strong>Intensidade visual</strong>
            <select
              value={preferences.intensity}
              onChange={(event) =>
                onChangePreferences({ ...preferences, intensity: event.target.value as VisualIntensity })
              }
            >
              <option value="off">Desligado</option>
              <option value="subtle">Sutil</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
            </select>
          </div>
        </div>
        <div className="settings-row settings-row-controls">
          <Volume2 size={20} />
          <div>
            <strong>Intensidade sonora</strong>
            <select
              value={preferences.audioIntensity}
              onChange={(event) =>
                onChangePreferences({ ...preferences, audioIntensity: event.target.value as AudioIntensity })
              }
            >
              <option value="off">Desligado</option>
              <option value="subtle">Sutil</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
            </select>
          </div>
        </div>
        <div className="settings-row settings-row-controls">
          <Volume2 size={20} />
          <div>
            <strong>Volume</strong>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={preferences.audioVolume}
              onChange={(event) =>
                onChangePreferences({ ...preferences, audioVolume: Number(event.target.value) })
              }
              onPointerUp={() => emitVisualEvent("ui-confirm")}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
