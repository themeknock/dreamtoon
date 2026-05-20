import type { Env } from "../env";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function transcribeAudio(
  env: Env,
  audioBytes: Uint8Array,
): Promise<string> {
  // whisper-large-v3-turbo takes base64-encoded audio (NOT a byte array).
  const audio = bytesToBase64(audioBytes);
  const response = (await env.AI.run("@cf/openai/whisper-large-v3-turbo" as never, {
    audio,
  } as never)) as { text?: string } | unknown;

  const text =
    (response as { text?: string })?.text ??
    (typeof response === "string" ? response : "");
  return text.trim();
}

export function looksLikeSpeech(transcript: string): boolean {
  const cleaned = transcript.trim();
  if (cleaned.length < 3) return false;
  // Script-agnostic: count tokens containing any Unicode letter (Urdu, Arabic,
  // Hindi, Latin, …). The old ASCII-only check rejected every non-English dream.
  const tokens = cleaned.split(/\s+/);
  const wordish = tokens.filter((t) => /\p{L}/u.test(t)).length;
  return wordish >= 2;
}
