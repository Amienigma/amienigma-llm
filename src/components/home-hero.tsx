import { OrbitRing } from "@/components/orbit-ring";
import { DISCOVER, STARTERS } from "@/data/discover";
import { cn } from "@/lib/utils";

const FLOATS = [
  { item: DISCOVER[0], className: "left-[4%] top-[18%] hidden w-40 lg:block xl:w-48" },
  { item: DISCOVER[3], className: "right-[6%] top-[10%] hidden w-36 md:block xl:w-44" },
  { item: DISCOVER[4], className: "right-[8%] bottom-[28%] hidden w-32 lg:block" },
  { item: DISCOVER[1], className: "left-[8%] bottom-[22%] hidden w-36 md:block xl:left-[12%]" },
];

export function HomeHero({
  onPrompt,
  onVideo,
}: {
  onPrompt: (text: string) => void;
  onVideo: (prompt: string) => void;
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4">
      {FLOATS.map((f) => (
        <button
          key={f.item.id}
          type="button"
          onClick={() => onPrompt(f.item.prompt)}
          className={cn(
            "absolute z-0 overflow-hidden rounded-lg shadow-lift transition-transform duration-200 ease-out hover:-translate-y-1",
            f.className,
          )}
          aria-label={f.item.title}
        >
          <img
            src={f.item.src}
            alt=""
            className="aspect-square w-full object-cover"
          />
          <span className="absolute inset-x-2 bottom-2 rounded-pill bg-bg/90 px-2.5 py-1 text-left text-xs font-medium text-fg">
            {f.item.title}
          </span>
        </button>
      ))}

      <div className="stagger-in relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        <OrbitRing />
        <p className="mt-6 text-xs font-semibold tracking-widest text-fg-muted uppercase">
          Amienigma AI
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
          Where should we start?
        </h1>
        <p className="mt-2 max-w-sm text-sm text-fg-muted text-pretty">
          Ask anything. Paint stills. Film short clips.
        </p>
        <div className="mt-6 flex w-full max-w-md flex-col gap-2">
          {STARTERS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => (s.id === "video" ? onVideo(s.label) : onPrompt(s.label))}
              className="rounded-md border border-border bg-bg-elevated px-4 py-3 text-left text-sm font-medium text-fg transition-colors duration-150 hover:bg-bg-subtle"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
