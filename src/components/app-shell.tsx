import { useEffect, useMemo, useRef, useState } from "react";
import {
  Clapperboard,
  Compass,
  ImageIcon,
  Menu,
  MessageCircle,
  Moon,
  Plus,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { DesktopNav } from "@/components/desktop-nav";
import { ChatEmptyHint, ChatThread } from "@/components/chat-thread";
import { Composer } from "@/components/composer";
import { DiscoverFeed } from "@/components/discover-feed";
import { HomeHero } from "@/components/home-hero";
import { ImagineStudio } from "@/components/imagine-studio";
import { MotionStudio } from "@/components/motion-studio";
import { OrbitRing } from "@/components/orbit-ring";
import { isImageIntent, isVideoIntent, wantsAnimateLastImage } from "@/lib/chat/image-intent";
import { applyTheme, ensureConversation, useOrbit } from "@/lib/chat/store";
import type { AppView, ChatMessage, ImagineRatio, VideoDuration, VideoRatio } from "@/lib/chat/types";
import { startVideo, waitForVideo } from "@/lib/chat/video";
import { cn, uid } from "@/lib/utils";

export function AppShell() {
  const view = useOrbit((s) => s.view);
  const conversations = useOrbit((s) => s.conversations);
  const activeId = useOrbit((s) => s.activeId);
  const theme = useOrbit((s) => s.theme);
  const sidebarOpen = useOrbit((s) => s.sidebarOpen);
  const imagineDraft = useOrbit((s) => s.imagineDraft);
  const motionDraft = useOrbit((s) => s.motionDraft);
  const motionImageUrl = useOrbit((s) => s.motionImageUrl);
  const library = useOrbit((s) => s.library);

  const [busy, setBusy] = useState(false);
  const [imagineBusy, setImagineBusy] = useState(false);
  const [imagineError, setImagineError] = useState<string | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId],
  );

  useEffect(() => {
    useOrbit.getState().hydrate();
  }, []);

  useEffect(() => {
    applyTheme(theme);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (useOrbit.getState().theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  function openAnimate(url: string, prompt: string) {
    useOrbit.getState().setMotionImage(url);
    useOrbit.getState().setMotionDraft(
      prompt
        ? `Slow cinematic camera move through: ${prompt}`
        : "Slow cinematic camera move, natural motion, subtle light shift",
    );
    useOrbit.getState().setView("motion");
  }

  async function send(text: string, forceImagine = false, ratio: ImagineRatio = "1:1") {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const convId = ensureConversation();
    const user: ChatMessage = {
      id: uid(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    useOrbit.getState().appendMessage(convId, user);
    useOrbit.getState().setView("chat");

    const assistantId = uid();
    useOrbit.getState().appendMessage(convId, {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    });

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setBusy(true);

    try {
      if (forceImagine || isImageIntent(trimmed)) {
        await runImagine(convId, assistantId, trimmed, ratio, ac.signal);
      } else if (isVideoIntent(trimmed)) {
        const last =
          wantsAnimateLastImage(trimmed)
            ? useOrbit.getState().lastImage()
            : undefined;
        await runVideo(
          convId,
          assistantId,
          trimmed,
          "16:9",
          6,
          last?.url,
          ac.signal,
        );
      } else {
        await runChat(convId, assistantId, ac.signal);
      }
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      useOrbit.getState().patchMessage(convId, assistantId, {
        error: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function runChat(convId: string, assistantId: string, signal: AbortSignal) {
    const conv = useOrbit.getState().conversations.find((c) => c.id === convId);
    const history = (conv?.messages ?? [])
      .filter((m) => m.id !== assistantId && (m.content || m.imageUrl || m.videoUrl))
      .map((m) => ({
        role: m.role,
        content: m.videoUrl
          ? `${m.content}\n[video: ${m.videoPrompt ?? "generated"}]`
          : m.imageUrl
            ? `${m.content}\n[image: ${m.imagePrompt ?? "generated"}]`
            : m.content,
      }));

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
      signal,
    });

    if (!res.ok) {
      let msg = "Could not reach Amienigma.";
      try {
        const j = (await res.json()) as { error?: string };
        if (j.error) msg = j.error;
      } catch {
        /* ignore */
      }
      useOrbit.getState().patchMessage(convId, assistantId, { error: msg });
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      useOrbit.getState().patchMessage(convId, assistantId, { error: "Empty response." });
      return;
    }
    const decoder = new TextDecoder();
    let acc = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      useOrbit.getState().patchMessage(convId, assistantId, { content: acc });
    }
    if (!acc.trim()) {
      useOrbit.getState().patchMessage(convId, assistantId, {
        error: "Amienigma returned an empty reply. Try again.",
      });
    }
  }

  async function runImagine(
    convId: string,
    assistantId: string,
    prompt: string,
    ratio: ImagineRatio,
    signal: AbortSignal,
  ) {
    useOrbit.getState().patchMessage(convId, assistantId, {
      content: "Creating an image…",
    });
    const res = await fetch("/api/imagine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, ratio }),
      signal,
    });
    const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok || !json.url) {
      useOrbit.getState().patchMessage(convId, assistantId, {
        content: "",
        error: json.error ?? "Could not create that image.",
      });
      return;
    }
    useOrbit.getState().addMedia({ kind: "image", url: json.url, prompt, ratio });
    useOrbit.getState().patchMessage(convId, assistantId, {
      content: "Here you go. Tap Animate if you want this still to move.",
      imageUrl: json.url,
      imagePrompt: prompt,
    });
  }

  async function runVideo(
    convId: string,
    assistantId: string,
    prompt: string,
    ratio: VideoRatio,
    duration: VideoDuration,
    imageUrl: string | undefined,
    signal: AbortSignal,
  ) {
    useOrbit.getState().patchMessage(convId, assistantId, {
      content: imageUrl ? "Animating that still…" : "Filming a clip…",
    });
    const { requestId } = await startVideo({ prompt, duration, ratio, imageUrl }, signal);
    const url = await waitForVideo(requestId, {
      signal,
      onProgress: (n) => {
        useOrbit.getState().patchMessage(convId, assistantId, {
          content: `${imageUrl ? "Animating" : "Filming"}… ${n}%`,
        });
      },
    });
    useOrbit.getState().addMedia({
      kind: "video",
      url,
      prompt,
      ratio,
      duration,
      sourceImageUrl: imageUrl,
    });
    useOrbit.getState().patchMessage(convId, assistantId, {
      content: "Here is your clip.",
      videoUrl: url,
      videoPrompt: prompt,
    });
  }

  async function generateFromStudio(prompt: string, ratio: ImagineRatio) {
    if (imagineBusy) return;
    setImagineError(null);
    setImagineBusy(true);
    try {
      const res = await fetch("/api/imagine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, ratio }),
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setImagineError(json.error ?? "Could not create that image.");
        return;
      }
      useOrbit.getState().addMedia({ kind: "image", url: json.url, prompt, ratio });
    } catch {
      setImagineError("Could not create that image.");
    } finally {
      setImagineBusy(false);
    }
  }

  async function generateVideo(prompt: string, ratio: VideoRatio, duration: VideoDuration) {
    if (videoBusy) return;
    setVideoError(null);
    setVideoBusy(true);
    setVideoProgress(4);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const imageUrl = useOrbit.getState().motionImageUrl ?? undefined;
      const { requestId } = await startVideo({ prompt, duration, ratio, imageUrl }, ac.signal);
      const url = await waitForVideo(requestId, {
        signal: ac.signal,
        onProgress: setVideoProgress,
      });
      useOrbit.getState().addMedia({
        kind: "video",
        url,
        prompt,
        ratio,
        duration,
        sourceImageUrl: imageUrl,
      });
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      setVideoError(err instanceof Error ? err.message : "Could not create that video.");
    } finally {
      setVideoBusy(false);
    }
  }

  const messages = active?.messages ?? [];
  const showHome = view === "home" || (view === "chat" && messages.length === 0);
  const composerPlaceholder = "Ask Amienigma…";
  const hideComposer = view === "discover" || view === "imagine" || view === "motion";

  return (
    <div className="flex h-dvh flex-col overflow-x-hidden bg-bg text-fg">
      <Header />
      <Sidebar />

      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-fg/20 md:hidden"
          aria-label="Close menu"
          onClick={() => useOrbit.getState().setSidebarOpen(false)}
        />
      ) : null}

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-2 md:pb-0">
        {view === "discover" ? (
          <DiscoverFeed
            onRemix={(prompt) => {
              useOrbit.getState().setImagineDraft(prompt);
              useOrbit.getState().setView("imagine");
            }}
            onVideo={(prompt) => {
              useOrbit.getState().setMotionImage(null);
              useOrbit.getState().setMotionDraft(prompt);
              useOrbit.getState().setView("motion");
            }}
          />
        ) : view === "imagine" ? (
          <ImagineStudio
            draft={imagineDraft}
            onDraft={(v) => useOrbit.getState().setImagineDraft(v)}
            busy={imagineBusy}
            error={imagineError}
            images={library}
            onGenerate={generateFromStudio}
            onAnimate={openAnimate}
          />
        ) : view === "motion" ? (
          <MotionStudio
            draft={motionDraft}
            onDraft={(v) => useOrbit.getState().setMotionDraft(v)}
            stillUrl={motionImageUrl}
            onClearStill={() => useOrbit.getState().setMotionImage(null)}
            busy={videoBusy}
            progress={videoProgress}
            error={videoError}
            clips={library}
            onGenerate={(p, r, d) => void generateVideo(p, r, d)}
            onAnimateStill={openAnimate}
          />
        ) : showHome ? (
          <HomeHero
            onPrompt={(t) => void send(t)}
            onVideo={(prompt) => {
              useOrbit.getState().setMotionDraft(prompt);
              useOrbit.getState().setMotionImage(null);
              useOrbit.getState().setView("motion");
            }}
          />
        ) : messages.length === 0 ? (
          <ChatEmptyHint />
        ) : (
          <ChatThread
            messages={messages}
            streaming={busy}
            onAnimate={openAnimate}
          />
        )}
      </main>

      {!hideComposer ? (
        <Composer
          placeholder={composerPlaceholder}
          disabled={busy}
          onSend={(t) => void send(t)}
        />
      ) : null}

      <BottomNav />
    </div>
  );
}

