export const TEXT_ATTACHMENT_EXTENSIONS = [".txt", ".md", ".json", ".csv"] as const;
export const MAX_TRANSLATE_CHARS = 12_000;
export const MIN_TRANSLATE_CHARS = 2;
export const MAX_ATTACHMENT_BYTES = 80 * 1024;

export type TextAttachment = {
  filename: string;
  content: string;
};

export function extensionOf(filename: string): string {
  const trimmed = filename.trim();
  const index = trimmed.lastIndexOf(".");
  return index >= 0 ? trimmed.slice(index).toLowerCase() : "";
}

export function isAllowedTextAttachment(filename: string): boolean {
  return (TEXT_ATTACHMENT_EXTENSIONS as readonly string[]).includes(extensionOf(filename));
}

export function parseTextAttachment(value: unknown): TextAttachment | { error: string } | null {
  if (value == null) return null;
  if (!value || typeof value !== "object") return { error: "Invalid attachment." };
  const record = value as { filename?: unknown; content?: unknown; name?: unknown };
  const filename =
    typeof record.filename === "string"
      ? record.filename.trim()
      : typeof record.name === "string"
        ? record.name.trim()
        : "";
  if (!filename || filename.length > 200) {
    return { error: "Upload a named .txt, .md, .json, or .csv file." };
  }
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return { error: "Upload a named .txt, .md, .json, or .csv file." };
  }
  if (!isAllowedTextAttachment(filename)) {
    return { error: "Upload a .txt, .md, .json, or .csv file. PDF and Word files are not supported yet." };
  }
  if (typeof record.content !== "string") {
    return { error: "Attachment content must be plain text." };
  }
  const content = record.content.split("\0").join("");
  if (content.length > MAX_TRANSLATE_CHARS) {
    return { error: `Attachment is too large (max ${MAX_TRANSLATE_CHARS.toLocaleString()} characters).` };
  }
  return { filename, content };
}

export function resolveTranslateText(rawInput: string, attachment: TextAttachment | null): string {
  const pasted = rawInput.split("\0").join("").trim();
  if (pasted) return pasted;
  return attachment?.content.trim() ?? "";
}
