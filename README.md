# Amienigma AI

**Ask anything. Paint stills. Film short clips.**

**Live:** [amienigma-llm.vercel.app](https://amienigma-llm.vercel.app)  
*(Chat / stills / video need a server `XAI_API_KEY` — UI is up without it.)*

Amienigma AI is the creative intelligence of [The Original Enigma Studios](https://amienigma.art.blog/) — a personal studio for chat, stills, and short film. Rooted in Neglect Archive, Dark Romanticism, and cybercore night.

> Information is the mission.  
> Curiosity is the vehicle.  
> Exploration never ends.

Where the mission is every mission that is about information.

---

## What you can do

| Mode | What happens |
|------|----------------|
| **Chat** | Ask for plans, writing, explanations, or ideas. Replies stream in. Previous chats stay on this device. |
| **Image** | Describe a scene, choose a frame (1:1, 16:9, 9:16, 4:3, or 3:4), and generate a still. |
| **Video** | Describe a shot, choose 16:9, 9:16, or 1:1, and film a 6- or 10-second clip. |
| **Animate stills** | After an image is made, tap Animate to keep the first frame and add camera move and motion. |
| **Discover** | Browse prompt ideas and remix them as an image or a video. |
| **Talk** | Speak into the composer instead of typing. Read a reply aloud from the message actions. |

Light and dark themes switch from the header. Images and clips you create are kept in a personal reel in the browser.

In chat you write · what happens:

- A normal question → Amienigma answers  
- “Create an image of…” → a still is generated  
- “Make a video of…” → a clip is filmed  
- “Animate this” → the latest still becomes a video  

---

## Stack

React 19 · TanStack Start · Tailwind CSS · xAI (Grok) for chat, images, and video.

Orbit wordmark. Fraunces + Plus Jakarta Sans. Cream and dark.

---

## Prompts

Reusable system and role prompts live in [`prompts/`](./prompts/):

- `system-amienigma-ai.md` — default Amienigma AI voice
- `neglect-archive-explorer.md` — internet archaeology / rabbit holes
- `108-lock-creative-director.md` — 108 LOCK Law creative director

See [`prompts/README.md`](./prompts/README.md) for the index.

---

## Run it locally

You need **Node.js 22**.

```bash
npm install
export XAI_API_KEY=your_key
npm run dev
```

The key is read only on the server. It is never sent to the browser.

```bash
npm run build
npm run typecheck
```

---

## Signature look — 108 LOCK

Amienigma AI’s cream/dark studio sits beside **108 LOCK**, the night grade and symbol stamp of the house:

> *108 Night is teal weather with a magenta pulse, analog grain, and one true object from the day — nothing added to win the picture.*

Teal `#164e57` · Magenta `#c21e6b` · Courier · 0px radius · Texas symbols.

→ Visual IP: [108 LOCK](https://github.com/Amienigma/108-lock)

---

## Neglect Archive

Art survives where systems decay. This is not a portfolio. This is a corridor.

Dark Romanticism / Contemporary Gothic. Studio: The Original Enigma Studios / Amienigma Studios.

- Blog: [amienigma.art.blog](https://amienigma.art.blog/)  
- GitHub: [Amienigma](https://github.com/Amienigma)  
- Vision notebook (Archive Intelligence): [amienigma_ai](https://github.com/Amienigma/amienigma_ai)

---

*The Original Enigma Studios · Amienigma AI*
