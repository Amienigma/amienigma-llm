import { Clapperboard, Compass, ImageIcon, MessageCircle } from "lucide-react";
import { useOrbit } from "@/lib/chat/store";
import type { AppView } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

export function DesktopNav() {
  const view = useOrbit((s) => s.view);
  const items: { id: AppView; label: string; icon: typeof Compass }[] = [
    { id: "home", label: "Chat", icon: MessageCircle },
    { id: "imagine", label: "Image", icon: ImageIcon },
    { id: "motion", label: "Video", icon: Clapperboard },
    { id: "discover", label: "Discover", icon: Compass },
  ];

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === "home" ? view === "home" || view === "chat" : view === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={cn(
              "flex h-10 items-center gap-2 rounded-pill px-3 text-sm font-medium",
              active ? "bg-bg-subtle text-fg" : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
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
            <Icon className="size-4" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
