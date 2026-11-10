import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Clapperboard, Compass, ImageIcon, Languages, MessageCircle, Terminal } from "lucide-react";
import { useOrbit } from "@/lib/chat/store";
import type { AppView } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

type ViewItem = {
  kind: "view";
  id: AppView;
  label: string;
  icon: typeof Compass;
};

type RouteItem = {
  kind: "route";
  to: "/translator" | "/pinkroot";
  label: string;
  icon: typeof Compass;
};

const STUDIO_ITEMS: Array<ViewItem | RouteItem> = [
  { kind: "view", id: "home", label: "Chat", icon: MessageCircle },
  { kind: "view", id: "imagine", label: "Image", icon: ImageIcon },
  { kind: "view", id: "motion", label: "Video", icon: Clapperboard },
  { kind: "view", id: "discover", label: "Discover", icon: Compass },
  { kind: "route", to: "/translator", label: "Translate", icon: Languages },
  { kind: "route", to: "/pinkroot", label: "Pinkroot", icon: Terminal },
];

function useStudioPath() {
  return useRouterState({ select: (state) => state.location.pathname });
}

function goHomeView(view: AppView) {
  if (view === "home") {
    const state = useOrbit.getState();
    const conv = state.conversations.find((item) => item.id === state.activeId);
    state.setView(conv && conv.messages.length > 0 ? "chat" : "home");
    return;
  }
  useOrbit.getState().setView(view);
}

export function StudioNav({ className }: { className?: string }) {
  const pathname = useStudioPath();
  const navigate = useNavigate();
  const view = useOrbit((state) => state.view);
  const onHome = pathname === "/";

  return (
    <nav className={cn("hidden items-center gap-1 md:flex", className)}>
      {STUDIO_ITEMS.map((item) => {
        const Icon = item.icon;
        if (item.kind === "route") {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex h-10 items-center gap-2 rounded-pill px-3 text-sm font-medium",
                active ? "bg-bg-subtle text-fg" : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        }
        const active = onHome && (item.id === "home" ? view === "home" || view === "chat" : view === item.id);
        return (
          <button
            key={item.id}
            type="button"
            className={cn(
              "flex h-10 items-center gap-2 rounded-pill px-3 text-sm font-medium",
              active ? "bg-bg-subtle text-fg" : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
            )}
            onClick={() => {
              if (onHome) {
                goHomeView(item.id);
                return;
              }
              void navigate({
                href: item.id === "home" ? "/" : `/?view=${item.id}`,
              });
            }}
          >
            <Icon className="size-4" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

export function StudioBottomNav({ className }: { className?: string }) {
  const pathname = useStudioPath();
  const navigate = useNavigate();
  const view = useOrbit((state) => state.view);
  const onHome = pathname === "/";

  return (
    <nav
      className={cn(
        "flex shrink-0 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)] md:hidden",
        className,
      )}
    >
      {STUDIO_ITEMS.map((item) => {
        const Icon = item.icon;
        if (item.kind === "route") {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                active ? "text-fg" : "text-fg-subtle",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        }
        const active = onHome && (item.id === "home" ? view === "home" || view === "chat" : view === item.id);
        return (
          <button
            key={item.id}
            type="button"
            className={cn(
              "flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
              active ? "text-fg" : "text-fg-subtle",
            )}
            onClick={() => {
              if (onHome) {
                goHomeView(item.id);
                return;
              }
              void navigate({
                href: item.id === "home" ? "/" : `/?view=${item.id}`,
              });
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

export function StudioWordmark() {
  return (
    <Link to="/" className="flex items-center gap-2 text-fg">
      <span className="font-display text-base font-medium tracking-tight">Amienigma</span>
      <span className="text-xs font-semibold tracking-widest text-fg-muted">AI</span>
    </Link>
  );
}

export function StudioChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-3">
        <StudioWordmark />
        <StudioNav />
        <span className="w-16 md:hidden" />
      </header>
      <div className="min-h-0 flex-1">{children}</div>
      <StudioBottomNav />
    </div>
  );
}
