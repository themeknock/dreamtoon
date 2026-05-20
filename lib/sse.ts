export type SSEvent = { event: string; data: unknown };

/**
 * Parse an SSE stream from a Response.body. Yields { event, data } objects
 * where `data` is JSON-parsed (or the raw string if non-JSON).
 */
export async function* readSSE(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncGenerator<SSEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) return;
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const chunk = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const parsed = parseEvent(chunk);
        if (parsed) yield parsed;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function parseEvent(chunk: string): SSEvent | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of chunk.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  const raw = dataLines.join("\n");
  let data: unknown = raw;
  try {
    data = JSON.parse(raw);
  } catch {
    /* keep raw */
  }
  return { event, data };
}
