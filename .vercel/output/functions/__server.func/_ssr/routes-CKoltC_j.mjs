import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Sun, c as Moon, d as Image, f as Copy, g as ArrowUp, h as AudioLines, i as Trash2, l as MessageCircle, m as Clapperboard, n as Volume2, o as Square, p as Compass, s as Plus, t as X, u as Menu } from "../_libs/lucide-react.mjs";
import { i as wantsAnimateLastImage, n as isImageIntent, r as isVideoIntent } from "./router-D06w2xAZ.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CKoltC_j.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function uid() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function titleFromPrompt(text) {
	const cleaned = text.replace(/\s+/g, " ").trim();
	if (!cleaned) return "New chat";
	return cleaned.length > 42 ? `${cleaned.slice(0, 42)}…` : cleaned;
}
var STORAGE_KEY = "amienigma-state-v1";
var LEGACY_KEY = "orbit-state-v1";
var LIBRARY_MAX = 24;
function load() {
	if (typeof window === "undefined") return {
		conversations: [],
		activeId: null,
		theme: "system",
		library: []
	};
	try {
		const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
		if (!raw) return {
			conversations: [],
			activeId: null,
			theme: "system",
			library: []
		};
		const parsed = JSON.parse(raw);
		return {
			conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
			activeId: parsed.activeId ?? null,
			theme: parsed.theme === "light" || parsed.theme === "dark" ? parsed.theme : "system",
			library: Array.isArray(parsed.library) ? parsed.library : []
		};
	} catch {
		return {
			conversations: [],
			activeId: null,
			theme: "system",
			library: []
		};
	}
}
var useOrbit = create((set, get) => ({
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
		set({
			...data,
			hydrated: true
		});
		applyTheme(data.theme);
	},
	persist: () => {
		const { conversations, activeId, theme, library } = get();
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({
				conversations,
				activeId,
				theme,
				library
			}));
		} catch {}
	},
	setView: (view) => set({
		view,
		sidebarOpen: false
	}),
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
		const conversation = {
			id,
			title: "New chat",
			messages: [],
			updatedAt: Date.now()
		};
		set((s) => ({
			conversations: [conversation, ...s.conversations],
			activeId: id,
			view: "home",
			sidebarOpen: false
		}));
		get().persist();
		return id;
	},
	setActive: (id) => {
		const conv = get().conversations.find((c) => c.id === id);
		set({
			activeId: id,
			view: conv && conv.messages.length > 0 ? "chat" : "home",
			sidebarOpen: false
		});
		get().persist();
	},
	appendMessage: (conversationId, message) => {
		set((s) => ({
			conversations: s.conversations.map((c) => {
				if (c.id !== conversationId) return c;
				const title = c.messages.length === 0 && message.role === "user" ? titleFromPrompt(message.content) : c.title;
				return {
					...c,
					title,
					messages: [...c.messages, message],
					updatedAt: Date.now()
				};
			}),
			view: "chat"
		}));
		get().persist();
	},
	patchMessage: (conversationId, messageId, patch) => {
		set((s) => ({ conversations: s.conversations.map((c) => c.id !== conversationId ? c : {
			...c,
			messages: c.messages.map((m) => m.id === messageId ? {
				...m,
				...patch
			} : m),
			updatedAt: Date.now()
		}) }));
		get().persist();
	},
	deleteConversation: (id) => {
		set((s) => {
			const conversations = s.conversations.filter((c) => c.id !== id);
			const activeId = s.activeId === id ? conversations[0]?.id ?? null : s.activeId;
			return {
				conversations,
				activeId,
				view: activeId ? s.view : "home"
			};
		});
		get().persist();
	},
	addMedia: (item) => {
		const next = {
			...item,
			id: uid(),
			createdAt: Date.now()
		};
		set((s) => ({ library: [next, ...s.library].slice(0, LIBRARY_MAX) }));
		get().persist();
	},
	lastImage: () => get().library.find((m) => m.kind === "image"),
	active: () => get().conversations.find((c) => c.id === get().activeId)
}));
function applyTheme(pref) {
	if (typeof document === "undefined") return;
	const dark = pref === "dark" || pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches;
	document.documentElement.classList.toggle("dark", dark);
	document.documentElement.classList.toggle("light", !dark);
}
function ensureConversation() {
	const state = useOrbit.getState();
	if (state.activeId) return state.activeId;
	return state.newChat();
}
function DesktopNav() {
	const view = useOrbit((s) => s.view);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "hidden items-center gap-1 md:flex",
		children: [
			{
				id: "home",
				label: "Chat",
				icon: MessageCircle
			},
			{
				id: "imagine",
				label: "Image",
				icon: Image
			},
			{
				id: "motion",
				label: "Video",
				icon: Clapperboard
			},
			{
				id: "discover",
				label: "Discover",
				icon: Compass
			}
		].map((item) => {
			const Icon = item.icon;
			const active = item.id === "home" ? view === "home" || view === "chat" : view === item.id;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: cn("flex h-10 items-center gap-2 rounded-pill px-3 text-sm font-medium", active ? "bg-bg-subtle text-fg" : "text-fg-muted hover:bg-bg-subtle hover:text-fg"),
				onClick: () => {
					if (item.id === "home") {
						const s = useOrbit.getState();
						const conv = s.conversations.find((c) => c.id === s.activeId);
						s.setView(conv && conv.messages.length > 0 ? "chat" : "home");
					} else useOrbit.getState().setView(item.id);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), item.label]
			}, item.id);
		})
	});
}
function inline(text) {
	const parts = [];
	const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
	let last = 0;
	let m;
	while (m = re.exec(text)) {
		if (m.index > last) parts.push({
			t: "text",
			v: text.slice(last, m.index)
		});
		const token = m[0];
		if (token.startsWith("`")) parts.push({
			t: "code",
			v: token.slice(1, -1)
		});
		else parts.push({
			t: "bold",
			v: token.slice(2, -2)
		});
		last = m.index + token.length;
	}
	if (last < text.length) parts.push({
		t: "text",
		v: text.slice(last)
	});
	return parts.map((p, i) => {
		if (p.t === "code") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
			className: "rounded-xs bg-bg-subtle px-1 py-0.5 font-mono text-sm",
			children: p.v
		}, i);
		if (p.t === "bold") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: p.v }, i);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.v }, i);
	});
}
function Markdown({ text, className }) {
	const blocks = text.split(/\n{2,}/);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("space-y-3 text-pretty leading-normal", className),
		children: blocks.map((block, i) => {
			const lines = block.split("\n");
			if (lines.every((l) => /^\s*[-*]\s+/.test(l))) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "list-disc space-y-1 pl-5",
				children: lines.map((l, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: inline(l.replace(/^\s*[-*]\s+/, "")) }, j))
			}, i);
			if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "list-decimal space-y-1 pl-5",
				children: lines.map((l, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: inline(l.replace(/^\s*\d+\.\s+/, "")) }, j))
			}, i);
			if (block.startsWith("```")) {
				const code = block.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "");
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "overflow-x-auto rounded-md bg-bg-subtle p-3 font-mono text-sm leading-snug",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: code })
				}, i);
			}
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "whitespace-pre-wrap",
				children: lines.map((line, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [j > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}) : null, inline(line)] }, j))
			}, i);
		})
	});
}
function OrbitRing({ className, size = "lg" }) {
	if (size === "sm") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("relative inline-flex size-7 items-center justify-center", className),
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block size-7 rounded-full",
			style: {
				background: "conic-gradient(from 200deg, var(--color-orbit-cyan), var(--color-orbit-blue) 32%, var(--color-orbit-violet) 58%, var(--color-orbit-pink) 78%, var(--color-orbit-cyan))",
				padding: 5
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "block size-full rounded-full bg-bg" })
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("orbit-ring", className),
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "orbit-ring-disk",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "orbit-ring-core" })
		})
	});
}
function ChatThread({ messages, streaming, onAnimate }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6",
		children: [messages.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
			className: "min-w-0",
			children: m.role === "user" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-lg font-semibold tracking-tight text-pretty",
				children: m.content
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					m.imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: m.imageUrl,
							alt: m.imagePrompt ?? "Generated image",
							className: "w-full max-w-lg rounded-lg object-cover shadow-soft"
						}), onAnimate && !streaming ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => onAnimate(m.imageUrl, m.imagePrompt ?? ""),
							className: "h-10 rounded-pill bg-fg px-4 text-sm font-medium text-bg transition-transform duration-150 active:scale-[0.96]",
							children: "Animate this still"
						}) : null]
					}) : null,
					m.videoUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						src: m.videoUrl,
						controls: true,
						playsInline: true,
						className: "w-full max-w-lg rounded-lg bg-fg/90 shadow-soft"
					}) : null,
					m.content ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markdown, {
						text: m.content,
						className: "text-sm md:text-base"
					}) : null,
					m.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-danger",
						children: m.error
					}) : null,
					m.content && !streaming && !m.videoUrl && !m.imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageActions, { text: m.content }) : null
				]
			})
		}, m.id)), streaming && messages.at(-1)?.role === "assistant" && !messages.at(-1)?.content ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "thinking-shimmer text-sm font-medium",
			children: "Thinking"
		}) : null]
	});
}
function MessageActions({ text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex gap-1 pt-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "flex size-9 items-center justify-center rounded-sm text-fg-subtle transition-colors hover:bg-bg-subtle hover:text-fg",
			"aria-label": "Copy",
			onClick: () => navigator.clipboard.writeText(text).catch(() => {}),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "flex size-9 items-center justify-center rounded-sm text-fg-subtle transition-colors hover:bg-bg-subtle hover:text-fg",
			"aria-label": "Speak",
			onClick: () => {
				window.speechSynthesis.cancel();
				const u = new SpeechSynthesisUtterance(text);
				window.speechSynthesis.speak(u);
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" })
		})]
	});
}
function ChatEmptyHint() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-1 flex-col items-center justify-center gap-3 text-fg-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitRing, { size: "sm" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm",
			children: "Ask Amienigma anything"
		})]
	});
}
function getSpeech() {
	if (typeof window === "undefined") return null;
	const w = window;
	return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
function Composer({ placeholder, disabled, onSend }) {
	const [value, setValue] = (0, import_react.useState)("");
	const [listening, setListening] = (0, import_react.useState)(false);
	const recRef = (0, import_react.useRef)(null);
	const areaRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = areaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
	}, [value]);
	(0, import_react.useEffect)(() => {
		return () => recRef.current?.stop();
	}, []);
	function submit(text) {
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
			for (let i = 0; i < ev.results.length; i++) text += ev.results[i][0]?.transcript ?? "";
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
		className: "mx-auto w-full max-w-2xl px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 md:pb-10",
		onSubmit: (e) => {
			e.preventDefault();
			submit();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("flex items-end gap-2 rounded-pill border border-border bg-bg-elevated py-1.5 pr-1.5 pl-4 shadow-soft", "focus-within:border-border-strong"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				ref: areaRef,
				rows: 1,
				value,
				disabled,
				placeholder: listening ? "Listening…" : placeholder,
				onChange: (e) => setValue(e.target.value),
				onKeyDown: (e) => {
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault();
						submit();
					}
				},
				className: "max-h-40 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-base text-fg outline-none placeholder:text-fg-subtle disabled:opacity-60",
				"aria-label": "Message"
			}), canSend ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "submit",
				className: "flex size-11 shrink-0 items-center justify-center rounded-pill bg-fg text-bg transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-40",
				"aria-label": "Send",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, {
					className: "size-5",
					strokeWidth: 2.2
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: toggleTalk,
				disabled,
				className: cn("flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-pill px-4 text-sm font-medium transition-transform duration-150 ease-out active:scale-[0.96]", listening ? "bg-danger text-danger-fg" : "bg-accent text-accent-fg"),
				"aria-label": listening ? "Stop listening" : "Talk",
				children: listening ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-3.5 fill-current" }), "Stop"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waveform, {}), "Talk"] })
			})]
		})
	});
}
function Waveform() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudioLines, {
		className: "size-4",
		strokeWidth: 2.2
	});
}
var DISCOVER = [
	{
		id: "friends",
		src: "/discover/friends.jpg",
		title: "Golden hour ride",
		prompt: "Stylized cinematic portrait of two stylish friends wearing sunglasses in a convertible at golden hour, fashion editorial photography, warm film grain",
		span: "square"
	},
	{
		id: "cyber-duo",
		src: "/discover/cyber-duo.jpg",
		title: "Cockpit duo",
		prompt: "Turn us into video-game characters in a futuristic cyberpunk cockpit, sleek visors and leather jackets, neon lights, high-end concept art",
		span: "square"
	},
	{
		id: "cabin",
		src: "/discover/cabin.jpg",
		title: "Cabin at dusk",
		prompt: "Cozy snow-covered mountain cabin at dusk with warm window glow, pine trees, footprints in snow, cinematic photography",
		span: "tall"
	},
	{
		id: "food-truck",
		src: "/discover/food-truck.jpg",
		title: "Rainy neon night",
		prompt: "Cinematic photograph of a neon-lit late-night food truck on a rainy city street, pink and teal lights reflecting in wet asphalt",
		span: "square"
	},
	{
		id: "pink-cow",
		src: "/discover/pink-cow.jpg",
		title: "Cow and saucer",
		prompt: "Playful pop-art illustration of a cheerful pink cow in a bright green meadow with a vintage flying saucer beaming yellow light from above",
		span: "square"
	},
	{
		id: "motorcycle",
		src: "/discover/motorcycle.jpg",
		title: "Desert highway",
		prompt: "Vintage motorcycle parked on an empty desert highway at sunset, long shadows, dust in golden light, cinematic film still",
		span: "wide"
	},
	{
		id: "underwater",
		src: "/discover/underwater.jpg",
		title: "Glass city",
		prompt: "Dreamlike underwater city of glass towers with sunlight shafts, tropical fish and coral gardens, cinematic and ultra detailed",
		span: "wide"
	},
	{
		id: "tea-house",
		src: "/discover/tea-house.jpg",
		title: "Afternoon tea",
		prompt: "A serene Japanese tea house interior with paper lanterns, steam from a ceramic teapot, golden afternoon light through shoji screens",
		span: "tall"
	},
	{
		id: "river",
		src: "/discover/river.jpg",
		title: "Autumn river",
		prompt: "Aerial photograph of a winding turquoise river through autumn forest, golden and rust foliage, cinematic landscape",
		span: "wide"
	},
	{
		id: "glass-rings",
		src: "/discover/glass-rings.jpg",
		title: "Enigma in glass",
		prompt: "A luminescent glass sculpture of interlocking rings, cyan blue and violet light refracting through crystal on a dark studio pedestal",
		span: "square"
	},
	{
		id: "sunglasses",
		src: "/discover/sunglasses.jpg",
		title: "Studio shades",
		prompt: "Product still life of elegant black sunglasses floating on a soft white studio background with a subtle cyan and violet rim light",
		span: "square"
	},
	{
		id: "bubbles",
		src: "/discover/bubbles.jpg",
		title: "Soap galaxies",
		prompt: "Macro photograph of iridescent soap bubbles clustered on a dark surface, rainbow highlights, ultra sharp studio lighting",
		span: "square"
	}
];
var STARTERS = [
	{
		id: "meet",
		label: "Let's get to know each other"
	},
	{
		id: "plan",
		label: "Plan a weekend in McKinney"
	},
	{
		id: "image",
		label: "Create an image of a rainy neon street"
	},
	{
		id: "video",
		label: "Film a short clip of mist over a lake"
	}
];
function DiscoverFeed({ onRemix, onVideo }) {
	const [open, setOpen] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-6xl px-4 py-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mb-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl font-medium tracking-tight",
				children: "Discover"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-fg-muted",
				children: "Prompts to remix as stills or clips."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "columns-1 gap-3 sm:columns-2 lg:columns-3",
			children: DISCOVER.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setOpen(item),
				className: "mb-3 block w-full break-inside-avoid overflow-hidden rounded-lg bg-bg-subtle text-left shadow-soft transition-transform duration-200 ease-out hover:-translate-y-0.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: item.src,
					alt: item.title,
					className: cn("w-full object-cover", item.span === "tall" && "aspect-[3/4]", item.span === "wide" && "aspect-[16/9]", item.span === "square" && "aspect-square")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block px-3 py-2.5 text-sm font-medium",
					children: item.title
				})]
			}, item.id))
		})]
	}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-fg/40 p-0 sm:items-center sm:p-6",
		onClick: () => setOpen(null),
		role: "presentation",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative max-h-dvh w-full max-w-lg overflow-auto rounded-t-xl bg-bg-elevated shadow-lift sm:rounded-xl",
			onClick: (e) => e.stopPropagation(),
			role: "dialog",
			"aria-label": open.title,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-pill bg-bg/80 text-fg",
					onClick: () => setOpen(null),
					"aria-label": "Close",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: open.src,
					alt: open.title,
					className: "w-full object-cover"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3 p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-lg font-medium tracking-tight",
							children: open.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm leading-normal text-fg-muted text-pretty",
							children: open.prompt
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 sm:flex-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-11 flex-1 rounded-pill bg-fg text-sm font-medium text-bg transition-transform duration-150 active:scale-[0.96]",
								onClick: () => {
									onRemix(open.prompt);
									setOpen(null);
								},
								children: "Remix as image"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-11 flex-1 rounded-pill border border-border bg-bg-elevated text-sm font-medium text-fg transition-transform duration-150 active:scale-[0.96]",
								onClick: () => {
									onVideo(open.prompt);
									setOpen(null);
								},
								children: "Make a video"
							})]
						})
					]
				})
			]
		})
	}) : null] });
}
var FLOATS = [
	{
		item: DISCOVER[0],
		className: "left-[4%] top-[18%] hidden w-40 lg:block xl:w-48"
	},
	{
		item: DISCOVER[3],
		className: "right-[6%] top-[10%] hidden w-36 md:block xl:w-44"
	},
	{
		item: DISCOVER[4],
		className: "right-[8%] bottom-[28%] hidden w-32 lg:block"
	},
	{
		item: DISCOVER[1],
		className: "left-[8%] bottom-[22%] hidden w-36 md:block xl:left-[12%]"
	}
];
function HomeHero({ onPrompt, onVideo }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4",
		children: [FLOATS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => onPrompt(f.item.prompt),
			className: cn("absolute z-0 overflow-hidden rounded-lg shadow-lift transition-transform duration-200 ease-out hover:-translate-y-1", f.className),
			"aria-label": f.item.title,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: f.item.src,
				alt: "",
				className: "aspect-square w-full object-cover"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "absolute inset-x-2 bottom-2 rounded-pill bg-bg/90 px-2.5 py-1 text-left text-xs font-medium text-fg",
				children: f.item.title
			})]
		}, f.item.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "stagger-in relative z-10 flex w-full max-w-lg flex-col items-center text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitRing, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 text-xs font-semibold tracking-widest text-fg-muted uppercase",
					children: "Amienigma AI"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl",
					children: "Where should we start?"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-sm text-sm text-fg-muted text-pretty",
					children: "Ask anything. Paint stills. Film short clips."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 flex w-full max-w-md flex-col gap-2",
					children: STARTERS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => s.id === "video" ? onVideo(s.label) : onPrompt(s.label),
						className: "rounded-md border border-border bg-bg-elevated px-4 py-3 text-left text-sm font-medium text-fg transition-colors duration-150 hover:bg-bg-subtle",
						children: s.label
					}, s.id))
				})
			]
		})]
	});
}
var RATIOS$1 = [
	{
		id: "1:1",
		label: "1:1"
	},
	{
		id: "16:9",
		label: "16:9"
	},
	{
		id: "9:16",
		label: "9:16"
	},
	{
		id: "4:3",
		label: "4:3"
	},
	{
		id: "3:4",
		label: "3:4"
	}
];
var PRESETS$1 = [
	"A quiet coastal town at blue hour, cinematic",
	"Product photo of a ceramic mug on linen",
	"Editorial portrait in a sunlit greenhouse",
	"Isometric tiny library in a tree hollow"
];
function ImagineStudio({ draft, onDraft, busy, error, images, onGenerate, onAnimate }) {
	const [ratio, setRatio] = (0, import_react.useState)("1:1");
	const stills = images.filter((m) => m.kind === "image");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-3xl flex-col px-4 py-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-medium tracking-tight",
					children: "Imagine"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-fg-muted",
					children: "Describe a scene. Amienigma will paint it."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg border border-border bg-bg-elevated p-3 shadow-soft",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: draft,
					onChange: (e) => onDraft(e.target.value),
					rows: 4,
					placeholder: "A glass cipher on a dark pedestal…",
					className: "w-full resize-none bg-transparent text-base outline-none placeholder:text-fg-subtle"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1",
						children: RATIOS$1.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setRatio(r.id),
							className: cn("h-8 rounded-pill px-3 text-xs font-medium", ratio === r.id ? "bg-fg text-bg" : "bg-bg-subtle text-fg-muted"),
							children: r.label
						}, r.id))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: busy || draft.trim().length < 3,
						onClick: () => onGenerate(draft.trim(), ratio),
						className: "h-10 rounded-pill bg-accent px-4 text-sm font-medium text-accent-fg transition-transform duration-150 active:scale-[0.96] disabled:opacity-40",
						children: busy ? "Creating…" : "Generate"
					})]
				})]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-danger",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 flex flex-wrap gap-2",
				children: PRESETS$1.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onDraft(p),
					className: "rounded-pill border border-border px-3 py-1.5 text-xs text-fg-muted hover:bg-bg-subtle",
					children: p
				}, p))
			}),
			stills.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 grid grid-cols-2 gap-3",
				children: stills.map((img) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
					className: "overflow-hidden rounded-md bg-bg-subtle",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: img.url,
						alt: img.prompt,
						className: "aspect-square w-full object-cover"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
						className: "space-y-2 px-2 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "line-clamp-2 text-xs text-fg-muted",
							children: img.prompt
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => onAnimate(img.url, img.prompt),
							className: "h-9 w-full rounded-pill bg-fg text-xs font-medium text-bg transition-transform duration-150 active:scale-[0.96]",
							children: "Animate"
						})]
					})]
				}, img.id))
			}) : null
		]
	});
}
var RATIOS = [
	{
		id: "16:9",
		label: "16:9"
	},
	{
		id: "9:16",
		label: "9:16"
	},
	{
		id: "1:1",
		label: "1:1"
	}
];
var DURATIONS = [{
	id: 6,
	label: "6s"
}, {
	id: 10,
	label: "10s"
}];
var PRESETS = [
	"Slow cinematic push-in on a quiet coastal town at blue hour",
	"Steam rises from a ceramic mug; camera orbits the table",
	"Rain on a neon street, reflections blooming in the asphalt",
	"A glass sculpture turning under studio light, dust in the beam"
];
function MotionStudio({ draft, onDraft, stillUrl, onClearStill, busy, progress, error, clips, onGenerate, onAnimateStill }) {
	const [ratio, setRatio] = (0, import_react.useState)("16:9");
	const [duration, setDuration] = (0, import_react.useState)(6);
	const videos = clips.filter((c) => c.kind === "video");
	const stills = clips.filter((c) => c.kind === "image").slice(0, 6);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-3xl flex-col px-4 py-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-medium tracking-tight",
					children: "Video"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-fg-muted text-pretty",
					children: "Describe a shot. Amienigma will film it — or animate a still you already made."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg border border-border bg-bg-elevated p-3 shadow-soft",
				children: [
					stillUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center gap-3 rounded-md bg-bg-subtle p-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: stillUrl,
								alt: "",
								className: "size-16 rounded-sm object-cover"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-medium",
									children: "Animating this still"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-fg-muted",
									children: "The first frame stays; motion is added."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "flex size-10 items-center justify-center rounded-sm text-fg-muted hover:text-fg",
								"aria-label": "Remove still",
								onClick: onClearStill,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
							})
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: draft,
						onChange: (e) => onDraft(e.target.value),
						rows: 4,
						placeholder: stillUrl ? "Slow push-in, wind in the trees, natural light shift…" : "A glass cipher turning under a single studio light…",
						className: "w-full resize-none bg-transparent text-base outline-none placeholder:text-fg-subtle"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-wrap items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-1",
							children: [RATIOS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setRatio(r.id),
								className: cn("h-8 rounded-pill px-3 text-xs font-medium", ratio === r.id ? "bg-fg text-bg" : "bg-bg-subtle text-fg-muted"),
								children: r.label
							}, r.id)), DURATIONS.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setDuration(d.id),
								className: cn("h-8 rounded-pill px-3 text-xs font-medium", duration === d.id ? "bg-fg text-bg" : "bg-bg-subtle text-fg-muted"),
								children: d.label
							}, d.id))]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: busy || draft.trim().length < 3,
							onClick: () => onGenerate(draft.trim(), ratio, duration),
							className: "h-10 rounded-pill bg-accent px-4 text-sm font-medium text-accent-fg transition-transform duration-150 active:scale-[0.96] disabled:opacity-40",
							children: busy ? "Filming…" : stillUrl ? "Animate" : "Generate"
						})]
					})
				]
			}),
			busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-1 overflow-hidden rounded-pill bg-bg-subtle",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full bg-accent transition-[width] duration-500 ease-out",
						style: { width: `${Math.max(6, progress)}%` }
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm tabular-nums text-fg-muted",
					children: [
						"Composing the clip… ",
						Math.max(0, progress),
						"%"
					]
				})]
			}) : null,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-danger",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 flex flex-wrap gap-2",
				children: PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onDraft(p),
					className: "rounded-pill border border-border px-3 py-1.5 text-xs text-fg-muted hover:bg-bg-subtle",
					children: p
				}, p))
			}),
			!stillUrl && stills.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-3 text-sm font-medium text-fg-muted",
					children: "Animate a still"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-3 gap-2 sm:grid-cols-6",
					children: stills.map((img) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onAnimateStill?.(img.url, img.prompt),
						className: "overflow-hidden rounded-md bg-bg-subtle",
						"aria-label": `Animate: ${img.prompt}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: img.url,
							alt: "",
							className: "aspect-square w-full object-cover"
						})
					}, img.id))
				})]
			}) : null,
			videos.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium text-fg-muted",
					children: "Your clips"
				}), videos.map((clip) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
					className: "overflow-hidden rounded-md bg-bg-subtle",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						src: clip.url,
						controls: true,
						playsInline: true,
						className: "aspect-video w-full bg-fg/90 object-contain"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
						className: "line-clamp-2 px-3 py-2 text-xs text-fg-muted",
						children: clip.prompt
					})]
				}, clip.id))]
			}) : !busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-10 flex flex-col items-center gap-2 text-center text-fg-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clapperboard, { className: "size-6" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm",
					children: "No clips yet. Describe a shot to film one."
				})]
			}) : null
		]
	});
}
async function startVideo(input, signal) {
	const res = await fetch("/api/video", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
		signal
	});
	const json = await res.json().catch(() => ({}));
	if (!res.ok || !json.requestId) throw new Error(json.error ?? "Could not start that video.");
	return { requestId: json.requestId };
}
async function waitForVideo(requestId, opts = {}) {
	const started = Date.now();
	while (Date.now() - started < 18e4) {
		if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");
		const res = await fetch(`/api/video?id=${encodeURIComponent(requestId)}`, { signal: opts.signal });
		const json = await res.json().catch(() => ({}));
		if (typeof json.progress === "number") {
			const n = json.progress <= 1 ? Math.round(json.progress * 100) : Math.round(json.progress);
			opts.onProgress?.(Math.min(99, Math.max(0, n)));
		}
		if (json.url) {
			opts.onProgress?.(100);
			return json.url;
		}
		if (!res.ok || json.status === "failed" || json.status === "expired") throw new Error(json.error ?? "Could not create that video.");
		await sleep(3500, opts.signal);
	}
	throw new Error("That clip is taking too long. Try a shorter prompt.");
}
function sleep(ms, signal) {
	return new Promise((resolve, reject) => {
		const t = setTimeout(resolve, ms);
		signal?.addEventListener("abort", () => {
			clearTimeout(t);
			reject(new DOMException("Aborted", "AbortError"));
		}, { once: true });
	});
}
function AppShell() {
	const view = useOrbit((s) => s.view);
	const conversations = useOrbit((s) => s.conversations);
	const activeId = useOrbit((s) => s.activeId);
	const theme = useOrbit((s) => s.theme);
	const sidebarOpen = useOrbit((s) => s.sidebarOpen);
	const imagineDraft = useOrbit((s) => s.imagineDraft);
	const motionDraft = useOrbit((s) => s.motionDraft);
	const motionImageUrl = useOrbit((s) => s.motionImageUrl);
	const library = useOrbit((s) => s.library);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [imagineBusy, setImagineBusy] = (0, import_react.useState)(false);
	const [imagineError, setImagineError] = (0, import_react.useState)(null);
	const [videoBusy, setVideoBusy] = (0, import_react.useState)(false);
	const [videoError, setVideoError] = (0, import_react.useState)(null);
	const [videoProgress, setVideoProgress] = (0, import_react.useState)(0);
	const abortRef = (0, import_react.useRef)(null);
	const active = (0, import_react.useMemo)(() => conversations.find((c) => c.id === activeId), [conversations, activeId]);
	(0, import_react.useEffect)(() => {
		useOrbit.getState().hydrate();
	}, []);
	(0, import_react.useEffect)(() => {
		applyTheme(theme);
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => {
			if (useOrbit.getState().theme === "system") applyTheme("system");
		};
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, [theme]);
	(0, import_react.useEffect)(() => {
		return () => abortRef.current?.abort();
	}, []);
	function openAnimate(url, prompt) {
		useOrbit.getState().setMotionImage(url);
		useOrbit.getState().setMotionDraft(prompt ? `Slow cinematic camera move through: ${prompt}` : "Slow cinematic camera move, natural motion, subtle light shift");
		useOrbit.getState().setView("motion");
	}
	async function send(text, forceImagine = false, ratio = "1:1") {
		const trimmed = text.trim();
		if (!trimmed || busy) return;
		const convId = ensureConversation();
		const user = {
			id: uid(),
			role: "user",
			content: trimmed,
			createdAt: Date.now()
		};
		useOrbit.getState().appendMessage(convId, user);
		useOrbit.getState().setView("chat");
		const assistantId = uid();
		useOrbit.getState().appendMessage(convId, {
			id: assistantId,
			role: "assistant",
			content: "",
			createdAt: Date.now()
		});
		abortRef.current?.abort();
		const ac = new AbortController();
		abortRef.current = ac;
		setBusy(true);
		try {
			if (forceImagine || isImageIntent(trimmed)) await runImagine(convId, assistantId, trimmed, ratio, ac.signal);
			else if (isVideoIntent(trimmed)) await runVideo(convId, assistantId, trimmed, "16:9", 6, (wantsAnimateLastImage(trimmed) ? useOrbit.getState().lastImage() : void 0)?.url, ac.signal);
			else await runChat(convId, assistantId, ac.signal);
		} catch (err) {
			if (err.name === "AbortError") return;
			useOrbit.getState().patchMessage(convId, assistantId, { error: err instanceof Error ? err.message : "Something went wrong." });
		} finally {
			setBusy(false);
		}
	}
	async function runChat(convId, assistantId, signal) {
		const history = (useOrbit.getState().conversations.find((c) => c.id === convId)?.messages ?? []).filter((m) => m.id !== assistantId && (m.content || m.imageUrl || m.videoUrl)).map((m) => ({
			role: m.role,
			content: m.videoUrl ? `${m.content}\n[video: ${m.videoPrompt ?? "generated"}]` : m.imageUrl ? `${m.content}\n[image: ${m.imagePrompt ?? "generated"}]` : m.content
		}));
		const res = await fetch("/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ messages: history }),
			signal
		});
		if (!res.ok) {
			let msg = "Could not reach Amienigma.";
			try {
				const j = await res.json();
				if (j.error) msg = j.error;
			} catch {}
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
		if (!acc.trim()) useOrbit.getState().patchMessage(convId, assistantId, { error: "Amienigma returned an empty reply. Try again." });
	}
	async function runImagine(convId, assistantId, prompt, ratio, signal) {
		useOrbit.getState().patchMessage(convId, assistantId, { content: "Creating an image…" });
		const res = await fetch("/api/imagine", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				prompt,
				ratio
			}),
			signal
		});
		const json = await res.json().catch(() => ({}));
		if (!res.ok || !json.url) {
			useOrbit.getState().patchMessage(convId, assistantId, {
				content: "",
				error: json.error ?? "Could not create that image."
			});
			return;
		}
		useOrbit.getState().addMedia({
			kind: "image",
			url: json.url,
			prompt,
			ratio
		});
		useOrbit.getState().patchMessage(convId, assistantId, {
			content: "Here you go. Tap Animate if you want this still to move.",
			imageUrl: json.url,
			imagePrompt: prompt
		});
	}
	async function runVideo(convId, assistantId, prompt, ratio, duration, imageUrl, signal) {
		useOrbit.getState().patchMessage(convId, assistantId, { content: imageUrl ? "Animating that still…" : "Filming a clip…" });
		const { requestId } = await startVideo({
			prompt,
			duration,
			ratio,
			imageUrl
		}, signal);
		const url = await waitForVideo(requestId, {
			signal,
			onProgress: (n) => {
				useOrbit.getState().patchMessage(convId, assistantId, { content: `${imageUrl ? "Animating" : "Filming"}… ${n}%` });
			}
		});
		useOrbit.getState().addMedia({
			kind: "video",
			url,
			prompt,
			ratio,
			duration,
			sourceImageUrl: imageUrl
		});
		useOrbit.getState().patchMessage(convId, assistantId, {
			content: "Here is your clip.",
			videoUrl: url,
			videoPrompt: prompt
		});
	}
	async function generateFromStudio(prompt, ratio) {
		if (imagineBusy) return;
		setImagineError(null);
		setImagineBusy(true);
		try {
			const res = await fetch("/api/imagine", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt,
					ratio
				})
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok || !json.url) {
				setImagineError(json.error ?? "Could not create that image.");
				return;
			}
			useOrbit.getState().addMedia({
				kind: "image",
				url: json.url,
				prompt,
				ratio
			});
		} catch {
			setImagineError("Could not create that image.");
		} finally {
			setImagineBusy(false);
		}
	}
	async function generateVideo(prompt, ratio, duration) {
		if (videoBusy) return;
		setVideoError(null);
		setVideoBusy(true);
		setVideoProgress(4);
		abortRef.current?.abort();
		const ac = new AbortController();
		abortRef.current = ac;
		try {
			const imageUrl = useOrbit.getState().motionImageUrl ?? void 0;
			const { requestId } = await startVideo({
				prompt,
				duration,
				ratio,
				imageUrl
			}, ac.signal);
			const url = await waitForVideo(requestId, {
				signal: ac.signal,
				onProgress: setVideoProgress
			});
			useOrbit.getState().addMedia({
				kind: "video",
				url,
				prompt,
				ratio,
				duration,
				sourceImageUrl: imageUrl
			});
		} catch (err) {
			if (err.name === "AbortError") return;
			setVideoError(err instanceof Error ? err.message : "Could not create that video.");
		} finally {
			setVideoBusy(false);
		}
	}
	const messages = active?.messages ?? [];
	const showHome = view === "home" || view === "chat" && messages.length === 0;
	const composerPlaceholder = "Ask Amienigma…";
	const hideComposer = view === "discover" || view === "imagine" || view === "motion";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh flex-col overflow-x-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sidebar, {}),
			sidebarOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "fixed inset-0 z-30 bg-fg/20 md:hidden",
				"aria-label": "Close menu",
				onClick: () => useOrbit.getState().setSidebarOpen(false)
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex min-h-0 flex-1 flex-col overflow-y-auto pb-2 md:pb-0",
				children: view === "discover" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiscoverFeed, {
					onRemix: (prompt) => {
						useOrbit.getState().setImagineDraft(prompt);
						useOrbit.getState().setView("imagine");
					},
					onVideo: (prompt) => {
						useOrbit.getState().setMotionImage(null);
						useOrbit.getState().setMotionDraft(prompt);
						useOrbit.getState().setView("motion");
					}
				}) : view === "imagine" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagineStudio, {
					draft: imagineDraft,
					onDraft: (v) => useOrbit.getState().setImagineDraft(v),
					busy: imagineBusy,
					error: imagineError,
					images: library,
					onGenerate: generateFromStudio,
					onAnimate: openAnimate
				}) : view === "motion" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MotionStudio, {
					draft: motionDraft,
					onDraft: (v) => useOrbit.getState().setMotionDraft(v),
					stillUrl: motionImageUrl,
					onClearStill: () => useOrbit.getState().setMotionImage(null),
					busy: videoBusy,
					progress: videoProgress,
					error: videoError,
					clips: library,
					onGenerate: (p, r, d) => void generateVideo(p, r, d),
					onAnimateStill: openAnimate
				}) : showHome ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeHero, {
					onPrompt: (t) => void send(t),
					onVideo: (prompt) => {
						useOrbit.getState().setMotionDraft(prompt);
						useOrbit.getState().setMotionImage(null);
						useOrbit.getState().setView("motion");
					}
				}) : messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatEmptyHint, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatThread, {
					messages,
					streaming: busy,
					onAnimate: openAnimate
				})
			}),
			!hideComposer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Composer, {
				placeholder: composerPlaceholder,
				disabled: busy,
				onSend: (t) => void send(t)
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
function Wordmark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitRing, { size: "sm" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-baseline gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-display text-base font-medium tracking-tight",
				children: "Amienigma"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-semibold tracking-widest text-fg-muted",
				children: "AI"
			})]
		})]
	});
}
function Header() {
	const theme = useOrbit((s) => s.theme);
	const dark = theme === "dark" || theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "flex h-14 shrink-0 items-center justify-between px-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "flex size-11 items-center justify-center rounded-sm text-fg",
				"aria-label": "Open chats",
				onClick: () => useOrbit.getState().setSidebarOpen(true),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "md:hidden",
				onClick: () => useOrbit.getState().newChat(),
				"aria-label": "New chat",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "hidden items-center gap-4 md:flex",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DesktopNav, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "flex size-11 items-center justify-center rounded-sm text-fg",
					"aria-label": "Toggle theme",
					onClick: () => useOrbit.getState().setTheme(dark ? "light" : "dark"),
					children: dark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "flex size-11 items-center justify-center rounded-sm text-fg",
					"aria-label": "New chat",
					onClick: () => useOrbit.getState().newChat(),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" })
				})]
			})
		]
	});
}
function Sidebar() {
	const open = useOrbit((s) => s.sidebarOpen);
	const conversations = useOrbit((s) => s.conversations);
	const activeId = useOrbit((s) => s.activeId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: cn("fixed inset-y-0 left-0 z-40 flex w-80 max-w-full flex-col border-r border-border bg-bg-elevated shadow-lift transition-transform duration-200 ease-out", open ? "translate-x-0" : "invisible pointer-events-none -translate-x-full"),
		"aria-hidden": !open,
		...!open ? { inert: true } : {},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-14 items-center justify-between px-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm font-semibold",
					children: "Chats"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "flex size-10 items-center justify-center rounded-sm",
					"aria-label": "Close",
					onClick: () => useOrbit.getState().setSidebarOpen(false),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mx-3 mb-3 h-11 rounded-md bg-fg text-sm font-medium text-bg",
				onClick: () => useOrbit.getState().newChat(),
				children: "New chat"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "min-h-0 flex-1 overflow-y-auto px-2 pb-4",
				children: conversations.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-3 py-6 text-sm text-fg-muted",
					children: "No chats yet."
				}) : conversations.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cn("group mb-0.5 flex items-center rounded-sm", c.id === activeId ? "bg-bg-subtle" : "hover:bg-bg-subtle"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm",
						onClick: () => useOrbit.getState().setActive(c.id),
						children: c.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "flex size-10 shrink-0 items-center justify-center text-fg-subtle opacity-70 hover:text-danger md:opacity-0 md:group-hover:opacity-100",
						"aria-label": "Delete chat",
						onClick: () => useOrbit.getState().deleteConversation(c.id),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
					})]
				}, c.id))
			})
		]
	});
}
function BottomNav() {
	const view = useOrbit((s) => s.view);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "flex shrink-0 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)] md:hidden",
		children: [
			{
				id: "home",
				label: "Chat",
				icon: MessageCircle
			},
			{
				id: "imagine",
				label: "Image",
				icon: Image
			},
			{
				id: "motion",
				label: "Video",
				icon: Clapperboard
			},
			{
				id: "discover",
				label: "Discover",
				icon: Compass
			}
		].map((item) => {
			const Icon = item.icon;
			const active = item.id === "home" ? view === "home" || view === "chat" : view === item.id;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: cn("flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium", active ? "text-fg" : "text-fg-subtle"),
				onClick: () => {
					if (item.id === "home") {
						const s = useOrbit.getState();
						const conv = s.conversations.find((c) => c.id === s.activeId);
						s.setView(conv && conv.messages.length > 0 ? "chat" : "home");
					} else useOrbit.getState().setView(item.id);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }), item.label]
			}, item.id);
		})
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {});
}
//#endregion
export { Home as component };