function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <OrbitRing size="sm" />
      <span className="flex items-baseline gap-1">
        <span className="font-display text-base font-medium tracking-tight">Amienigma</span>
        <span className="text-xs font-semibold tracking-widest text-fg-muted">AI</span>
      </span>
    </span>
  );
}

function Header() {
  const theme = useOrbit((s) => s.theme);
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between px-3">
      <button
        type="button"
        className="flex size-11 items-center justify-center rounded-sm text-fg"
        aria-label="Open chats"
        onClick={() => useOrbit.getState().setSidebarOpen(true)}
      >
        <Menu className="size-5" />
      </button>
      <button
        type="button"
        className="md:hidden"
        onClick={() => useOrbit.getState().newChat()}
        aria-label="New chat"
      >
        <Wordmark />
      </button>
      <div className="hidden items-center gap-4 md:flex">
        <Wordmark />
        <DesktopNav />
      </div>
      <div className="flex items-center">
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-sm text-fg"
          aria-label="Toggle theme"
          onClick={() => useOrbit.getState().setTheme(dark ? "light" : "dark")}
        >
          {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-sm text-fg"
          aria-label="New chat"
          onClick={() => useOrbit.getState().newChat()}
        >
          <Plus className="size-5" />
        </button>
      </div>
    </header>
  );
}

