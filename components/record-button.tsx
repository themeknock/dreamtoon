"use client";

import { useEffect, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

type State =
  | "idle"
  | "requesting"
  | "recording"
  | "processing"
  | "primed"
  | "error";

type Props = {
  state: State;
  elapsedMs: number;
  maxMs: number;
  onPress: () => void;
  onStop: () => void;
};

const SIZE = 168;
const STROKE = 6;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export function RecordButton({
  state,
  elapsedMs,
  maxMs,
  onPress,
  onStop,
}: Props) {
  const [primingRing, setPrimingRing] = useState(false);

  // First-200ms anticipation: when leaving idle, draw the ring full once
  // before the recorder actually starts. Perceived latency drops to zero.
  useEffect(() => {
    if (state === "requesting") {
      setPrimingRing(true);
      const t = window.setTimeout(() => setPrimingRing(false), 220);
      return () => window.clearTimeout(t);
    }
    setPrimingRing(false);
  }, [state]);

  const progress = Math.min(1, elapsedMs / maxMs);
  const offset = CIRC * (1 - progress);

  const isRecording = state === "recording";
  const isBusy = state === "requesting" || state === "processing";

  const secondsLeft = Math.max(0, Math.ceil((maxMs - elapsedMs) / 1000));
  // Warm-shift the ring color in the final 3 seconds — TikTok pattern.
  const ringStroke = isRecording
    ? secondsLeft <= 1
      ? "var(--bad)"
      : secondsLeft <= 3
        ? "var(--warn)"
        : "url(#ring-gradient)"
    : "var(--rule)";

  const label = (() => {
    switch (state) {
      case "requesting":
        return "Asking for mic…";
      case "recording":
        return "Tap to stop";
      case "processing":
        return "Working…";
      case "error":
        return "Try again";
      default:
        return "Tap to describe your dream";
    }
  })();

  return (
    <div className="flex flex-col items-center gap-5">
      <button
        type="button"
        aria-label={isRecording ? "Stop recording" : "Start recording"}
        disabled={isBusy}
        onClick={isRecording ? onStop : onPress}
        className={cn(
          "relative flex items-center justify-center rounded-full transition-transform",
          "[touch-action:manipulation]",
          state === "idle" && "breathe",
          "hover:scale-[1.02] active:scale-[0.96]",
          "disabled:cursor-not-allowed disabled:opacity-90",
          isRecording && "rec-pulse",
        )}
        style={{
          width: SIZE,
          height: SIZE,
          transition: "transform 180ms var(--ease-dream)",
        }}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="absolute inset-0 -rotate-90"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b8861f" />
              <stop offset="100%" stopColor="#d96a36" />
            </linearGradient>
          </defs>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="var(--rule)"
            strokeWidth={STROKE}
          />
          {(isRecording || primingRing) && (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={primingRing ? "url(#ring-gradient)" : ringStroke}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={primingRing ? 0 : offset}
              style={{
                transition: primingRing
                  ? "stroke-dashoffset 200ms var(--ease-dream)"
                  : "stroke-dashoffset 120ms linear, stroke 360ms ease",
              }}
            />
          )}
        </svg>
        <span
          className={cn(
            "flex h-[136px] w-[136px] items-center justify-center rounded-full",
            "shadow-[0_8px_28px_-14px_rgba(0,0,0,0.32)] transition-all",
            !isRecording &&
              "text-paper dream-gradient-bg",
            isRecording && "bg-[color:var(--bad)] text-paper",
          )}
          style={{
            transition: "transform 220ms var(--ease-dream), background 200ms ease",
          }}
        >
          {state === "processing" || state === "requesting" ? (
            <Loader2 className="h-12 w-12 animate-spin" strokeWidth={1.5} />
          ) : isRecording ? (
            <Square className="h-9 w-9 fill-current" strokeWidth={0} />
          ) : (
            <Mic className="h-14 w-14" strokeWidth={1.5} />
          )}
        </span>
      </button>

      <div className="flex h-6 items-center gap-2 mono text-[11px] uppercase tracking-[0.14em] text-mute">
        {isRecording ? (
          <>
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[color:var(--bad)]" />
            <span>
              {formatMs(elapsedMs)} / {formatMs(maxMs)}
            </span>
          </>
        ) : (
          <span>{label}</span>
        )}
      </div>
    </div>
  );
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `00:${s.toString().padStart(2, "0")}`;
}
