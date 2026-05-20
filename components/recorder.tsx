"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ExternalLink, Phone, Mic, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MAX_RECORD_MS,
  audioBlobToFormData,
  pickMimeType,
} from "@/lib/audio";
import { workerUrl } from "@/lib/api";
import { readSSE } from "@/lib/sse";
import { resolveRefusal, type RefusalEntry } from "@/lib/refusal";
import {
  isInAppBrowser,
  checkMicPermission,
  vibrateLightTick,
  vibrateSuccessTick,
} from "@/lib/permission";
import { RecordButton } from "@/components/record-button";
import { Waveform } from "@/components/waveform";
import { StatusStream } from "@/components/status-stream";
import { PanelPreview } from "@/components/panel-preview";
import { StylePicker } from "@/components/style-picker";
import { DEFAULT_STYLE, type DreamStyle } from "@/lib/styles";
import type { Stage } from "@/lib/status-copy";

type RecorderState =
  | { kind: "idle" }
  | { kind: "in_app_browser" }
  | { kind: "permission_denied" }
  | { kind: "requesting" }
  | { kind: "recording"; startedAt: number }
  | {
      kind: "processing";
      stage: Stage;
      transcript: string | undefined;
      panelsReady: number;
    }
  | { kind: "done"; comicId: string; url: string }
  | { kind: "refusal"; entry: RefusalEntry }
  | { kind: "error"; message: string; transcript: string | undefined };

