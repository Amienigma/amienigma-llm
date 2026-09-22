import { useState } from "react";
import type { ImagineRatio, MediaItem } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

const RATIOS: { id: ImagineRatio; label: string }[] = [
  { id: "1:1", label: "1:1" },
  { id: "16:9", label: "16:9" },
  { id: "9:16", label: "9:16" },
  { id: "4:3", label: "4:3" },
  { id: "3:4", label: "3:4" },
];

const PRESETS = [
  "A quiet coastal town at blue hour, cinematic",
  "Product photo of a ceramic mug on linen",
  "Editorial portrait in a sunlit greenhouse",
  "Isometric tiny library in a tree hollow",
];

export function ImagineStudio({
  draft,
  onDraft,
  busy,
  error,
  images,
  onGenerate,
  onAnimate,
}: {
  draft: string;
  onDraft: (v: string) => void;
  busy: boolean;
  error?: string | null;
  images: MediaItem[];
  onGenerate: (prompt: string, ratio: ImagineRatio) => void;
  onAnimate: (url: string, prompt: string) => void;
}) {
  const [ratio, setRatio] = useState<ImagineRatio>("1:1");
  const stills = images.filter((m) => m.kind === "image");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-6">
      <header className="mb-5">
        <h1 className="font-display text-2xl font-medium tracking-tight">Imagine</h1>
        <p className="mt-1 text-sm text-fg-muted">Describe a scene. Amienigma will paint it.</p>
      </header>

      <div className="rounded-lg border border-border bg-bg-elevated p-3 shadow-soft">
        <textarea
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          rows={4}
          placeholder="A glass cipher on a dark pedestal…"
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
          </div>
          <button
            type="button"
            disabled={busy || draft.trim().length < 3}
            onClick={() => onGenerate(draft.trim(), ratio)}
            className="h-10 rounded-pill bg-accent px-4 text-sm font-medium text-accent-fg transition-transform duration-150 active:scale-[0.96] disabled:opacity-40"
          >
            {busy ? "Creating…" : "Generate"}
          </button>
        </div>
      </div>

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

      {stills.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-3">
          {stills.map((img) => (
            <figure key={img.id} className="overflow-hidden rounded-md bg-bg-subtle">
              <img src={img.url} alt={img.prompt} className="aspect-square w-full object-cover" />
              <figcaption className="space-y-2 px-2 py-2">
                <p className="line-clamp-2 text-xs text-fg-muted">{img.prompt}</p>
                <button
                  type="button"
                  onClick={() => onAnimate(img.url, img.prompt)}
                  className="h-9 w-full rounded-pill bg-fg text-xs font-medium text-bg transition-transform duration-150 active:scale-[0.96]"
                >
                  Animate
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </div>
  );
}
