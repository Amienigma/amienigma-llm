import { useEffect, useRef, useState } from "react";
import { ArrowUp, AudioLines, Square } from "lucide-react";
import { cn } from "@/lib/utils";

type SpeechRec = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeech(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function Composer({
  placeholder,
  disabled,
  onSend,
}: {
  placeholder: string;
  disabled?: boolean;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  useEffect(() => {
    return () => recRef.current?.stop();
  }, []);

  function submit(text?: string) {
    const next = (text ?? value).trim();
    if (!next || disabled) return;
    recRef.current?.stop();
    setListening(false);
    setValue("");
    onSend(next);
  }

  function toggleTalk() {
    const Ctor = getSpeech();
    if (!Ctor) {
      areaRef.current?.focus();
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    rec.onresult = (ev) => {
      let text = "";
      for (let i = 0; i < ev.results.length; i++) {
        text += ev.results[i][0]?.transcript ?? "";
      }
      setValue(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <form
      className="mx-auto w-full max-w-2xl px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 md:pb-10"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div
        className={cn(
          "flex items-end gap-2 rounded-pill border border-border bg-bg-elevated py-1.5 pr-1.5 pl-4 shadow-soft",
          "focus-within:border-border-strong",
        )}
      >
        <textarea
          ref={areaRef}
          rows={1}
          value={value}
          disabled={disabled}
          placeholder={listening ? "Listening…" : placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="max-h-40 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-base text-fg outline-none placeholder:text-fg-subtle disabled:opacity-60"
          aria-label="Message"
        />
        {canSend ? (
          <button
            type="submit"
            className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-fg text-bg transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowUp className="size-5" strokeWidth={2.2} />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleTalk}
            disabled={disabled}
            className={cn(
              "flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-pill px-4 text-sm font-medium transition-transform duration-150 ease-out active:scale-[0.96]",
              listening ? "bg-danger text-danger-fg" : "bg-accent text-accent-fg",
            )}
            aria-label={listening ? "Stop listening" : "Talk"}
          >
            {listening ? (
              <>
                <Square className="size-3.5 fill-current" />
                Stop
              </>
            ) : (
              <>
                <Waveform />
                Talk
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}

function Waveform() {
  return <AudioLines className="size-4" strokeWidth={2.2} />;
}
