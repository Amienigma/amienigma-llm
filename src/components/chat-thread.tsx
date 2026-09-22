import { Copy, Volume2 } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { OrbitRing } from "@/components/orbit-ring";
import type { ChatMessage } from "@/lib/chat/types";

export function ChatThread({
  messages,
  streaming,
  onAnimate,
}: {
  messages: ChatMessage[];
  streaming?: boolean;
  onAnimate?: (url: string, prompt: string) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6">
      {messages.map((m) => (
        <article key={m.id} className="min-w-0">
          {m.role === "user" ? (
            <p className="text-lg font-semibold tracking-tight text-pretty">{m.content}</p>
          ) : (
            <div className="space-y-3">
              {m.imageUrl ? (
                <div className="space-y-2">
                  <img
                    src={m.imageUrl}
                    alt={m.imagePrompt ?? "Generated image"}
                    className="w-full max-w-lg rounded-lg object-cover shadow-soft"
                  />
                  {onAnimate && !streaming ? (
                    <button
                      type="button"
                      onClick={() => onAnimate(m.imageUrl!, m.imagePrompt ?? "")}
                      className="h-10 rounded-pill bg-fg px-4 text-sm font-medium text-bg transition-transform duration-150 active:scale-[0.96]"
                    >
                      Animate this still
                    </button>
                  ) : null}
                </div>
              ) : null}
              {m.videoUrl ? (
                <video
                  src={m.videoUrl}
                  controls
                  playsInline
                  className="w-full max-w-lg rounded-lg bg-fg/90 shadow-soft"
                />
              ) : null}
              {m.content ? <Markdown text={m.content} className="text-sm md:text-base" /> : null}
              {m.error ? <p className="text-sm text-danger">{m.error}</p> : null}
              {m.content && !streaming && !m.videoUrl && !m.imageUrl ? (
                <MessageActions text={m.content} />
              ) : null}
            </div>
          )}
        </article>
      ))}
      {streaming && messages.at(-1)?.role === "assistant" && !messages.at(-1)?.content ? (
        <p className="thinking-shimmer text-sm font-medium">Thinking</p>
      ) : null}
    </div>
  );
}

function MessageActions({ text }: { text: string }) {
  return (
    <div className="flex gap-1 pt-1">
      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-sm text-fg-subtle transition-colors hover:bg-bg-subtle hover:text-fg"
        aria-label="Copy"
        onClick={() => navigator.clipboard.writeText(text).catch(() => {})}
      >
        <Copy className="size-4" />
      </button>
      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-sm text-fg-subtle transition-colors hover:bg-bg-subtle hover:text-fg"
        aria-label="Speak"
        onClick={() => {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          window.speechSynthesis.speak(u);
        }}
      >
        <Volume2 className="size-4" />
      </button>
    </div>
  );
}

export function ChatEmptyHint() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-fg-muted">
      <OrbitRing size="sm" />
      <p className="text-sm">Ask Amienigma anything</p>
    </div>
  );
}
