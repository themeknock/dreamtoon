export const MAX_RECORD_MS = 15_000;

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

export function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const mime of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

export function extensionForMime(mime: string): string {
  if (mime.startsWith("audio/webm")) return "webm";
  if (mime.startsWith("audio/mp4")) return "m4a";
  if (mime.startsWith("audio/ogg")) return "ogg";
  return "bin";
}

export function audioBlobToFormData(blob: Blob): FormData {
  const ext = extensionForMime(blob.type);
  const fd = new FormData();
  fd.append("audio", blob, `dream.${ext}`);
  return fd;
}
