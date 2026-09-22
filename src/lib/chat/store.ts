import { create } from "zustand";
import { uid, titleFromPrompt } from "@/lib/utils";
import type { AppView, ChatMessage, Conversation, MediaItem, ThemePref } from "./types";

const STORAGE_KEY = "amienigma-state-v1";
const LEGACY_KEY = "orbit-state-v1";
const LIBRARY_MAX = 24;

type Persisted = {
  conversations: Conversation[];
  activeId: string | null;
  theme: ThemePref;
  library: MediaItem[];
};

function load(): Persisted {
  if (typeof window === "undefined") {
    return { conversations: [], activeId: null, theme: "system", library: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return { conversations: [], activeId: null, theme: "system", library: [] };
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
      activeId: parsed.activeId ?? null,
      theme: parsed.theme === "light" || parsed.theme === "dark" ? parsed.theme : "system",
      library: Array.isArray(parsed.library) ? parsed.library : [],
    };
  } catch {
    return { conversations: [], activeId: null, theme: "system", library: [] };
  }
}

type Store = Persisted & {
  view: AppView;
  hydrated: boolean;
  imagineDraft: string;
  motionDraft: string;
  motionImageUrl: string | null;
  sidebarOpen: boolean;
  hydrate: () => void;
  persist: () => void;
  setView: (view: AppView) => void;
  setTheme: (theme: ThemePref) => void;
  setImagineDraft: (prompt: string) => void;
  setMotionDraft: (prompt: string) => void;
  setMotionImage: (url: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  newChat: () => string;
  setActive: (id: string | null) => void;
  appendMessage: (conversationId: string, message: ChatMessage) => void;
  patchMessage: (conversationId: string, messageId: string, patch: Partial<ChatMessage>) => void;
  deleteConversation: (id: string) => void;
  addMedia: (item: Omit<MediaItem, "id" | "createdAt">) => void;
  lastImage: () => MediaItem | undefined;
  active: () => Conversation | undefined;
};

export const useOrbit = create<Store>((set, get) => ({
  conversations: [],
  activeId: null,
  theme: "system",
  library: [],
  view: "home",
  hydrated: false,
  imagineDraft: "",
  motionDraft: "",
  motionImageUrl: null,
  sidebarOpen: false,

  hydrate: () => {
    const data = load();
    set({ ...data, hydrated: true });
    applyTheme(data.theme);
  },

  persist: () => {
    const { conversations, activeId, theme, library } = get();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversations, activeId, theme, library }));
    } catch {
      /* quota */
    }
  },

  setView: (view) => set({ view, sidebarOpen: false }),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
    get().persist();
  },
  setImagineDraft: (imagineDraft) => set({ imagineDraft }),
  setMotionDraft: (motionDraft) => set({ motionDraft }),
  setMotionImage: (motionImageUrl) => set({ motionImageUrl }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  newChat: () => {
    const id = uid();
    const conversation: Conversation = {
      id,
      title: "New chat",
      messages: [],
      updatedAt: Date.now(),
    };
    set((s) => ({
      conversations: [conversation, ...s.conversations],
      activeId: id,
      view: "home",
      sidebarOpen: false,
    }));
    get().persist();
    return id;
  },

  setActive: (id) => {
    const conv = get().conversations.find((c) => c.id === id);
    set({
      activeId: id,
      view: conv && conv.messages.length > 0 ? "chat" : "home",
      sidebarOpen: false,
    });
    get().persist();
  },

  appendMessage: (conversationId, message) => {
    set((s) => ({
      conversations: s.conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const title =
          c.messages.length === 0 && message.role === "user"
            ? titleFromPrompt(message.content)
            : c.title;
        return {
          ...c,
          title,
          messages: [...c.messages, message],
          updatedAt: Date.now(),
        };
      }),
      view: "chat",
    }));
    get().persist();
  },

  patchMessage: (conversationId, messageId, patch) => {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id !== conversationId
          ? c
          : {
              ...c,
              messages: c.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
              updatedAt: Date.now(),
            },
      ),
    }));
    get().persist();
  },

  deleteConversation: (id) => {
    set((s) => {
      const conversations = s.conversations.filter((c) => c.id !== id);
      const activeId = s.activeId === id ? (conversations[0]?.id ?? null) : s.activeId;
      return { conversations, activeId, view: activeId ? s.view : "home" };
    });
    get().persist();
  },

  addMedia: (item) => {
    const next: MediaItem = { ...item, id: uid(), createdAt: Date.now() };
    set((s) => ({ library: [next, ...s.library].slice(0, LIBRARY_MAX) }));
    get().persist();
  },

  lastImage: () => get().library.find((m) => m.kind === "image"),

  active: () => get().conversations.find((c) => c.id === get().activeId),
}));

export function applyTheme(pref: ThemePref) {
  if (typeof document === "undefined") return;
  const dark =
    pref === "dark" ||
    (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.classList.toggle("light", !dark);
}

export function ensureConversation(): string {
  const state = useOrbit.getState();
  if (state.activeId) return state.activeId;
  return state.newChat();
}
