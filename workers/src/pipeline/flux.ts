import type { Env } from "../env";

// Flux Schnell on Workers AI returns JPEG; accept PNG too for the fal fallback.

export async function generatePanel(
  env: Env,
  prompt: string,
  panelIndex: number,
): Promise<Uint8Array> {
  const baseSeed = Math.floor(Math.random() * 1_000_000) + panelIndex * 1009;

  // Try Workers AI Flux Schnell first
  try {
    const bytes = await runWorkersAi(env, prompt, baseSeed);
    if (!looksBroken(bytes)) return bytes;
  } catch (e) {
    console.warn("flux_workers_ai_failed_attempt_1", e);
  }

  // Retry once with reseed
  try {
    const bytes = await runWorkersAi(env, prompt, baseSeed + 7919);
    if (!looksBroken(bytes)) return bytes;
  } catch (e) {
    console.warn("flux_workers_ai_failed_attempt_2", e);
  }

  // fal.ai fallback
  if (env.FAL_KEY) {
    return runFal(env, prompt);
  }

  throw new Error(`flux_panel_${panelIndex}_failed`);
}

async function runWorkersAi(
  env: Env,
  prompt: string,
  seed: number,
): Promise<Uint8Array> {
  const resp = (await env.AI.run("@cf/black-forest-labs/flux-1-schnell" as never, {
    prompt,
    steps: 4,
    seed,
  } as never)) as { image?: string } | ReadableStream | unknown;

  if (resp instanceof ReadableStream) {
    const buf = await new Response(resp).arrayBuffer();
    return new Uint8Array(buf);
  }
  if (resp && typeof (resp as { image?: string }).image === "string") {
    return base64ToBytes((resp as { image: string }).image);
  }
  throw new Error("flux_unexpected_response_shape");
}

async function runFal(env: Env, prompt: string): Promise<Uint8Array> {
  const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      Authorization: `Key ${env.FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: "square_hd",
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
    }),
  });
  if (!res.ok) {
    throw new Error(`fal_status_${res.status}`);
  }
  const json = (await res.json()) as {
    images?: { url: string }[];
  };
  const url = json.images?.[0]?.url;
  if (!url) throw new Error("fal_no_image_url");
  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new Error(`fal_fetch_${imgRes.status}`);
  return new Uint8Array(await imgRes.arrayBuffer());
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function looksBroken(bytes: Uint8Array): boolean {
  if (bytes.length < 5000) return true;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  return !(isPng || isJpeg);
}
