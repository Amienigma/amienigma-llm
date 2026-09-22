import { useState } from "react";
import { Clapperboard, X } from "lucide-react";
import type { MediaItem, VideoDuration, VideoRatio } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

const RATIOS: { id: VideoRatio; label: string }[] = [
  { id: "16:9", label: "16:9" },
  { id: "9:16", label: "9:16" },
  { id: "1:1", label: "1:1" },
];

const DURATIONS: { id: VideoDuration; label: string }[] = [
  { id: 6, label: "6s" },
  { id: 10, label: "10s" },
];

const PRESETS = [
  "Slow cinematic push-in on a quiet coastal town at blue hour",
  "Steam rises from a ceramic mug; camera orbits the table",
  "Rain on a neon street, reflections blooming in the asphalt",
  "A glass sculpture turning under studio light, dust in the beam",
];

export function MotionStudio({
  draft,
  onDraft,
  stillUrl,
  onClearStill,
  busy,
  progress,
  error,
  clips,
  onGenerate,
  onAnimateStill,
}: {
  draft: string;
  onDraft: (v: string) => void;
  stillUrl: string | null;
  onClearStill: () => void;
  busy: boolean;
  progress: number;
  error?: string | null;
  clips: MediaItem[];
  onGenerate: (prompt: string, ratio: VideoRatio, duration: VideoDuration) => void;
  onAnimateStill?: (url: string, prompt: string) => void;
}) {
  const [ratio, setRatio] = useState<VideoRatio>("16:9");
  const [duration, setDuration] = useState<VideoDuration>(6);
  const videos = clips.filter((c) => c.kind === "video");
  const stills = clips.filter((c) => c.kind === "image").slice(0, 6);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-6">
      <header className="mb-5">
        <h1 className="font-display text-2xl font-medium tracking-tight">Video</h1>
        <p className="mt-1 text-sm text-fg-muted text-pretty">
          Describe a shot. Amienigma will film it — or animate a still you already made.
        </p>
      </header>

      <div className="rounded-lg border border-border bg-bg-elevated p-3 shadow-soft">
        {stillUrl ? (
          <div className="mb-3 flex items-center gap-3 rounded-md bg-bg-subtle p-2">
            <img src={stillUrl} alt="" className="size-16 rounded-sm object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium">Animating this still</p>
              <p className="text-xs text-fg-muted">The first frame stays; motion is added.</p>
            </div>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-sm text-fg-muted hover:text-fg"
              aria-label="Remove still"
              onClick={onClearStill}
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}
        <textarea
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          rows={4}
          placeholder={
            stillUrl
              ? "Slow push-in, wind in the trees, natural light shift…"
              : "A glass cipher turning under a single studio light…"
          }
          className="w-full resize-none bg-transparent text-base outline-none placeholder:text-fg-subtle"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {RATIOS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRatio(r.id)}
                className={cn(
                  "h-8 rounded-pill px-3 text-xs font-medium",
                  ratio === r.id ? "bg-fg text-bg" : "bg-bg-subtle text-fg-muted",
                )}
              >
                {r.label}
              </button>
            ))}
            {DURATIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDuration(d.id)}
                className={cn(
                  "h-8 rounded-pill px-3 text-xs font-medium",
                  duration === d.id ? "bg-fg text-bg" : "bg-bg-subtle text-fg-muted",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={busy || draft.trim().length < 3}
            onClick={() => onGenerate(draft.trim(), ratio, duration)}
            className="h-10 rounded-pill bg-accent px-4 text-sm font-medium text-accent-fg transition-transform duration-150 active:scale-[0.96] disabled:opacity-40"
          >
            {busy ? "Filming…" : stillUrl ? "Animate" : "Generate"}
          </button>
        </div>
      </div>

      {busy ? (
        <div className="mt-4">
          <div className="h-1 overflow-hidden rounded-pill bg-bg-subtle">
            <div
              className="h-full bg-accent transition-[width] duration-500 ease-out"
              style={{ width: `${Math.max(6, progress)}%` }}
            />
          </div>
          <p className="mt-2 text-sm tabular-nums text-fg-muted">
            Composing the clip… {Math.max(0, progress)}%
          </p>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onDraft(p)}
            className="rounded-pill border border-border px-3 py-1.5 text-xs text-fg-muted hover:bg-bg-subtle"
          >
            {p}
          </button>
        ))}
      </div>

      {!stillUrl && stills.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-fg-muted">Animate a still</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {stills.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => onAnimateStill?.(img.url, img.prompt)}
                className="overflow-hidden rounded-md bg-bg-subtle"
                aria-label={`Animate: ${img.prompt}`}
              >
                <img src={img.url} alt="" className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {videos.length > 0 ? (
        <section className="mt-8 space-y-4">
          <h2 className="text-sm font-medium text-fg-muted">Your clips</h2>
          {videos.map((clip) => (
            <figure key={clip.id} className="overflow-hidden rounded-md bg-bg-subtle">
              <video
                src={clip.url}
                controls
                playsInline
                className="aspect-video w-full bg-fg/90 object-contain"
              />
              <figcaption className="line-clamp-2 px-3 py-2 text-xs text-fg-muted">
                {clip.prompt}
              </figcaption>
            </figure>
          ))}
        </section>
      ) : !busy ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-center text-fg-muted">
          <Clapperboard className="size-6" />
          <p className="text-sm">No clips yet. Describe a shot to film one.</p>
        </div>
      ) : null}
    </div>
  );
}
