import { Database, ShieldCheck, Volume2 } from "lucide-react";
import { isSupabaseConfigured } from "../../infrastructure/supabaseClient";
import type { AudioIntensity, VisualPreferences, VisualIntensity, VisualTheme } from "../visualPreferences";
import { emitVisualEvent } from "../visualPreferences";

type SettingsViewProps = {
  preferences: VisualPreferences;
  onChangePreferences: (preferences: VisualPreferences) => void;
};

export const SettingsView = ({ preferences, onChangePreferences }: SettingsViewProps) => (
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