function Sidebar() {
  const open = useOrbit((s) => s.sidebarOpen);
  const conversations = useOrbit((s) => s.conversations);
  const activeId = useOrbit((s) => s.activeId);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-80 max-w-full flex-col border-r border-border bg-bg-elevated shadow-lift transition-transform duration-200 ease-out",
        open ? "translate-x-0" : "invisible pointer-events-none -translate-x-full",
      )}
      aria-hidden={!open}
      {...(!open ? { inert: true } : {})}
    >
      <div className="flex h-14 items-center justify-between px-3">
        <span className="text-sm font-semibold">Chats</span>
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-sm"
          aria-label="Close"
          onClick={() => useOrbit.getState().setSidebarOpen(false)}
        >
          <X className="size-5" />
        </button>
      </div>
      <button
        type="button"
        className="mx-3 mb-3 h-11 rounded-md bg-fg text-sm font-medium text-bg"
        onClick={() => useOrbit.getState().newChat()}
      >
        New chat
      </button>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {conversations.length === 0 ? (
          <p className="px-3 py-6 text-sm text-fg-muted">No chats yet.</p>
        ) : (
          conversations.map((c) => (
            <div
              key={c.id}
              className={cn(
                "group mb-0.5 flex items-center rounded-sm",
                c.id === activeId ? "bg-bg-subtle" : "hover:bg-bg-subtle",
              )}
            >
              <button
                type="button"
                className="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm"
                onClick={() => useOrbit.getState().setActive(c.id)}
              >
                {c.title}
              </button>
              <button
                type="button"
                className="flex size-10 shrink-0 items-center justify-center text-fg-subtle opacity-70 hover:text-danger md:opacity-0 md:group-hover:opacity-100"
                aria-label="Delete chat"
                onClick={() => useOrbit.getState().deleteConversation(c.id)}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </nav>
    </aside>
  );
}

function BottomNav() {
  const view = useOrbit((s) => s.view);
  const items: { id: AppView; label: string; icon: typeof Compass }[] = [
    { id: "home", label: "Chat", icon: MessageCircle },
    { id: "imagine", label: "Image", icon: ImageIcon },
    { id: "motion", label: "Video", icon: Clapperboard },
    { id: "discover", label: "Discover", icon: Compass },
  ];

  return (
    <nav className="flex shrink-0 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)] md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === "home" ? view === "home" || view === "chat" : view === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={cn(
              "flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium",
              active ? "text-fg" : "text-fg-subtle",
            )}
            onClick={() => {
              if (item.id === "home") {
                const s = useOrbit.getState();
                const conv = s.conversations.find((c) => c.id === s.activeId);
                s.setView(conv && conv.messages.length > 0 ? "chat" : "home");
              } else {
                useOrbit.getState().setView(item.id);
              }
            }}
          >
            <Icon className="size-5" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
