"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { formatDuration } from "@/lib/duration";

type Phase = "work" | "short-break" | "long-break";

const PHASE_LABELS: Record<Phase, string> = {
  work: "Focus",
  "short-break": "Short Break",
  "long-break": "Long Break",
};

const PHASE_COLORS: Record<Phase, string> = {
  work: "text-orange-400",
  "short-break": "text-emerald-400",
  "long-break": "text-sky-400",
};

interface PomodoroConfig {
  workMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  sessionsUntilLong: number;
}

const DEFAULT_CONFIG: PomodoroConfig = {
  workMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  sessionsUntilLong: 4,
};

interface Props {
  onClose: () => void;
}

export function PomodoroWidget({ onClose }: Props) {
  const [config, setConfig] = useState<PomodoroConfig>(DEFAULT_CONFIG);
  const [showConfig, setShowConfig] = useState(false);
  const [phase, setPhase] = useState<Phase>("work");
  const [sessionCount, setSessionCount] = useState(0); // completed work sessions
  const [remainingMs, setRemainingMs] = useState(config.workMin * 60 * 1000);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  const phaseMs = useCallback(
    (p: Phase) => {
      if (p === "work") return config.workMin * 60 * 1000;
      if (p === "short-break") return config.shortBreakMin * 60 * 1000;
      return config.longBreakMin * 60 * 1000;
    },
    [config]
  );

  // Advance to next phase
  const advance = useCallback(
    (currentPhase: Phase, currentCount: number) => {
      if (currentPhase === "work") {
        const newCount = currentCount + 1;
        setSessionCount(newCount);
        const nextPhase =
          newCount % config.sessionsUntilLong === 0 ? "long-break" : "short-break";
        setPhase(nextPhase);
        setRemainingMs(phaseMs(nextPhase));
      } else {
        setPhase("work");
        setRemainingMs(phaseMs("work"));
      }
    },
    [config.sessionsUntilLong, phaseMs]
  );

  // Tick
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      setRemainingMs((prev) => {
        const next = prev - delta;
        if (next <= 0) {
          // Will advance in effect — just stop at 0
          setRunning(false);
          return 0;
        }
        return next;
      });
    }, 250);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // When timer hits 0 while running, auto-advance
  useEffect(() => {
    if (!running && remainingMs === 0) {
      advance(phase, sessionCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, remainingMs]);

  const reset = () => {
    setRunning(false);
    setRemainingMs(phaseMs(phase));
  };

  const skip = () => {
    setRunning(false);
    advance(phase, sessionCount);
  };

  const applyConfig = (newConfig: PomodoroConfig) => {
    setConfig(newConfig);
    setRunning(false);
    setPhase("work");
    setSessionCount(0);
    setRemainingMs(newConfig.workMin * 60 * 1000);
    setShowConfig(false);
  };

  const pct = remainingMs / phaseMs(phase);
  const circumference = 2 * Math.PI * 54; // r=54

  return (
    <div className="w-full border border-zinc-800 rounded-xl bg-zinc-900/80 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wider ${PHASE_COLORS[phase]}`}>
          🍅 {PHASE_LABELS[phase]}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setShowConfig((s) => !s)}
            className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded transition-colors"
          >
            ⚙
          </button>
          <button
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {showConfig ? (
        <ConfigPanel config={config} onApply={applyConfig} onCancel={() => setShowConfig(false)} />
      ) : (
        <>
          {/* Ring timer */}
          <div className="flex flex-col items-center gap-3">
            <svg width="128" height="128" className="-rotate-90">
              {/* Track */}
              <circle cx="64" cy="64" r="54" fill="none" stroke="#27272a" strokeWidth="8" />
              {/* Progress */}
              <circle
                cx="64"
                cy="64"
                r="54"
                fill="none"
                stroke={
                  phase === "work"
                    ? "#f97316"
                    : phase === "short-break"
                    ? "#34d399"
                    : "#38bdf8"
                }
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct)}
                style={{ transition: "stroke-dashoffset 0.25s linear" }}
              />
            </svg>
            {/* Time overlay — positioned over SVG */}
            <div className="-mt-[104px] mb-12 text-3xl font-mono text-zinc-100 tabular-nums">
              {formatDuration(remainingMs)}
            </div>

            {/* Session dots */}
            <div className="flex gap-1.5 mt-0">
              {Array.from({ length: config.sessionsUntilLong }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < (sessionCount % config.sessionsUntilLong)
                      ? "bg-orange-400"
                      : "bg-zinc-700"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              variant={running ? "danger" : "primary"}
              onClick={() => setRunning((r) => !r)}
              className="px-6"
            >
              {running ? "Pause" : remainingMs < phaseMs(phase) ? "Resume" : "Start"}
            </Button>
            <Button size="sm" variant="ghost" onClick={reset} disabled={running}>
              Reset
            </Button>
            <Button size="sm" variant="ghost" onClick={skip}>
              Skip →
            </Button>
          </div>

          <p className="text-center text-xs text-zinc-600">
            Session {sessionCount + 1} · {sessionCount} completed
          </p>
        </>
      )}
    </div>
  );
}

function ConfigPanel({
  config,
  onApply,
  onCancel,
}: {
  config: PomodoroConfig;
  onApply: (c: PomodoroConfig) => void;
  onCancel: () => void;
}) {
  const [local, setLocal] = useState(config);

  const field = (
    label: string,
    key: keyof PomodoroConfig,
    unit: string,
    min = 1
  ) => (
    <div className="flex items-center justify-between">
      <label className="text-sm text-zinc-300">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={120}
          value={local[key]}
          onChange={(e) =>
            setLocal((l) => ({ ...l, [key]: Number(e.target.value) }))
          }
          className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 text-center focus:outline-none focus:ring-1 focus:ring-orange-500/50"
        />
        <span className="text-xs text-zinc-500">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {field("Work duration", "workMin", "min")}
      {field("Short break", "shortBreakMin", "min")}
      {field("Long break", "longBreakMin", "min")}
      {field("Sessions until long break", "sessionsUntilLong", "sessions")}
      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="primary" onClick={() => onApply(local)} className="flex-1">
          Apply
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
}
