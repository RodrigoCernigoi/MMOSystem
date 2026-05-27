import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2, Clock3, Crosshair, Pause, Play, RotateCcw, Sparkles, Target, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { defaultFocusChecklist } from "../../domain/focusSession";
import type { Player } from "../../domain/player";
import type { Quest } from "../../domain/task";
import { useFocusSessions } from "../useFocusSessions";
import type { AppView } from "../navigation/appViews";
import { attributeLabels, difficultyLabels, questKindLabels } from "../viewModels";

type FocusViewProps = {
  player: Player;
  quests: Quest[];
  initialQuestId: string | null;
  onCompleteQuest: (id: string) => Promise<void>;
  onNavigate: (view: AppView) => void;
};

const focusDurations = [15, 25, 45];

const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
};

export const FocusView = ({ player, quests, initialQuestId, onCompleteQuest, onNavigate }: FocusViewProps) => {
  const openQuests = useMemo(() => quests.filter((quest) => quest.status === "open"), [quests]);
  const initialQuest = openQuests.find((quest) => quest.id === initialQuestId) ?? openQuests[0] ?? null;
  const [activeQuestId, setActiveQuestId] = useState(initialQuest?.id ?? "");
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [interruptionCount, setInterruptionCount] = useState(0);
  const [note, setNote] = useState("");
  const [checklist, setChecklist] = useState(defaultFocusChecklist);
  const { sessions, addSession } = useFocusSessions();
  const activeQuest = openQuests.find((quest) => quest.id === activeQuestId) ?? initialQuest;
  const durationSeconds = durationMinutes * 60;
  const progress = Math.min(100, Math.round((elapsedSeconds / durationSeconds) * 100));
  const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

  useEffect(() => {
    if (initialQuest?.id) {
      setActiveQuestId(initialQuest.id);
    }
  }, [initialQuest?.id]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((current) => Math.min(durationSeconds, current + 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [durationSeconds, isRunning]);

  useEffect(() => {
    if (elapsedSeconds >= durationSeconds) {
      setIsRunning(false);
    }
  }, [durationSeconds, elapsedSeconds]);

  const resetTimer = () => {
    setElapsedSeconds(0);
    setIsRunning(false);
    setStartedAt(null);
    setInterruptionCount(0);
    setNote("");
    setChecklist(defaultFocusChecklist);
  };

  const handleSelectQuest = (id: string) => {
    setActiveQuestId(id);
    resetTimer();
  };

  const handleComplete = async () => {
    if (!activeQuest) {
      return;
    }

    recordSession(true);
    await onCompleteQuest(activeQuest.id);
    resetTimer();
  };

  const handleStartPause = () => {
    if (!isRunning && !startedAt) {
      setStartedAt(new Date().toISOString());
    }

    setIsRunning((current) => !current);
  };

  const recordSession = (completedQuest: boolean) => {
    if (!activeQuest || elapsedSeconds === 0) {
      return;
    }

    addSession({
      id: crypto.randomUUID(),
      questId: activeQuest.id,
      questTitle: activeQuest.title,
      startedAt: startedAt ?? new Date().toISOString(),
      endedAt: new Date().toISOString(),
      plannedMinutes: durationMinutes,
      elapsedSeconds,
      interruptionCount,
      checklist,
      note: note.trim() || undefined,
      completedQuest,
    });
  };

  const handleFinishSession = () => {
    recordSession(false);
    resetTimer();
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist((current) =>
      current.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    );
  };

  if (!activeQuest) {
    return (
      <section className="focus-screen focus-screen-empty">
        <button className="ghost-button" type="button" onClick={() => onNavigate("today")}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div className="focus-empty-card">
          <Sparkles size={34} />
          <p className="eyebrow">Modo foco</p>
          <h1>Nenhuma missao aberta</h1>
          <p>Crie uma missao ou reabra seu painel diario para escolher a proxima acao real.</p>
          <button type="button" onClick={() => onNavigate("create")}>
            Criar missao
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="focus-screen">
      <div className="focus-orbit focus-orbit-one" />
      <div className="focus-orbit focus-orbit-two" />
      <div className="focus-topbar">
        <button className="ghost-button" type="button" onClick={() => onNavigate("today")}>
          <ArrowLeft size={18} />
          Sair
        </button>
        <div>
          <p className="eyebrow">Modo foco</p>
          <strong>Lv. {player.level} · Rank {player.rank}</strong>
        </div>
      </div>

      <motion.div
        className="focus-core"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32 }}
      >
        <div className="focus-timer" style={{ ["--progress" as string]: `${progress}%` }}>
          <span>{formatSeconds(remainingSeconds)}</span>
          <small>{progress}%</small>
        </div>
        <div className="focus-mission">
          <div className="quest-meta">
            <span className="quest-rank">Rank {difficultyLabels[activeQuest.difficulty]}</span>
            <span>{questKindLabels[activeQuest.kind]}</span>
            <span>{attributeLabels[activeQuest.attribute]}</span>
          </div>
          <h1>{activeQuest.title}</h1>
          <p>{activeQuest.importance || "Transforme esta missao em uma acao concreta agora."}</p>
          <div className="focus-duration-row">
            {focusDurations.map((minutes) => (
              <button
                className={durationMinutes === minutes ? "focus-chip focus-chip-active" : "focus-chip"}
                key={minutes}
                type="button"
                onClick={() => {
                  setDurationMinutes(minutes);
                  resetTimer();
                }}
              >
                {minutes} min
              </button>
            ))}
          </div>
          <div className="focus-actions">
            <button type="button" onClick={handleStartPause}>
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              {isRunning ? "Pausar" : "Iniciar"}
            </button>
            <button className="secondary-button" type="button" onClick={() => setInterruptionCount((current) => current + 1)}>
              <Zap size={18} />
              Interrupcao {interruptionCount}
            </button>
            <button className="secondary-button" type="button" onClick={resetTimer}>
              <RotateCcw size={18} />
              Reiniciar
            </button>
            <button type="button" onClick={() => void handleComplete()}>
              <CheckCircle2 size={18} />
              Concluir
            </button>
          </div>
          <textarea
            className="focus-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Nota rapida: resultado, dificuldade, ajuste para a proxima sessao"
            aria-label="Nota da sessao de foco"
          />
          <button className="secondary-button" type="button" onClick={handleFinishSession}>
            Salvar sessao sem concluir
          </button>
        </div>
      </motion.div>

      <div className="focus-bottom-grid">
        <article className="focus-checklist">
          <p className="eyebrow">Execucao</p>
          <h2>Sequencia de acao</h2>
          {checklist.map((item) => (
            <label className="focus-check-item" key={item.id}>
              <input type="checkbox" checked={item.checked} onChange={() => toggleChecklistItem(item.id)} />
              {item.id === "next-step" && <Crosshair size={16} />}
              {item.id === "no-context-switch" && <Clock3 size={16} />}
              {item.id === "record-result" && <Target size={16} />}
              <span>{item.label}</span>
            </label>
          ))}
        </article>
        <article className="focus-queue">
          <p className="eyebrow">Fila</p>
          <h2>Proximas missoes</h2>
          {openQuests.slice(0, 6).map((quest) => (
            <button
              className={quest.id === activeQuest.id ? "focus-queue-item focus-queue-item-active" : "focus-queue-item"}
              key={quest.id}
              type="button"
              onClick={() => handleSelectQuest(quest.id)}
            >
              <span>{quest.title}</span>
              <small>Rank {difficultyLabels[quest.difficulty]}</small>
            </button>
          ))}
          <div className="focus-session-log">
            <p className="eyebrow">Sessoes recentes</p>
            {sessions.slice(0, 3).map((session) => (
              <span key={session.id}>
                {Math.round(session.elapsedSeconds / 60)} min · {session.questTitle}
              </span>
            ))}
            {sessions.length === 0 && <span>Nenhuma sessao registrada ainda.</span>}
          </div>
        </article>
      </div>
    </section>
  );
};
