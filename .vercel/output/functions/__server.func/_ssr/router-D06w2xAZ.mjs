import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, _ as useRouter, f as createRouter, g as createRootRoute, h as createFileRoute, l as Scripts, m as lazyRouteComponent, p as Outlet, u as HeadContent, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-D06w2xAZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-F_bZfET4.css";
var APP_NAME = "Amienigma AI";
var Route$4 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Amienigma AI — ask anything, create images, and generate short videos."
			},
			{
				name: "theme-color",
				content: "#FAF9F7"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "light antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "font-sans bg-bg text-fg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	})
});
var $$splitComponentImporter = () => import("./routes-CKoltC_j.mjs");
var Route$3 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var SYSTEM = `You are Amienigma AI, a warm, capable personal AI assistant.
Be concise, specific, and useful. Prefer plain language. Use short paragraphs and lists when they help.
You can help with writing, planning, explaining, coding, and creative ideas.
You can also create still images and short videos when the user asks — image and video generation are handled separately by the app. If they want a clip, acknowledge it briefly.
Do not claim to be Meta AI or Orbit. You are Amienigma AI.
Current date: ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.`;
var Route$2 = createFileRoute("/api/chat")({ server: { handlers: { POST: async ({ request }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return Response.json({ error: "AI is not available right now." }, { status: 503 });
	let body;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid request." }, { status: 400 });
	}
	const incoming = (body.messages ?? []).slice(-20).filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string");
	if (incoming.length === 0) return Response.json({ error: "Say something first." }, { status: 400 });
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			stream: true,
			max_tokens: 1800,
			temperature: .7,
			messages: [{
				role: "system",
				content: SYSTEM
			}, ...incoming]
		}),
		signal: request.signal
	});
	if (!res.ok || !res.body) {
		const errText = await res.text().catch(() => "");
		const msg = res.status === 429 ? "Amienigma is busy. Try again in a moment." : errText.slice(0, 200) || `Could not reach Amienigma (${res.status}).`;
		return Response.json({ error: msg }, { status: 502 });
	}
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();
	const stream = new ReadableStream({ async start(controller) {
		const reader = res.body.getReader();
		let buffer = "";
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() ?? "";
				for (const line of lines) {
					const trimmed = line.trim();
					if (!trimmed.startsWith("data:")) continue;
					const data = trimmed.slice(5).trim();
					if (data === "[DONE]") continue;
					try {
						const token = JSON.parse(data).choices?.[0]?.delta?.content;
						if (token) controller.enqueue(encoder.encode(token));
					} catch {}
				}
			}
		} catch (err) {
			if (err.name !== "AbortError") {
				controller.error(err);
				return;
			}
		} finally {
			controller.close();
		}
	} });
	return new Response(stream, { headers: {
		"Content-Type": "text/plain; charset=utf-8",
		"Cache-Control": "no-cache"
	} });
} } } });
var IMAGE_VERBS = /\b(imagine|generate|create|draw|make|render|visualize|paint|design)\b/i;
var IMAGE_NOUNS = /\b(image|picture|photo|illustration|art|portrait|scene|logo|poster|wallpaper|icon)\b/i;
var IMAGE_OF = /\b(image|picture|photo|illustration|art) of\b/i;
var IMAGINE_CMD = /^(imagine|\/imagine)\b/i;
var VIDEO_VERBS = /\b(imagine|generate|create|make|render|film|shoot|animate|direct)\b/i;
var VIDEO_NOUNS = /\b(video|clip|film|movie|animation|cinematic)\b/i;
var VIDEO_OF = /\b(video|clip|film|movie|animation) of\b/i;
var VIDEO_CMD = /^(video|\/video|animate|\/animate)\b/i;
var ANIMATE_THIS = /\b(animate (this|it|that)|turn (this|it|that) into (a )?(video|clip|movie)|make (this|it|that) (move|a video))\b/i;
function isImageIntent(text) {
	const t = text.trim();
	if (!t) return false;
	if (isVideoIntent(t)) return false;
	if (IMAGINE_CMD.test(t)) return true;
	if (IMAGE_OF.test(t)) return true;
	return IMAGE_VERBS.test(t) && IMAGE_NOUNS.test(t);
}
function isVideoIntent(text) {
	const t = text.trim();
	if (!t) return false;
	if (VIDEO_CMD.test(t)) return true;
	if (ANIMATE_THIS.test(t)) return true;
	if (VIDEO_OF.test(t)) return true;
	return VIDEO_VERBS.test(t) && VIDEO_NOUNS.test(t);
}
function wantsAnimateLastImage(text) {
	return ANIMATE_THIS.test(text.trim());
}
function ratioHint(ratio) {
	switch (ratio) {
		case "16:9": return "Compose as a wide cinematic 16:9 frame.";
		case "9:16": return "Compose as a tall vertical 9:16 frame.";
		case "4:3": return "Compose as a classic 4:3 landscape frame.";
		case "3:4": return "Compose as a vertical 3:4 portrait frame.";
		default: return "Compose as a square 1:1 frame.";
	}
}
var Route$1 = createFileRoute("/api/imagine")({ server: { handlers: { POST: async ({ request }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return Response.json({ error: "Image generation is not available." }, { status: 503 });
	let body;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid request." }, { status: 400 });
	}
	const prompt = (body.prompt ?? "").trim().slice(0, 1500);
	if (prompt.length < 3) return Response.json({ error: "Describe the image you want." }, { status: 400 });
	const fullPrompt = `${prompt}. ${ratioHint(body.ratio ?? "1:1")} No watermarks, no text overlays.`;
	const res = await fetch("https://api.x.ai/v1/images/generations", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-imagine-image",
			prompt: fullPrompt,
			n: 1,
			resolution: "1k",
			response_format: "url"
		}),
		signal: request.signal
	});
	if (!res.ok) {
		const errText = await res.text().catch(() => "");
		const msg = res.status === 429 ? "Image generation is busy. Try again shortly." : errText.slice(0, 220) || `Could not create the image (${res.status}).`;
		return Response.json({ error: msg }, { status: 502 });
	}
	const url = (await res.json()).data?.[0]?.url;
	if (!url) return Response.json({ error: "No image came back. Try a different prompt." }, { status: 502 });
	return Response.json({ url });
} } } });
var DURATIONS = /* @__PURE__ */ new Set([6, 10]);
var RATIOS = /* @__PURE__ */ new Set([
	"16:9",
	"9:16",
	"1:1"
]);
var Route = createFileRoute("/api/video")({ server: { handlers: {
	POST: async ({ request }) => {
		const apiKey = process.env.XAI_API_KEY;
		if (!apiKey) return Response.json({ error: "Video generation is not available." }, { status: 503 });
		let body;
		try {
			body = await request.json();
		} catch {
			return Response.json({ error: "Invalid request." }, { status: 400 });
		}
		const prompt = (body.prompt ?? "").trim().slice(0, 1500);
		if (prompt.length < 3) return Response.json({ error: "Describe the video you want." }, { status: 400 });
		const duration = DURATIONS.has(body.duration ?? 6) ? body.duration ?? 6 : 6;
		const aspect_ratio = RATIOS.has(body.ratio ?? "16:9") ? body.ratio ?? "16:9" : "16:9";
		const imageUrl = typeof body.imageUrl === "string" && /^https?:\/\//i.test(body.imageUrl) ? body.imageUrl : void 0;
		const payload = {
			model: "grok-imagine-video-1.5",
			prompt,
			duration,
			aspect_ratio,
			resolution: "720p"
		};
		if (imageUrl) payload.image = { url: imageUrl };
		const res = await fetch("https://api.x.ai/v1/videos/generations", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify(payload),
			signal: request.signal
		});
		if (!res.ok) {
			const errText = await res.text().catch(() => "");
			const msg = res.status === 429 ? "Video generation is busy. Try again shortly." : errText.slice(0, 220) || `Could not start the video (${res.status}).`;
			return Response.json({ error: msg }, { status: 502 });
		}
		const json = await res.json();
		const requestId = json.request_id ?? json.requestId ?? json.id;
		if (!requestId) return Response.json({ error: "No request id came back. Try again." }, { status: 502 });
		return Response.json({ requestId });
	},
	GET: async ({ request }) => {
		const apiKey = process.env.XAI_API_KEY;
		if (!apiKey) return Response.json({ error: "Video generation is not available." }, { status: 503 });
		const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
		if (!id || !/^[\w.-]{8,80}$/.test(id)) return Response.json({ error: "Missing video request." }, { status: 400 });
		const res = await fetch(`https://api.x.ai/v1/videos/${encodeURIComponent(id)}`, {
			headers: { Authorization: `Bearer ${apiKey}` },
			signal: request.signal
		});
		if (!res.ok) {
			const errText = await res.text().catch(() => "");
			return Response.json({ error: errText.slice(0, 220) || `Could not check the video (${res.status}).` }, { status: 502 });
		}
		const json = await res.json();
		const url = json.video?.url ?? json.video_url;
		const status = (json.status ?? "pending").toLowerCase();
		if ((status === "done" || status === "succeeded") && url) return Response.json({
			status: "done",
			url,
			progress: 100
		});
		if (status === "failed" || status === "expired") return Response.json({
			status,
			error: json.error ?? "Video generation failed."
		}, { status: 502 });
		return Response.json({
			status: status || "pending",
			progress: json.progress ?? 0
		});
	}
} } });
var rootRouteChildren = {
	IndexRoute: Route$3.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$4
	}),
	ApiChatRoute: Route$2.update({
		id: "/api/chat",
		path: "/api/chat",
		getParentRoute: () => Route$4
	}),
	ApiImagineRoute: Route$1.update({
		id: "/api/imagine",
		path: "/api/imagine",
		getParentRoute: () => Route$4
	}),
	ApiVideoRoute: Route.update({
		id: "/api/video",
		path: "/api/video",
		getParentRoute: () => Route$4
	})
};
var routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { wantsAnimateLastImage as i, isImageIntent as n, isVideoIntent as r, router_exports as t };
