"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatDuration } from "@/lib/duration";
import { Input } from "@/components/ui/Input";

interface IdleAlertProps {
  elapsedMs: number;
  startedAt: number;
  onDismiss: () => void;
  onStop: () => void;
  onAdjustStart: (newStartMs: number) => void;
}

function toDateTimeLocal(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export function IdleAlert({
  elapsedMs,
  startedAt,
  onDismiss,
  onStop,
  onAdjustStart,
}: IdleAlertProps) {
  const [adjustMode, setAdjustMode] = useState(false);
  const [newStart, setNewStart] = useState(() => toDateTimeLocal(startedAt));
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const handleAdjust = () => {
    const parsed = new Date(newStart).getTime();
    if (isNaN(parsed)) {
      setAdjustError("Invalid date/time.");
      return;
    }
    if (parsed >= Date.now()) {
      setAdjustError("Start time must be in the past.");
      return;
    }
    onAdjustStart(parsed);
  };

  const hours = (elapsedMs / 3_600_000).toFixed(1);

  return (
    <Modal open={true} onClose={onDismiss}>
      <div className="p-6 max-w-sm w-full">
        <div className="flex items-start gap-3 mb-5">
          <span className="text-2xl mt-0.5">⏰</span>
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Timer still running</h2>
            <p className="text-sm text-zinc-400 mt-1">
              You&apos;ve been tracking for{" "}
              <span className="text-orange-400 font-medium">{formatDuration(elapsedMs)}</span>{" "}
              ({hours}h). Still working?
            </p>
          </div>
        </div>

        {adjustMode ? (
          <div className="mb-5">
            <Input
              label="Adjust start time"
              type="datetime-local"
              value={newStart}
              onChange={(e) => {
                setNewStart(e.target.value);
                setAdjustError(null);
              }}
              error={adjustError ?? undefined}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          {adjustMode ? (
            <>
              <Button variant="primary" onClick={handleAdjust} className="w-full justify-center">
                Save start time
              </Button>
              <Button
                variant="ghost"
                onClick={() => setAdjustMode(false)}
                className="w-full justify-center"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={onDismiss} className="w-full justify-center">
                Still working — keep going
              </Button>
              <Button
                variant="ghost"
                onClick={() => setAdjustMode(true)}
                className="w-full justify-center"
              >
                Adjust start time
              </Button>
              <Button variant="danger" onClick={onStop} className="w-full justify-center">
                Stop timer now
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