export function Recorder() {
  const router = useRouter();
  const [state, setState] = useState<RecorderState>({ kind: "idle" });
  const [elapsed, setElapsed] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [style, setStyle] = useState<DreamStyle>(DEFAULT_STYLE);
  const styleRef = useRef<DreamStyle>(DEFAULT_STYLE);
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [textValue, setTextValue] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimeoutRef = useRef<number | null>(null);
  const tickIntervalRef = useRef<number | null>(null);
  const mimeRef = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);
  const lastTickedSecondRef = useRef<number>(-1);

  // First-mount: detect WKWebView in-app browsers (Instagram, TikTok…)
  // and surface a "Open in Safari" CTA instead of attempting getUserMedia.
  useEffect(() => {
    if (isInAppBrowser()) {
      setState({ kind: "in_app_browser" });
    } else {
      void checkMicPermission().then((p) => {
        if (p === "denied") setState({ kind: "permission_denied" });
      });
    }
  }, []);

  const cleanupStream = useCallback(() => {
    setStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  const clearTimers = useCallback(() => {
    if (stopTimeoutRef.current !== null) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    if (tickIntervalRef.current !== null) {
      window.clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      abortRef.current?.abort();
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, [clearTimers]);

  const submitDream = useCallback(
    async (fd: FormData) => {
      setState({
        kind: "processing",
        stage: "uploading",
        transcript: undefined,
        panelsReady: 0,
      });
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        fd.append("style", styleRef.current);

        const res = await fetch(workerUrl("/api/dream"), {
          method: "POST",
          body: fd,
          credentials: "include",
          signal: ac.signal,
        });

        if (res.status === 429) {
          setState({
            kind: "error",
            message:
              "That's your 3 dreams for today. Tomorrow at midnight you get 3 more — or skip the wait with Pro.",
            transcript: undefined,
          });
          return;
        }
        if (!res.ok || !res.body) {
          setState({
            kind: "error",
            message: "The muse was offline — try again?",
            transcript: undefined,
          });
          return;
        }

        let stage: Stage = "listening";
        let transcript: string | undefined;
        let panelsReady = 0;

        for await (const ev of readSSE(res.body, ac.signal)) {
          const data = ev.data as Record<string, unknown>;
          switch (ev.event) {
            case "status":
              stage = (data?.stage as Stage) ?? stage;
              setState({ kind: "processing", stage, transcript, panelsReady });
              break;
            case "transcript":
              transcript = String(data?.transcript ?? "");
              setState({ kind: "processing", stage, transcript, panelsReady });
              break;
            case "panel_ready":
              panelsReady += 1;
              setState({
                kind: "processing",
                stage: "drawing",
                transcript,
                panelsReady,
              });
              break;
            case "refusal": {
              const entry = resolveRefusal(
                data?.category as string | undefined,
                data?.message as string | undefined,
              );
              setState({ kind: "refusal", entry });
              return;
            }
            case "error":
              setState({
                kind: "error",
                message: String(
                  data?.message ?? "the muse was offline — try again?",
                ),
                transcript,
              });
              return;
            case "done": {
              const comicId = String(data?.comicId ?? "");
              const url = `/c?id=${comicId}`;
              vibrateSuccessTick();
              setState({ kind: "done", comicId, url });
              router.push(url);
              return;
            }
          }
        }
        setState({
          kind: "error",
          message: "Stream ended unexpectedly",
          transcript: undefined,
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Network error",
          transcript: undefined,
        });
      }
    },
    [router],
  );

  const start = useCallback(async () => {
    if (
      state.kind !== "idle" &&
      state.kind !== "error" &&
      state.kind !== "refusal" &&
      state.kind !== "done"
    )
      return;

    // First-200ms anticipation: light haptic, set "requesting" state so
    // the ring primes in before getUserMedia even fires.
    vibrateLightTick();
    setState({ kind: "requesting" });
    setElapsed(0);
    lastTickedSecondRef.current = -1;

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });
      const mime = pickMimeType();
      mimeRef.current = mime;
      // Cap bitrate so a 15s clip stays well under the server limit + uploads
      // fast on mobile. 48kbps opus/aac is plenty for speech → Whisper.
      const recOpts: MediaRecorderOptions = { audioBitsPerSecond: 48000 };
      if (mime) recOpts.mimeType = mime;
      const rec = new MediaRecorder(mediaStream, recOpts);

      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        clearTimers();
        cleanupStream();
        const blob = new Blob(chunksRef.current, {
          type: mimeRef.current || "audio/webm",
        });
        chunksRef.current = [];

        if (blob.size < 800) {
          setState({
            kind: "error",
            message: "We didn't catch any words — was your mic on?",
            transcript: undefined,
          });
          return;
        }
        await submitDream(audioBlobToFormData(blob));
      };

      rec.start();
      recorderRef.current = rec;
      setStream(mediaStream);

      const startedAt = Date.now();
      setState({ kind: "recording", startedAt });

      tickIntervalRef.current = window.setInterval(() => {
        const e = Date.now() - startedAt;
        setElapsed(e);
        // Haptic ticks at 12s and 14s — Apple Watch breathe pattern.
        const secLeft = Math.ceil((MAX_RECORD_MS - e) / 1000);
        if (
          (secLeft === 3 || secLeft === 1) &&
          lastTickedSecondRef.current !== secLeft
        ) {
          lastTickedSecondRef.current = secLeft;
          vibrateLightTick();
        }
      }, 100);

      stopTimeoutRef.current = window.setTimeout(() => {
        vibrateSuccessTick();
        if (rec.state === "recording") rec.stop();
      }, MAX_RECORD_MS);
    } catch (err) {
      cleanupStream();
      if (err instanceof Error && err.name === "NotAllowedError") {
        setState({ kind: "permission_denied" });
        return;
      }
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Couldn't access microphone",
        transcript: undefined,
      });
    }
  }, [state.kind, clearTimers, cleanupStream, submitDream]);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state === "recording") rec.stop();
  }, []);

  const submitText = useCallback(async () => {
    const text = textValue.trim();
    if (text.length < 4) return;
    const fd = new FormData();
    fd.append("text", text);
    await submitDream(fd);
  }, [textValue, submitDream]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ kind: "idle" });
    setElapsed(0);
  }, []);

  // ───── Render branches ─────

  if (state.kind === "in_app_browser") {
    return (
      <div className="w-full max-w-[420px] rounded-lg border border-rule bg-paper p-5 text-center">
        <p className="text-ink leading-relaxed">
          Mic access is blocked inside this in-app browser. Open DreamToon in
          your real browser to record.
        </p>
        <a
          href="https://dreamtoon.app"
          className="mono mt-4 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-link"
        >
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
          Open in Safari / Chrome
        </a>
      </div>
    );
  }

  if (state.kind === "permission_denied") {
    return (
      <div className="w-full max-w-[420px] rounded-lg border border-rule bg-paper p-5 text-center">
        <p className="text-ink leading-relaxed">
          Mic is blocked. Tap the lock icon in your address bar →
          Microphone → Allow, then reload.
        </p>
        <button
          type="button"
          onClick={() => location.reload()}
          className="mono mt-4 text-[12px] uppercase tracking-[0.12em] text-link hover:underline"
        >
          Reload →
        </button>
      </div>
    );
  }

  const buttonState =
    state.kind === "done"
      ? "processing"
      : state.kind === "error" || state.kind === "refusal"
        ? "error"
        : state.kind === "processing"
          ? "processing"
          : state.kind;

  const showPicker =
    state.kind === "idle" ||
    state.kind === "error" ||
    state.kind === "refusal";

  return (
    <div className="flex flex-col items-center gap-7">
      {showPicker && (
        <div className="flex flex-col items-center gap-4">
          <div className="inline-flex rounded-full border border-rule bg-paper/70 p-1">
            {(["voice", "text"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "mono inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.1em] transition-colors",
                  mode === m
                    ? "bg-ink text-paper"
                    : "text-mute hover:text-ink",
                )}
              >
                {m === "voice" ? (
                  <Mic className="h-3.5 w-3.5" strokeWidth={1.75} />
                ) : (
                  <Type className="h-3.5 w-3.5" strokeWidth={1.75} />
                )}
                {m === "voice" ? "Speak" : "Type"}
              </button>
            ))}
          </div>
          <StylePicker
            value={style}
            onChange={(s) => {
              setStyle(s);
              styleRef.current = s;
            }}
          />
        </div>
      )}

      {mode === "voice" && (
        <RecordButton
          state={buttonState}
          elapsedMs={elapsed}
          maxMs={MAX_RECORD_MS}
          onPress={start}
          onStop={stop}
        />
      )}

      {mode === "text" && showPicker && (
        <div className="flex w-full max-w-[440px] flex-col items-center gap-3">
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value.slice(0, 1000))}
            placeholder="Type your dream… e.g. I was flying over a city made of bread."
            rows={3}
            className="w-full resize-none rounded-lg border border-rule bg-paper p-4 text-[15px] leading-relaxed text-ink outline-none placeholder:text-mute focus:border-accent"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submitText();
            }}
          />
          <div className="flex w-full items-center justify-between">
            <span className="mono text-[10px] uppercase tracking-[0.12em] text-mute">
              {textValue.trim().length}/1000
            </span>
            <button
              type="button"
              disabled={textValue.trim().length < 4}
              onClick={submitText}
              className="mono inline-flex items-center gap-2 rounded-full px-5 py-2 text-[12px] uppercase tracking-[0.1em] text-paper transition-[filter] [background-image:var(--dream-gradient)] hover:brightness-110 disabled:opacity-40"
            >
              Draw it →
            </button>
          </div>
        </div>
      )}

      <div className="flex h-20 w-full max-w-[440px] items-center justify-center">
        {state.kind === "recording" && (
          <Waveform stream={stream} className="h-16 w-full" />
        )}
        {state.kind === "processing" && (
          <div className="flex w-full flex-col items-center gap-4">
            <StatusStream
              stage={state.stage}
              panelsReady={state.panelsReady}
              className="h-10"
            />
            {(state.stage === "drawing" || state.stage === "composing") && (
              <PanelPreview panelsReady={state.panelsReady} />
            )}
          </div>
        )}
      </div>

      {state.kind === "processing" && state.transcript && (
        <p className="font-display max-w-[46ch] text-center italic leading-relaxed text-ink-2">
          &ldquo;{state.transcript}&rdquo;
        </p>
      )}

      {state.kind === "refusal" && (
        <RefusalCard entry={state.entry} onReset={reset} />
      )}

      {state.kind === "error" && (
        <div className="flex w-full max-w-[440px] items-start gap-3 rounded-lg border border-rule bg-paper p-4">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--bad)]"
            strokeWidth={1.75}
          />
          <div className="flex-1">
            <p className="text-sm text-ink">{state.message}</p>
            {state.transcript && (
              <p className="font-display mt-2 text-sm italic text-ink-2">
                &ldquo;{state.transcript}&rdquo;
              </p>
            )}
            <button
              type="button"
              onClick={reset}
              className="mono mt-3 text-[12px] uppercase tracking-[0.12em] text-link hover:underline"
            >
              Try again →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RefusalCard({
  entry,
  onReset,
}: {
  entry: RefusalEntry;
  onReset: () => void;
}) {
  if (entry.tier === "gravity") {
    return (
      <div className="w-full max-w-[460px] rounded-lg border border-rule bg-paper p-6 text-left">
        <p className="font-display text-lg leading-relaxed text-ink">
          {entry.copy}
        </p>
        {entry.hotline && (
          <a
            href={entry.hotline.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm"
          >
            <Phone className="h-4 w-4" strokeWidth={1.75} />
            {entry.hotline.label}
            {entry.hotline.phone && (
              <span className="mono text-mute"> · {entry.hotline.phone}</span>
            )}
          </a>
        )}
        <button
          type="button"
          onClick={onReset}
          className="mono mt-5 block text-[12px] uppercase tracking-[0.12em] text-mute hover:text-ink"
        >
          ← go back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[440px] rounded-lg border border-rule bg-paper p-5 text-center">
      <p className="font-display italic leading-relaxed text-ink">
        {entry.copy}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mono mt-4 text-[12px] uppercase tracking-[0.12em] text-link hover:underline"
      >
        {entry.cta?.label ?? "Try another dream"} →
      </button>
    </div>
  );
}
