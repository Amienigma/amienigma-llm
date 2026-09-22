const IMAGE_VERBS = /\b(imagine|generate|create|draw|make|render|visualize|paint|design)\b/i;
const IMAGE_NOUNS = /\b(image|picture|photo|illustration|art|portrait|scene|logo|poster|wallpaper|icon)\b/i;
const IMAGE_OF = /\b(image|picture|photo|illustration|art) of\b/i;
const IMAGINE_CMD = /^(imagine|\/imagine)\b/i;

const VIDEO_VERBS = /\b(imagine|generate|create|make|render|film|shoot|animate|direct)\b/i;
const VIDEO_NOUNS = /\b(video|clip|film|movie|animation|cinematic)\b/i;
const VIDEO_OF = /\b(video|clip|film|movie|animation) of\b/i;
const VIDEO_CMD = /^(video|\/video|animate|\/animate)\b/i;
const ANIMATE_THIS =
  /\b(animate (this|it|that)|turn (this|it|that) into (a )?(video|clip|movie)|make (this|it|that) (move|a video))\b/i;

export function isImageIntent(text: string) {
  const t = text.trim();
  if (!t) return false;
  if (isVideoIntent(t)) return false;
  if (IMAGINE_CMD.test(t)) return true;
  if (IMAGE_OF.test(t)) return true;
  return IMAGE_VERBS.test(t) && IMAGE_NOUNS.test(t);
}

export function isVideoIntent(text: string) {
  const t = text.trim();
  if (!t) return false;
  if (VIDEO_CMD.test(t)) return true;
  if (ANIMATE_THIS.test(t)) return true;
  if (VIDEO_OF.test(t)) return true;
  return VIDEO_VERBS.test(t) && VIDEO_NOUNS.test(t);
}

export function wantsAnimateLastImage(text: string) {
  return ANIMATE_THIS.test(text.trim());
}

export function ratioHint(ratio: string) {
  switch (ratio) {
    case "16:9":
      return "Compose as a wide cinematic 16:9 frame.";
    case "9:16":
      return "Compose as a tall vertical 9:16 frame.";
    case "4:3":
      return "Compose as a classic 4:3 landscape frame.";
    case "3:4":
      return "Compose as a vertical 3:4 portrait frame.";
    default:
      return "Compose as a square 1:1 frame.";
  }
}
