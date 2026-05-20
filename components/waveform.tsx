"use client";

import { useEffect, useRef } from "react";

type Props = {
  stream: MediaStream | null;
  className?: string;
};

const BAR_WIDTH = 3;
const BAR_GAP = 3;

/**
 * Scrolling amplitude waveform — bars represent RMS over ~32ms windows,
 * pushed right-to-left so the rightmost bar is the live "now". A faint
 * baseline is always drawn so silence still reads as "alive".
 *
 * Voice Memos / Granola pattern. Frequency-bar-in-place is the lazy default.
 */
export function Waveform({ stream, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const historyRef = useRef<number[]>([]);

  useEffect(() => {
    if (!stream) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const audioCtx = new AC();
    ctxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.6;
    source.connect(analyser);

    const buf = new Float32Array(analyser.fftSize);
    const c2d = canvas.getContext("2d");
    if (!c2d) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      c2d.setTransform(1, 0, 0, 1, 0, 0);
      c2d.scale(dpr, dpr);
    };
    resize();

    const accent = (
      getComputedStyle(document.documentElement).getPropertyValue("--accent") ||
      "#b8861f"
    ).trim();
    const accentDeep = (
      getComputedStyle(document.documentElement).getPropertyValue("--accent-deep") ||
      "#9a6f15"
    ).trim();
    const rule = (
      getComputedStyle(document.documentElement).getPropertyValue("--rule") ||
      "#e3d8bc"
    ).trim();

    let lastSample = performance.now();
    const SAMPLE_MS = 32;

    const draw = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const slots = Math.max(8, Math.floor(w / (BAR_WIDTH + BAR_GAP)));

      // Sample one new bar every ~32ms
      if (now - lastSample >= SAMPLE_MS) {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i]! * buf[i]!;
        const rms = Math.sqrt(sum / buf.length);
        // soft-knee: emphasize quiet sounds without amplifying noise floor
        const v = Math.min(1, Math.pow(rms * 4, 0.7));
        historyRef.current.push(v);
        if (historyRef.current.length > slots) {
          historyRef.current.shift();
        }
        lastSample = now;
      }

      c2d.clearRect(0, 0, w, h);

      // Baseline — always-on faint line, so silence still reads alive
      c2d.fillStyle = rule;
      for (let i = 0; i < slots; i++) {
        const x = w - (i + 1) * (BAR_WIDTH + BAR_GAP) + BAR_GAP;
        c2d.fillRect(x, h / 2 - 0.5, BAR_WIDTH, 1);
      }

      // Active bars — newest on the right
      const grad = c2d.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, accent);
      grad.addColorStop(1, accentDeep);
      c2d.fillStyle = grad;

      const history = historyRef.current;
      for (let i = 0; i < history.length; i++) {
        const v = history[history.length - 1 - i]!;
        const barH = Math.max(2, v * h);
        const x = w - (i + 1) * (BAR_WIDTH + BAR_GAP) + BAR_GAP;
        const y = (h - barH) / 2;
        c2d.fillRect(x, y, BAR_WIDTH, barH);
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      historyRef.current = [];
      source.disconnect();
      analyser.disconnect();
      audioCtx.close().catch(() => {});
      ctxRef.current = null;
    };
  }, [stream]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
