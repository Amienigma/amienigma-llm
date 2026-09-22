import { useState } from "react";
import { X } from "lucide-react";
import { DISCOVER, type DiscoverItem } from "@/data/discover";
import { cn } from "@/lib/utils";

export function DiscoverFeed({
  onRemix,
  onVideo,
}: {
  onRemix: (prompt: string) => void;
  onVideo: (prompt: string) => void;
}) {
  const [open, setOpen] = useState<DiscoverItem | null>(null);

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <header className="mb-6">
          <h1 className="font-display text-2xl font-medium tracking-tight">Discover</h1>
          <p className="mt-1 text-sm text-fg-muted">Prompts to remix as stills or clips.</p>
        </header>
        <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
          {DISCOVER.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpen(item)}
              className="mb-3 block w-full break-inside-avoid overflow-hidden rounded-lg bg-bg-subtle text-left shadow-soft transition-transform duration-200 ease-out hover:-translate-y-0.5"
            >
              <img
                src={item.src}
                alt={item.title}
                className={cn(
                  "w-full object-cover",
                  item.span === "tall" && "aspect-[3/4]",
                  item.span === "wide" && "aspect-[16/9]",
                  item.span === "square" && "aspect-square",
                )}
              />
              <span className="block px-3 py-2.5 text-sm font-medium">{item.title}</span>
            </button>
          ))}
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-fg/40 p-0 sm:items-center sm:p-6"
          onClick={() => setOpen(null)}
          role="presentation"
        >
          <div
            className="relative max-h-dvh w-full max-w-lg overflow-auto rounded-t-xl bg-bg-elevated shadow-lift sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={open.title}
          >
            <button
              type="button"
              className="absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-pill bg-bg/80 text-fg"
              onClick={() => setOpen(null)}
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <img src={open.src} alt={open.title} className="w-full object-cover" />
            <div className="space-y-3 p-5">
              <h2 className="font-display text-lg font-medium tracking-tight">{open.title}</h2>
              <p className="text-sm leading-normal text-fg-muted text-pretty">{open.prompt}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="h-11 flex-1 rounded-pill bg-fg text-sm font-medium text-bg transition-transform duration-150 active:scale-[0.96]"
                  onClick={() => {
                    onRemix(open.prompt);
                    setOpen(null);
                  }}
                >
                  Remix as image
                </button>
                <button
                  type="button"
                  className="h-11 flex-1 rounded-pill border border-border bg-bg-elevated text-sm font-medium text-fg transition-transform duration-150 active:scale-[0.96]"
                  onClick={() => {
                    onVideo(open.prompt);
                    setOpen(null);
                  }}
                >
                  Make a video
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
