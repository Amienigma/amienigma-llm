import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Loader2, Paperclip, PenLine, ShieldAlert, X } from "lucide-react";
import {
  MAX_ATTACHMENT_BYTES,
  MAX_TRANSLATE_CHARS,
  isAllowedTextAttachment,
} from "@/lib/translate/attachments";
import type { Channel, Locale, Tendency, TranslateResult } from "@/lib/translate/safety";

const SAMPLES = [
  "You never text me back and it makes me feel like I don't matter to you.",
  "I need the evening to myself. Please don't turn this into a fight.",
  "I'm hurt that you cancelled again. I still want to see you — I just need a plan I can count on.",
];

function fieldClass() {
  return "min-h-12 w-full appearance-none rounded-lg border border-border bg-bg-elevated px-3 py-3 text-base text-fg outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";
}

function humanize(error: unknown): string {
  if (error instanceof Error && error.message) {
    if (/fetch|network|load failed|failed to fetch/i.test(error.message)) {
      return "Couldn't reach the server. Check your connection and try again.";
    }
    if (error.message.length < 180 && !error.message.includes("\n")) return error.message;
  }
  return "Something went wrong. Please try again.";
}

async function readTextAttachment(file: File): Promise<{ filename: string; content: string }> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error("That file is too large (max 80 KB).");
  }
  if (!isAllowedTextAttachment(file.name)) {
    throw new Error("Upload a .txt, .md, .json, or .csv file. PDF and Word files are not supported yet.");
  }
  const content = await file.text();
  if (content.length > MAX_TRANSLATE_CHARS) {
    throw new Error(`That file is too long (max ${MAX_TRANSLATE_CHARS.toLocaleString()} characters).`);
  }
  return { filename: file.name, content };
}

