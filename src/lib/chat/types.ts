export type Role = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  imageUrl?: string;
  imagePrompt?: string;
  videoUrl?: string;
  videoPrompt?: string;
  createdAt: number;
  error?: string;
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

export type AppView = "home" | "chat" | "discover" | "imagine" | "motion";

export type ThemePref = "light" | "dark" | "system";

export type ImagineRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export type VideoRatio = "16:9" | "9:16" | "1:1";

export type VideoDuration = 6 | 10;

export type MediaKind = "image" | "video";

export type MediaItem = {
  id: string;
  kind: MediaKind;
  url: string;
  prompt: string;
  createdAt: number;
  ratio?: string;
  duration?: number;
  sourceImageUrl?: string;
};
