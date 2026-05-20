import type { Env } from "../env";

export async function transcribeAudio(
  env: Env,
  audioBytes: Uint8Array,
): Promise<string> {
  const response = (await env.AI.run("@cf/openai/whisper-large-v3-turbo" as never, {
    audio: Array.from(audioBytes),
    language: "en",
    task: "transcribe",
  } as never)) as { text?: string } | unknown;

  const text =
    (response as { text?: string })?.text ??
    (typeof response === "string" ? response : "");
  return text.trim();
}

const NONSENSE_RATIO_THRESHOLD = 0.4;

export function looksLikeSpeech(transcript: string): boolean {
  const cleaned = transcript.trim();
  if (cleaned.length < 8) return false;
  const tokens = cleaned.split(/\s+/);
  if (tokens.length < 3) return false;
  const wordish = tokens.filter((t) => /^[a-zA-Z][a-zA-Z'-]*$/.test(t)).length;
  const ratio = wordish / tokens.length;
  return ratio >= NONSENSE_RATIO_THRESHOLD;
}