export function Translator() {
  const baseId = useId();
  const [senderStyle, setSenderStyle] = useState<Tendency>("NOT_SURE");
  const [receiverStyle, setReceiverStyle] = useState<Tendency>("NOT_SURE");
  const [channel, setChannel] = useState<Channel>("TEXT_MESSAGE");
  const [locale, setLocale] = useState<Locale>("US");
  const [raw, setRaw] = useState("");
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const seq = useRef(0);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const outcome = result && result.kind !== "error" ? result : null;
  const notice = outcome && outcome.kind !== "ok" ? outcome : null;
  const translation = outcome?.kind === "ok" ? outcome.translation : null;
  const count = raw.length;
  const suggestion = translation?.draftSuggestions.possibleWayToSayIt ?? "";

  useEffect(() => {
    if (!outcome && !error) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("outcome")?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "nearest",
    });
  }, [outcome, error]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function run(acknowledged: boolean) {
    const text = (acknowledged ? submitted : raw).trim();
    if (text.length < 2 || loading) return;
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    setResult(null);
    setDraft("");
    setCopied(false);
    setSubmitted(text);
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawInput: text,
          senderStyle,
          receiverStyle,
          channel,
          locale,
          safetyAcknowledged: acknowledged,
          attachment: attachmentName ? { filename: attachmentName, content: text } : undefined,
        }),
      });
      const data = (await response.json()) as TranslateResult;
      if (seq.current !== id) return;
      if (!response.ok && data.kind !== "error") {
        setError(humanize(new Error("Couldn't generate suggestions. Please try again.")));
        return;
      }
      if (data.kind === "error") {
        setError(data.message);
        return;
      }
      setResult(data);
      if (data.kind === "ok") setDraft(data.translation.draftSuggestions.possibleWayToSayIt);
    } catch (caught) {
      if (seq.current !== id) return;
      setError(humanize(caught));
    } finally {
      if (seq.current === id) setLoading(false);
    }
  }

  async function copyDraft() {
    const text = draftRef.current?.value ?? draft;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      draftRef.current?.focus();
      draftRef.current?.select();
    }
  }

  return (
    <div className="bg-bg text-fg">
      <div className="h-1 bg-accent" />
      <main className="mx-auto w-full max-w-3xl px-5 pt-8 pb-28 sm:px-8 sm:pt-14">
        <header className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-fg text-bg">
            <PenLine className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-medium tracking-widest text-fg-muted uppercase">Wording desk</p>
            <h1 className="mt-1 font-display text-3xl leading-tight text-balance text-fg sm:text-4xl">
              Attachment Translator
            </h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-pretty text-fg-muted">
              Reword a hard message without sanding off what you actually mean. Paste the draft or
              upload a text file.
            </p>
          </div>
        </header>

        <aside className="mt-8 border-l-2 border-accent pl-4 text-sm leading-relaxed text-pretty text-fg-muted">
          <span className="font-medium text-fg">A note. </span>
          Attachment patterns are general tendencies, not fixed labels, and your read of another
          person is a guess. This offers wording suggestions. It isn’t therapy or a substitute for
          professional support.
        </aside>

        <form
          className="mt-8 rounded-2xl bg-bg-elevated p-5 shadow-soft sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            void run(false);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor={`${baseId}-sender`} className="text-sm font-medium text-fg">
                My tendency
              </label>
              <div className="relative">
                <select
                  id={`${baseId}-sender`}
                  value={senderStyle}
                  onChange={(event) => setSenderStyle(event.target.value as Tendency)}
                  className={`${fieldClass()} pr-10`}
                >
                  <option value="NOT_SURE">Not sure</option>
                  <option value="ANXIOUS_PATTERNS">Tends toward anxious patterns</option>
                  <option value="AVOIDANT_PATTERNS">Tends toward avoidant patterns</option>
                  <option value="FEARFUL_AVOIDANT_PATTERNS">Tends toward mixed patterns</option>
                  <option value="SECURE_PATTERNS">Tends toward secure patterns</option>
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted" aria-hidden />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={`${baseId}-receiver`} className="text-sm font-medium text-fg">
                Their tendency
              </label>
              <div className="relative">
                <select
                  id={`${baseId}-receiver`}
                  value={receiverStyle}
                  onChange={(event) => setReceiverStyle(event.target.value as Tendency)}
                  className={`${fieldClass()} pr-10`}
                >
                  <option value="NOT_SURE">Not sure — a guess is fine</option>
                  <option value="AVOIDANT_PATTERNS">May be sensitive to pressure or closeness</option>
                  <option value="ANXIOUS_PATTERNS">May be sensitive to distance or rejection</option>
                  <option value="FEARFUL_AVOIDANT_PATTERNS">May be sensitive to conflict and pressure</option>
                  <option value="SECURE_PATTERNS">Seems comfortable with direct dialogue</option>
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted" aria-hidden />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={`${baseId}-channel`} className="text-sm font-medium text-fg">
                Medium
              </label>
              <div className="relative">
                <select
                  id={`${baseId}-channel`}
                  value={channel}
                  onChange={(event) => setChannel(event.target.value as Channel)}
                  className={`${fieldClass()} pr-10`}
                >
                  <option value="TEXT_MESSAGE">Text message</option>
                  <option value="EMAIL">Email</option>
                  <option value="PHONE_CALL">Phone call</option>
                  <option value="IN_PERSON">In person</option>
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted" aria-hidden />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={`${baseId}-locale`} className="text-sm font-medium text-fg">
                Where you are
              </label>
              <div className="relative">
                <select
                  id={`${baseId}-locale`}
                  value={locale}
                  onChange={(event) => setLocale(event.target.value as Locale)}
                  className={`${fieldClass()} pr-10`}
                >
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="INTL">Somewhere else</option>
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted" aria-hidden />
              </div>
              <p className="text-sm text-fg-muted">Used only to show the right support lines.</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <label htmlFor={`${baseId}-draft`} className="text-sm font-medium text-fg">
              The unedited version
            </label>
            <textarea
              id={`${baseId}-draft`}
              rows={5}
              maxLength={MAX_TRANSLATE_CHARS}
              value={raw}
              onChange={(event) => {
                setRaw(event.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  void run(false);
                }
              }}
              placeholder="Say it the messy way first, or upload a text file."
              className="min-h-36 w-full resize-y rounded-lg border border-border bg-bg-elevated px-3 py-3 font-display text-lg leading-relaxed text-fg outline-none placeholder:font-sans placeholder:text-base placeholder:text-fg-subtle focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.md,.json,.csv,text/plain,text/markdown,application/json,text/csv"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    void readTextAttachment(file)
                      .then((attachment) => {
                        setRaw(attachment.content);
                        setAttachmentName(attachment.filename);
                        if (error) setError(null);
                      })
                      .catch((caught: unknown) => {
                        setError(humanize(caught));
                      });
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-fg hover:border-accent"
                >
                  <Paperclip className="size-4" aria-hidden />
                  Upload .txt, .md, .json, or .csv
                </button>
                {attachmentName ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-bg-subtle px-2 py-1 text-xs text-fg-muted">
                    {attachmentName}
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:text-fg"
                      aria-label="Remove file"
                      onClick={() => setAttachmentName(null)}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ) : null}
              </div>
              <span className={`tabular-nums ${count > MAX_TRANSLATE_CHARS - 200 ? "text-danger" : "text-fg-muted"}`}>
                {count}/{MAX_TRANSLATE_CHARS}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-fg">Try a rough draft</p>
            <div className="mt-2 flex flex-col gap-2">
              {SAMPLES.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setRaw(sample);
                    setAttachmentName(null);
                    if (error) setError(null);
                  }}
                  className="min-h-11 rounded-lg border border-border px-3 py-2 text-left text-sm leading-snug text-fg hover:border-accent"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || raw.trim().length < 2}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-fg px-4 text-base font-medium text-bg hover:opacity-90 disabled:bg-bg-subtle disabled:text-fg-muted sm:w-auto sm:min-w-56"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                Generating…
              </>
            ) : (
              "Generate suggestions"
            )}
          </button>
        </form>

        <div id="outcome" className="scroll-mt-6">
          {loading && (
            <p role="status" className="mt-6 text-sm text-fg-muted">
              Safety check first, then wording. This usually takes a few seconds.
            </p>
          )}

          {error && (
            <div role="alert" className="mt-6 rounded-xl border border-border bg-bg-elevated px-4 py-4 text-sm text-fg">
              {error}
            </div>
          )}

          {notice && (
            <section role="alert" className="mt-6 rounded-xl border border-accent/40 bg-accent/10 px-4 py-5 sm:px-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                <div className="min-w-0">
                  <h2 className="font-display text-2xl text-fg">
                    {notice.kind === "retry" ? "Please try again" : "Safety notice"}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-pretty text-fg">{notice.guidance}</p>
                </div>
              </div>

              {notice.kind === "intercept" && notice.crisisResources.length > 0 && (
                <ul className="mt-4 grid gap-3">
                  {notice.crisisResources.map((resource) => (
                    <li key={resource.link} className="rounded-lg bg-bg-elevated px-3 py-3 text-sm">
                      <p className="font-medium text-fg">{resource.name}</p>
                      <p className="mt-1 text-fg-muted">{resource.contactInfo}</p>
                      <a
                        href={resource.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex min-h-11 items-center text-fg underline decoration-accent underline-offset-4"
                      >
                        Open website
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              {notice.kind === "retry" && (
                <button
                  type="button"
                  onClick={() => void run(false)}
                  disabled={loading}
                  className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border bg-bg-elevated px-4 text-sm font-medium text-fg hover:border-accent disabled:text-fg-muted"
                >
                  Try again
                </button>
              )}

              {notice.kind === "intercept" && !notice.hardBlock && (
                <button
                  type="button"
                  onClick={() => void run(true)}
                  disabled={loading}
                  className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border bg-bg-elevated px-4 text-sm font-medium text-fg hover:border-accent disabled:text-fg-muted"
                >
                  I understand, generate a draft anyway
                </button>
              )}
            </section>
          )}

          {translation && (
            <div className="mt-8 flex flex-col gap-4">
              {(translation.deconstruction.senderCoreNeed ||
                translation.deconstruction.possibleReceiverSensitivity) && (
                <dl className="grid gap-4 sm:grid-cols-2">
                  {translation.deconstruction.senderCoreNeed && (
                    <div>
                      <dt className="text-sm font-medium text-fg">What you need</dt>
                      <dd className="mt-1 text-sm leading-relaxed text-pretty text-fg-muted">
                        {translation.deconstruction.senderCoreNeed}
                      </dd>
                    </div>
                  )}
                  {translation.deconstruction.possibleReceiverSensitivity && (
                    <div>
                      <dt className="text-sm font-medium text-fg">They may be sensitive to</dt>
                      <dd className="mt-1 text-sm leading-relaxed text-pretty text-fg-muted">
                        {translation.deconstruction.possibleReceiverSensitivity}
                      </dd>
                    </div>
                  )}
                </dl>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-xl border border-border p-4">
                  <h2 className="text-sm font-medium text-fg-muted">Your original words</h2>
                  <p className="mt-3 font-display text-lg leading-relaxed whitespace-pre-wrap text-fg italic">
                    “{submitted}”
                  </p>
                </section>

                <section className="rounded-xl bg-bg-elevated p-4 shadow-soft">
                  <h2 className="text-sm font-medium text-accent">A possible way to say it</h2>
                  <textarea
                    ref={draftRef}
                    rows={5}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    aria-label="Editable suggestion"
                    className="mt-3 min-h-32 w-full resize-y rounded-lg border border-border bg-bg-elevated px-3 py-2 font-display text-lg leading-relaxed text-fg outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
                  />
                  <p className="mt-2 text-sm text-fg-muted">Edit this so it sounds like you before sending.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void copyDraft()}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-fg"
                    >
                      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    {translation.draftSuggestions.alternativeShort &&
                      draft !== translation.draftSuggestions.alternativeShort && (
                        <button
                          type="button"
                          onClick={() => setDraft(translation.draftSuggestions.alternativeShort)}
                          className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-fg"
                        >
                          Use shorter version
                        </button>
                      )}
                    {suggestion && draft !== suggestion && (
                      <button
                        type="button"
                        onClick={() => setDraft(suggestion)}
                        className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-fg"
                      >
                        Restore suggestion
                      </button>
                    )}
                  </div>
                </section>
              </div>

              {(translation.communicationNotes.clarityAndHonesty ||
                translation.communicationNotes.howItEasesDefensiveness ||
                translation.senderReflection) && (
                <section className="rounded-xl border border-border px-4 py-4">
                  <h2 className="text-sm font-medium text-fg">Why this wording</h2>
                  {translation.communicationNotes.clarityAndHonesty && (
                    <p className="mt-3 text-sm leading-relaxed text-pretty text-fg-muted">
                      <span className="font-medium text-fg">Clarity and honesty. </span>
                      {translation.communicationNotes.clarityAndHonesty}
                    </p>
                  )}
                  {translation.communicationNotes.howItEasesDefensiveness && (
                    <p className="mt-3 text-sm leading-relaxed text-pretty text-fg-muted">
                      <span className="font-medium text-fg">Easing defensiveness. </span>
                      {translation.communicationNotes.howItEasesDefensiveness}
                    </p>
                  )}
                  {translation.senderReflection && (
                    <p className="mt-3 font-display text-base leading-relaxed text-pretty text-fg italic">
                      {translation.senderReflection}
                    </p>
                  )}
                </section>
              )}
            </div>
          )}
        </div>

        <footer className="mt-12 border-t border-border pt-5 text-sm leading-relaxed text-pretty text-fg-muted">
          This isn’t a crisis service. If you or someone else may be in danger, contact local
          emergency services or a confidential line.{" "}
          <a
            href="https://findahelpline.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg underline decoration-accent underline-offset-4"
          >
            Find a helpline
          </a>
          .
        </footer>
      </main>
    </div>
  );
}
