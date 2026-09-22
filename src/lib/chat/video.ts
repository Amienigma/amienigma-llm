import type { VideoDuration, VideoRatio } from "./types";

export async function startVideo(
  input: {
    prompt: string;
    duration: VideoDuration;
    ratio: VideoRatio;
    imageUrl?: string;
  },
  signal?: AbortSignal,
): Promise<{ requestId: string }> {
  const res = await fetch("/api/video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  const json = (await res.json().catch(() => ({}))) as {
    requestId?: string;
    error?: string;
  };
  if (!res.ok || !json.requestId) {
    throw new Error(json.error ?? "Could not start that video.");
  }
  return { requestId: json.requestId };
}

export async function waitForVideo(
  requestId: string,
  opts: { signal?: AbortSignal; onProgress?: (n: number) => void } = {},
): Promise<string> {
  const started = Date.now();
  while (Date.now() - started < 180_000) {
    if (opts.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    const res = await fetch(`/api/video?id=${encodeURIComponent(requestId)}`, {
      signal: opts.signal,
    });
    const json = (await res.json().catch(() => ({}))) as {
      status?: string;
      url?: string;
      error?: string;
      progress?: number;
    };
    if (typeof json.progress === "number") {
      const n = json.progress <= 1 ? Math.round(json.progress * 100) : Math.round(json.progress);
      opts.onProgress?.(Math.min(99, Math.max(0, n)));
    }
    if (json.url) {
      opts.onProgress?.(100);
      return json.url;
    }
    if (!res.ok || json.status === "failed" || json.status === "expired") {
      throw new Error(json.error ?? "Could not create that video.");
    }
    await sleep(3500, opts.signal);
  }
  throw new Error("That clip is taking too long. Try a shorter prompt.");
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}
