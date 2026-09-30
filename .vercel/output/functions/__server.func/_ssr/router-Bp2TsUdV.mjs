import { i as __toESM } from "../_runtime.mjs";
import { a as TYPE_LABELS, d as shinyArtworkUrl, f as spriteUrl, i as TYPE_CLASS, l as findInCatalog, n as FILTER_TYPES, p as suggestCatalog, r as RANGE_ERROR, t as CATALOG, u as shinyAnimatedGifUrl } from "./catalog-Wwq4LA80.mjs";
import { i as require_react, n as QueryClientProvider, r as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { f as createRouter, g as useRouter, h as createRootRoute, l as Scripts, m as createFileRoute, p as Outlet, u as HeadContent } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as object, i as number, n as array, o as string, r as literal, s as union, t as _enum } from "../_libs/zod.mjs";
import { a as ChevronRight, i as Search, n as TriangleAlert, o as Bot, r as Star, s as ArrowLeft, t as Volume2 } from "../_libs/lucide-react.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-Bp2TsUdV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
function QueryProvider({ children }) {
	const [client] = (0, import_react.useState)(() => new QueryClient({ defaultOptions: { queries: {
		staleTime: 6e5,
		retry: 1,
		refetchOnWindowFocus: false
	} } }));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client,
		children
	});
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
var styles_default = "/assets/styles-zg8rba3C.css";
var APP_NAME = "Pokédex Gen 1";
var Route$1 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Pokédex de los 151 Pokémon de la primera generación: fichas, tipos, evoluciones, gritos y el juego de sombras."
			},
			{
				name: "theme-color",
				content: "#C41E3A"
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
				href: "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "es",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function padDex(id) {
	return String(id).padStart(3, "0");
}
function titleCase(value) {
	return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
function TypeBadge({ type }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide", TYPE_CLASS[type] ?? "bg-pk-muted text-pk-ink"),
		children: TYPE_LABELS[type] ?? type
	});
}
var KEY$1 = "pokedex-gen1-favorites";
function read$1() {
	try {
		const raw = localStorage.getItem(KEY$1);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((n) => typeof n === "number");
	} catch {
		return [];
	}
}
function useFavorites() {
	const [ids, setIds] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		setIds(read$1());
	}, []);
	return {
		ids,
		toggle: (0, import_react.useCallback)((id) => {
			setIds((prev) => {
				const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
				localStorage.setItem(KEY$1, JSON.stringify(next));
				return next;
			});
		}, []),
		has: (0, import_react.useCallback)((id) => ids.includes(id), [ids])
	};
}
var KEY = "pokedex-gen1-log";
function read() {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return {
			seen: [],
			caught: []
		};
		const parsed = JSON.parse(raw);
		return {
			seen: Array.isArray(parsed.seen) ? parsed.seen.filter((n) => typeof n === "number") : [],
			caught: Array.isArray(parsed.caught) ? parsed.caught.filter((n) => typeof n === "number") : []
		};
	} catch {
		return {
			seen: [],
			caught: []
		};
	}
}
function write(log) {
	localStorage.setItem(KEY, JSON.stringify(log));
}
function uniq(ids) {
	return [...new Set(ids)];
}
function useDexLog() {
	const [log, setLog] = (0, import_react.useState)({
		seen: [],
		caught: []
	});
	(0, import_react.useEffect)(() => {
		setLog(read());
	}, []);
	const markSeen = (0, import_react.useCallback)((id) => {
		setLog((prev) => {
			if (prev.seen.includes(id)) return prev;
			const next = {
				...prev,
				seen: uniq([...prev.seen, id])
			};
			write(next);
			return next;
		});
	}, []);
	/** Marca todos los Pokémon de la Pokédex (1–151) como vistos. */
	const revealAll = (0, import_react.useCallback)(() => {
		setLog((prev) => {
			const allIds = Array.from({ length: 151 }, (_, i) => i + 1);
			const next = {
				...prev,
				seen: uniq([...prev.seen, ...allIds])
			};
			write(next);
			return next;
		});
	}, []);
	const toggleCaught = (0, import_react.useCallback)((id) => {
		setLog((prev) => {
			const has = prev.caught.includes(id);
			const caught = has ? prev.caught.filter((x) => x !== id) : uniq([...prev.caught, id]);
			const next = {
				seen: has ? prev.seen : uniq([...prev.seen, id]),
				caught
			};
			write(next);
			return next;
		});
	}, []);
	const isSeen = (0, import_react.useCallback)((id) => log.seen.includes(id), [log.seen]);
	const isCaught = (0, import_react.useCallback)((id) => log.caught.includes(id), [log.caught]);
	return {
		seenCount: log.seen.length,
		caughtCount: log.caught.length,
		markSeen,
		revealAll,
		toggleCaught,
		isSeen,
		isCaught
	};
}
var ALL = Object.keys(TYPE_LABELS);
/** attacker → defender → multiplier (omit 1×) */
var ATK = {
	normal: {
		rock: .5,
		ghost: 0,
		steel: .5
	},
	fire: {
		fire: .5,
		water: .5,
		grass: 2,
		ice: 2,
		bug: 2,
		rock: .5,
		dragon: .5,
		steel: 2
	},
	water: {
		fire: 2,
		water: .5,
		grass: .5,
		ground: 2,
		rock: 2,
		dragon: .5
	},
	electric: {
		water: 2,
		electric: .5,
		grass: .5,
		ground: 0,
		flying: 2,
		dragon: .5
	},
	grass: {
		fire: .5,
		water: 2,
		grass: .5,
		poison: .5,
		ground: 2,
		flying: .5,
		bug: .5,
		rock: 2,
		dragon: .5,
		steel: .5
	},
	ice: {
		fire: .5,
		water: .5,
		grass: 2,
		ice: .5,
		ground: 2,
		flying: 2,
		dragon: 2,
		steel: .5
	},
	fighting: {
		normal: 2,
		ice: 2,
		poison: .5,
		flying: .5,
		psychic: .5,
		bug: .5,
		rock: 2,
		ghost: 0,
		dark: 2,
		steel: 2,
		fairy: .5
	},
	poison: {
		grass: 2,
		poison: .5,
		ground: .5,
		rock: .5,
		ghost: .5,
		steel: 0,
		fairy: 2
	},
	ground: {
		fire: 2,
		electric: 2,
		grass: .5,
		poison: 2,
		flying: 0,
		bug: .5,
		rock: 2,
		steel: 2
	},
	flying: {
		electric: .5,
		grass: 2,
		fighting: 2,
		bug: 2,
		rock: .5,
		steel: .5
	},
	psychic: {
		fighting: 2,
		poison: 2,
		psychic: .5,
		dark: 0,
		steel: .5
	},
	bug: {
		fire: .5,
		grass: 2,
		fighting: .5,
		poison: .5,
		flying: .5,
		psychic: 2,
		ghost: .5,
		dark: 2,
		steel: .5,
		fairy: .5
	},
	rock: {
		fire: 2,
		ice: 2,
		fighting: .5,
		ground: .5,
		flying: 2,
		bug: 2,
		steel: .5
	},
	ghost: {
		normal: 0,
		psychic: 2,
		ghost: 2,
		dark: .5
	},
	dragon: {
		dragon: 2,
		steel: .5,
		fairy: 0
	},
	dark: {
		fighting: .5,
		psychic: 2,
		ghost: 2,
		dark: .5,
		fairy: .5
	},
	steel: {
		fire: .5,
		water: .5,
		electric: .5,
		ice: 2,
		rock: 2,
		steel: .5,
		fairy: 2
	},
	fairy: {
		fire: .5,
		fighting: 2,
		poison: .5,
		dragon: 2,
		dark: 2,
		steel: .5
	}
};
function defenseMatchup(types) {
	const weak = [];
	const resist = [];
	const immune = [];
	for (const atk of ALL) {
		let m = 1;
		for (const def of types) m *= ATK[atk]?.[def] ?? 1;
		if (m === 1) continue;
		const row = {
			type: atk,
			mult: m
		};
		if (m === 0) immune.push(row);
		else if (m > 1) weak.push(row);
		else resist.push(row);
	}
	weak.sort((a, b) => b.mult - a.mult);
	resist.sort((a, b) => a.mult - b.mult);
	return {
		weak,
		resist,
		immune
	};
}
function formatMult(m) {
	if (m === 0) return "x0";
	if (m === .25) return "x¼";
	if (m === .5) return "x½";
	if (m === 2) return "x2";
	if (m === 4) return "x4";
	return `x${m}`;
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getPokemonFn = createServerFn({ method: "GET" }).validator(object({ q: string().min(1).max(48) })).handler(createSsrRpc("e33781ec4214bf2d60fb339dfe6410f511a1fa9466943886227dfd126fe3b9bd"));
var getQuizFn = createServerFn({ method: "GET" }).handler(createSsrRpc("7c741528990a5ceeaea2612cce5f9905baeff8a0b9400150d95239bcc1377fe8"));
var askSchema = object({
	mode: _enum([
		"chat",
		"hint",
		"analyze"
	]),
	question: string().max(280).optional(),
	pokemon: object({
		id: number().int().min(1).max(151),
		nameEs: string(),
		types: array(string()),
		description: string().optional(),
		stats: array(object({
			name: string(),
			base: number()
		})).optional(),
		abilities: array(object({ nameEs: string() })).optional()
	}).optional()
});
var askDexFn = createServerFn({ method: "POST" }).validator(askSchema).handler(createSsrRpc("f3c5120a23c69dbbfee57f830421c681286a619b0caa1a8de04c5ae15f56bb4b"));
var audio = null;
var muted = false;
var loopId = null;
var cryEl = null;
function ctx() {
	if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
	return audio;
}
function isMuted() {
	return muted;
}
function setMuted(value) {
	muted = value;
	if (value) stopAll();
	try {
		localStorage.setItem("pk-muted", value ? "1" : "0");
	} catch {}
}
function loadMutePref() {
	try {
		muted = localStorage.getItem("pk-muted") === "1";
	} catch {
		muted = false;
	}
	return muted;
}
async function unlockAudio() {
	const c = ctx();
	if (c.state === "suspended") await c.resume();
}
function tone(c, n, t0) {
	const osc = c.createOscillator();
	const amp = c.createGain();
	const filt = c.createBiquadFilter();
	osc.type = n.type ?? "square";
	osc.frequency.value = n.freq;
	filt.type = "lowpass";
	filt.frequency.value = 2400;
	const g = n.gain ?? .07;
	const start = t0 + n.at;
	amp.gain.setValueAtTime(1e-4, start);
	amp.gain.exponentialRampToValueAtTime(g, start + .012);
	amp.gain.exponentialRampToValueAtTime(1e-4, start + n.dur);
	osc.connect(filt);
	filt.connect(amp);
	amp.connect(c.destination);
	osc.start(start);
	osc.stop(start + n.dur + .02);
}
function playNotes(notes) {
	if (muted) return;
	const c = ctx();
	if (c.state === "suspended") c.resume();
	const t0 = c.currentTime + .01;
	for (const n of notes) tone(c, n, t0);
}
function stopLoop() {
	if (loopId != null) {
		window.clearInterval(loopId);
		loopId = null;
	}
}
function stopCry() {
	if (cryEl) {
		cryEl.pause();
		cryEl = null;
	}
}
function stopAll() {
	stopLoop();
	stopCry();
	if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
}
function playBoot() {
	playNotes([
		{
			freq: 196,
			at: 0,
			dur: .1
		},
		{
			freq: 262,
			at: .1,
			dur: .1
		},
		{
			freq: 330,
			at: .2,
			dur: .1
		},
		{
			freq: 392,
			at: .3,
			dur: .14
		},
		{
			freq: 523,
			at: .44,
			dur: .32,
			type: "triangle",
			gain: .09
		}
	]);
}
function playClick() {
	playNotes([{
		freq: 880,
		at: 0,
		dur: .05,
		type: "square",
		gain: .04
	}]);
}
function playDexOpen() {
	playNotes([
		{
			freq: 392,
			at: 0,
			dur: .08
		},
		{
			freq: 523,
			at: .08,
			dur: .08
		},
		{
			freq: 659,
			at: .16,
			dur: .16,
			type: "triangle"
		}
	]);
}
function playWhoIsThat() {
	playNotes([
		{
			freq: 294,
			at: 0,
			dur: .16,
			type: "triangle",
			gain: .08
		},
		{
			freq: 247,
			at: .18,
			dur: .16,
			type: "triangle",
			gain: .08
		},
		{
			freq: 330,
			at: .36,
			dur: .18,
			type: "triangle",
			gain: .08
		},
		{
			freq: 196,
			at: .56,
			dur: .42,
			type: "triangle",
			gain: .09
		}
	]);
}
function playQuizLoop() {
	stopLoop();
	if (muted) return;
	const motif = () => {
		playNotes([
			{
				freq: 220,
				at: 0,
				dur: .16,
				type: "triangle",
				gain: .045
			},
			{
				freq: 196,
				at: .2,
				dur: .16,
				type: "triangle",
				gain: .045
			},
			{
				freq: 247,
				at: .4,
				dur: .2,
				type: "triangle",
				gain: .05
			},
			{
				freq: 165,
				at: .64,
				dur: .28,
				type: "triangle",
				gain: .04
			}
		]);
	};
	motif();
	loopId = window.setInterval(motif, 1500);
}
function playCorrectSfx() {
	stopLoop();
	playNotes([
		{
			freq: 523,
			at: 0,
			dur: .1
		},
		{
			freq: 659,
			at: .1,
			dur: .1
		},
		{
			freq: 784,
			at: .2,
			dur: .12
		},
		{
			freq: 1046,
			at: .32,
			dur: .34,
			type: "triangle",
			gain: .09
		}
	]);
}
function playWrongSfx() {
	stopLoop();
	playNotes([
		{
			freq: 196,
			at: 0,
			dur: .16,
			type: "sawtooth",
			gain: .05
		},
		{
			freq: 165,
			at: .14,
			dur: .16,
			type: "sawtooth",
			gain: .05
		},
		{
			freq: 110,
			at: .28,
			dur: .36,
			type: "sawtooth",
			gain: .06
		}
	]);
}
function playCry(url) {
	if (muted) return;
	stopCry();
	const el = new Audio(url);
	el.volume = .72;
	cryEl = el;
	el.play().catch(() => {});
}
function pickSpanishVoice() {
	const voices = window.speechSynthesis.getVoices();
	return voices.find((v) => v.lang.toLowerCase().startsWith("es-mx")) ?? voices.find((v) => v.lang.toLowerCase().startsWith("es-es")) ?? voices.find((v) => v.lang.toLowerCase().startsWith("es")) ?? null;
}
function speakDex(text) {
	if (typeof window === "undefined") return;
	if (isMuted()) return;
	const synth = window.speechSynthesis;
	synth.cancel();
	const utter = new SpeechSynthesisUtterance(text);
	utter.lang = "es-ES";
	utter.rate = .94;
	utter.pitch = .82;
	utter.volume = .95;
	const voice = pickSpanishVoice();
	if (voice) utter.voice = voice;
	synth.speak(utter);
}
function stopSpeak() {
	if (typeof window === "undefined") return;
	window.speechSynthesis.cancel();
}
function warmupVoices() {
	if (typeof window === "undefined") return;
	window.speechSynthesis.getVoices();
	window.speechSynthesis.addEventListener("voiceschanged", () => {
		window.speechSynthesis.getVoices();
	});
}
var STAT_LABEL = {
	hp: "PS",
	attack: "Ataque",
	defense: "Defensa",
	"special-attack": "At. Esp.",
	"special-defense": "Def. Esp.",
	speed: "Velocidad"
};
function PokedexApp() {
	const [powered, setPowered] = (0, import_react.useState)(false);
	const [muted, setMutedUi] = (0, import_react.useState)(false);
	const [tab, setTab] = (0, import_react.useState)("list");
	const [query, setQuery] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [selectedId, setSelectedId] = (0, import_react.useState)(null);
	const [typeFilter, setTypeFilter] = (0, import_react.useState)(null);
	const [onlyFavs, setOnlyFavs] = (0, import_react.useState)(false);
	const [statusFilter, setStatusFilter] = (0, import_react.useState)("all");
	const [suggestOpen, setSuggestOpen] = (0, import_react.useState)(false);
	const [cursor, setCursor] = (0, import_react.useState)(0);
	const [vsLeft, setVsLeft] = (0, import_react.useState)(null);
	const [vsRight, setVsRight] = (0, import_react.useState)(null);
	const fav = useFavorites();
	const log = useDexLog();
	const searchRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		setMutedUi(loadMutePref());
		warmupVoices();
	}, []);
	const suggestions = (0, import_react.useMemo)(() => suggestCatalog(query), [query]);
	const visible = (0, import_react.useMemo)(() => {
		return CATALOG.filter((p) => {
			if (onlyFavs && !fav.has(p.id)) return false;
			if (typeFilter && !p.types.includes(typeFilter)) return false;
			if (statusFilter === "seen" && !log.isSeen(p.id)) return false;
			if (statusFilter === "caught" && !log.isCaught(p.id)) return false;
			if (statusFilter === "missing" && log.isSeen(p.id)) return false;
			return true;
		});
	}, [
		onlyFavs,
		typeFilter,
		statusFilter,
		fav,
		log
	]);
	(0, import_react.useEffect)(() => {
		setCursor(0);
	}, [
		typeFilter,
		onlyFavs,
		statusFilter
	]);
	const lcdName = selectedId != null ? CATALOG.find((p) => p.id === selectedId)?.nameEs ?? "" : "";
	function openPokemon(id) {
		setError(null);
		setSelectedId(id);
		log.markSeen(id);
		setTab("detail");
		setSuggestOpen(false);
		playClick();
	}
	function openCompare(left, right) {
		log.markSeen(left);
		setVsLeft(left);
		setVsRight(right ?? null);
		setSelectedId(left);
		playClick();
		stopLoop();
		setTab("compare");
	}
	function goTab(next) {
		playClick();
		if (next !== "quiz") stopLoop();
		setTab(next);
	}
	function runSearch(raw) {
		const q = raw.trim();
		if (!q) {
			setError("Escribe un número (1–151) o un nombre.");
			return;
		}
		if (/^\d+$/.test(q)) {
			const n = Number(q);
			if (n < 1 || n > 151) {
				setError(RANGE_ERROR);
				return;
			}
		}
		const hit = findInCatalog(q);
		if (hit) {
			setQuery(hit.nameEs);
			openPokemon(hit.id);
			return;
		}
		setTab("detail");
		setSelectedId(null);
		lookupUnknown(q);
	}
	async function lookupUnknown(q) {
		setError(null);
		const res = await getPokemonFn({ data: { q } });
		if (!res.ok) {
			setError(res.error);
			setTab("list");
			return;
		}
		openPokemon(res.data.id);
	}
	function powerOn() {
		unlockAudio();
		playBoot();
		speakDex("Pokédex de Kanto lista. Ciento cincuenta y un Pokémon.");
		log.revealAll();
		setPowered(true);
	}
	function toggleMute() {
		const next = !isMuted();
		setMuted(next);
		setMutedUi(next);
	}
	function stepDex(delta) {
		if (!powered) return;
		const base = selectedId ?? visible[cursor]?.id ?? 1;
		openPokemon(Math.min(151, Math.max(1, base + delta)));
	}
	function movePad(dir) {
		if (!powered) return;
		playClick();
		if (tab !== "list") {
			if (dir === "left") stepDex(-1);
			if (dir === "right") stepDex(1);
			if (dir === "up") setTab("list");
			if (dir === "down") setTab("quiz");
			return;
		}
		const cols = 3;
		let i = cursor;
		if (dir === "left") i -= 1;
		if (dir === "right") i += 1;
		if (dir === "up") i -= cols;
		if (dir === "down") i += cols;
		if (i >= 0 && i < visible.length) setCursor(i);
	}
	function confirmPad() {
		playClick();
		if (!powered) {
			powerOn();
			return;
		}
		if (tab === "list" && visible[cursor]) openPokemon(visible[cursor].id);
		else setTab("list");
	}
	function powerOff() {
		stopLoop();
		stopSpeak();
		setPowered(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "dex-stage",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-[920px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "dex-unit",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "dex-panel dex-left",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "dex-left-head",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: cn("dex-lens", powered && "lens-pulse"),
									"aria-label": powered ? "Pokédex encendida" : "Encender",
									onClick: () => {
										if (!powered) powerOn();
									}
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "dex-leds",
									"aria-hidden": true,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dex-led dex-led-r" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dex-led dex-led-y" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dex-led dex-led-g" })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "dex-bezel",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "dex-bezel-dots",
									"aria-hidden": true,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dex-bezel-dot" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dex-bezel-dot" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "dex-bezel-inner",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "dex-screen dex-screen-scroll screen-in p-3 text-pk-ink",
										children: !powered ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BootScreen, { onPower: powerOn }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
											tab === "list" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListView, {
												query,
												setQuery,
												error,
												suggestions,
												suggestOpen,
												setSuggestOpen,
												searchRef,
												onSearch: runSearch,
												onPick: openPokemon,
												typeFilter,
												setTypeFilter,
												onlyFavs,
												setOnlyFavs,
												statusFilter,
												setStatusFilter,
												visible,
												fav,
												log,
												cursor
											}),
											tab === "detail" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailView, {
												selectedId,
												onBack: () => setTab("list"),
												onOpen: openPokemon,
												onCompare: (id) => openCompare(id),
												fav,
												log
											}),
											tab === "quiz" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuizView, { onOpen: openPokemon }),
											tab === "ai" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AiView, { selectedId }),
											tab === "compare" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompareView, {
												leftId: vsLeft,
												rightId: vsRight,
												setLeftId: setVsLeft,
												setRightId: setVsRight,
												onOpen: openPokemon
											})
										] })
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "dex-left-foot",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dex-green btn-press",
									"aria-label": "Confirmar",
									onClick: confirmPad
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "dex-dpad",
									"aria-label": "Cruz de dirección",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dex-dpad-arm dex-dpad-ud" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dex-dpad-arm dex-dpad-lr" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dex-dpad-btn up",
											"aria-label": "Arriba",
											onClick: () => movePad("up")
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dex-dpad-btn down",
											"aria-label": "Abajo",
											onClick: () => movePad("down")
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dex-dpad-btn left",
											"aria-label": "Izquierda",
											onClick: () => movePad("left")
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dex-dpad-btn right",
											"aria-label": "Derecha",
											onClick: () => movePad("right")
										})
									]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "dex-hinge",
						"aria-hidden": true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "dex-panel dex-right",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "dex-lcd",
								"aria-live": "polite",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: powered ? selectedId ? `Nº ${padDex(selectedId)}` : "KANTO · 151" : "OFF" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: powered ? lcdName || tabLabel(tab) : "Pulsa el botón verde" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "dex-blue-pad",
								children: [
									[
										["list", "LISTA"],
										["detail", "FICHA"],
										["quiz", "SOMBRA"],
										["ai", "IA"]
									].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: cn("btn-press", tab === id && powered && "is-on"),
										onClick: () => {
											if (!powered) {
												powerOn();
												return;
											}
											goTab(id);
										},
										children: label
									}, id)),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "btn-press",
										onClick: () => {
											if (selectedId) playCry(`https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${selectedId}.ogg`);
										},
										children: "GRITO"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "btn-press",
										onClick: () => {
											if (selectedId) fav.toggle(selectedId);
										},
										children: "FAV"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "btn-press",
										onClick: () => {
											if (!powered) {
												powerOn();
												return;
											}
											openPokemon(Math.floor(Math.random() * 151) + 1);
										},
										children: "DADO"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "btn-press",
										onClick: toggleMute,
										children: muted ? "MUTE" : "SONIDO"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "dex-right-mid",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "dex-white-pair",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "dex-white-key btn-press",
										"aria-label": "Anterior",
										onClick: () => stepDex(-1),
										children: "Prev"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "dex-white-key btn-press",
										"aria-label": "Siguiente",
										onClick: () => stepDex(1),
										children: "Next"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dex-yellow btn-press",
									"aria-label": powered ? "Apagar" : "Encender",
									onClick: () => powered ? powerOff() : powerOn()
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "dex-black-row",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dex-black-key btn-press",
									onClick: () => {
										if (!powered) {
											powerOn();
											return;
										}
										openCompare(selectedId ?? visible[cursor]?.id ?? 1);
									},
									children: "VS"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dex-black-key btn-press",
									onClick: () => powered ? goTab("ai") : powerOn(),
									children: "PROF. DEX"
								})]
							})
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "dex-caption",
				children: "Pokédex de Kanto · 151 · Gen 1"
			})]
		})
	});
}
function tabLabel(tab) {
	if (tab === "quiz") return "¿Quién es ese?";
	if (tab === "ai") return "Profesor Dex";
	if (tab === "detail") return "Ficha";
	if (tab === "compare") return "Comparar";
	return "Índice";
}
function ListView(props) {
	const seenPct = Math.round(props.log.seenCount / 151 * 100);
	const caughtPct = Math.round(props.log.caughtCount / 151 * 100);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex items-end justify-between border-b-2 border-pk-muted pb-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-[11px] leading-relaxed text-pk-ink",
				children: "POKEDEX"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rounded-sm bg-pk-ink px-2 py-1 font-body text-sm text-pk-screen",
				children: "GEN 1 · 151"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 space-y-1 rounded-md border-2 border-pk-muted bg-pk-panel px-2 py-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-body text-base",
					children: [
						"Vistos ",
						props.log.seenCount,
						"/",
						151,
						" · Capturados",
						" ",
						props.log.caughtCount,
						"/",
						151
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-2 overflow-hidden rounded-sm bg-pk-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full bg-ok",
						style: { width: `${seenPct}%` }
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-2 overflow-hidden rounded-sm bg-pk-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full bg-pk-red",
						style: { width: `${caughtPct}%` }
					})
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative mb-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "sr-only",
						htmlFor: "dex-search",
						children: "Buscar Pokémon"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						id: "dex-search",
						ref: props.searchRef,
						value: props.query,
						onChange: (e) => {
							props.setQuery(e.target.value);
							props.setSuggestOpen(true);
						},
						onFocus: () => props.setSuggestOpen(true),
						onKeyDown: (e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								props.onSearch(props.query);
							}
							if (e.key === "Escape") props.setSuggestOpen(false);
						},
						placeholder: "Nº o nombre…",
						className: "h-11 min-h-11 flex-1 rounded-md border-2 border-pk-muted bg-pk-panel px-3 font-body text-xl text-pk-ink outline-none placeholder:text-pk-muted focus:border-pk-ink",
						autoComplete: "off"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Buscar",
						onClick: () => props.onSearch(props.query),
						className: "inline-flex size-11 items-center justify-center rounded-md bg-pk-ink text-pk-screen",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-5" })
					})
				]
			}), props.suggestOpen && props.suggestions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "absolute z-10 mt-1 w-full overflow-hidden rounded-md border-2 border-pk-muted bg-pk-panel shadow-lg",
				children: props.suggestions.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "flex w-full items-center gap-2 px-3 py-2 text-left font-body text-lg hover:bg-pk-screen",
					onClick: () => {
						props.setQuery(s.nameEs);
						props.onPick(s.id);
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: spriteUrl(s.id),
							alt: "",
							className: "pixelated size-8"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-pk-muted",
							children: ["#", padDex(s.id)]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: s.nameEs })
					]
				}) }, s.id))
			})]
		}),
		props.error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-2 rounded-md bg-bad px-3 py-2 font-body text-base leading-snug text-white",
			children: props.error
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2 flex flex-wrap items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => props.setOnlyFavs(!props.onlyFavs),
					className: cn("inline-flex h-10 items-center gap-1 rounded-full px-3 font-body text-base", props.onlyFavs ? "bg-pk-ink text-pk-screen" : "border-2 border-pk-muted bg-pk-panel text-pk-ink"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
						className: "size-4",
						fill: props.onlyFavs ? "currentColor" : "none"
					}), "Favoritos"]
				}),
				[
					["all", "Todos"],
					["seen", "Vistos"],
					["caught", "Capturados"],
					["missing", "Faltan"]
				].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => props.setStatusFilter(id),
					className: cn("h-10 rounded-full px-3 font-body text-base", props.statusFilter === id ? "bg-pk-ink text-pk-screen" : "border-2 border-pk-muted bg-pk-panel"),
					children: label
				}, id)),
				props.typeFilter && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => props.setTypeFilter(null),
					className: "font-body text-base text-pk-muted underline",
					children: "Quitar tipo"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "-mx-1 mb-3 flex gap-1 overflow-x-auto pb-1",
			children: FILTER_TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => props.setTypeFilter(props.typeFilter === t ? null : t),
				className: cn("shrink-0 rounded-full px-2.5 py-1 font-body text-sm uppercase", props.typeFilter === t ? TYPE_CLASS[t] : "bg-pk-panel text-pk-muted"),
				children: TYPE_LABELS[t]
			}, t))
		}),
		props.visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "py-10 text-center font-body text-xl text-pk-muted",
			children: "No hay Pokémon con ese filtro."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-3 gap-2",
			children: props.visible.map((p, i) => {
				const caught = props.log.isCaught(p.id);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cn("relative rounded-md border-2 bg-pk-panel p-1.5 text-center transition-transform duration-150 hover:scale-105", i === props.cursor ? "border-pk-ink" : "border-pk-muted"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": props.fav.has(p.id) ? "Quitar de favoritos" : "Añadir a favoritos",
							onClick: () => props.fav.toggle(p.id),
							className: "absolute right-1 top-1 z-10 text-pk-ink",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
								className: "size-4",
								fill: props.fav.has(p.id) ? "currentColor" : "none"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": caught ? "Soltar" : "Marcar capturado",
							onClick: () => props.log.toggleCaught(p.id),
							className: cn("absolute left-1 top-1 z-10 size-4 rounded-full border-2", caught ? "border-pk-ink bg-pk-red" : "border-pk-muted bg-pk-panel")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => props.onPick(p.id),
							className: "w-full",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-body text-sm text-pk-muted",
									children: ["#", padDex(p.id)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: spriteUrl(p.id),
									alt: p.nameEs,
									className: "pixelated mx-auto size-12",
									loading: "lazy"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate font-body text-base leading-tight",
									children: p.nameEs
								})
							]
						})
					]
				}, p.id);
			})
		})
	] });
}
function DetailView({ selectedId, onBack, onOpen, onCompare, fav, log }) {
	const q = useQuery({
		queryKey: ["pokemon", selectedId],
		queryFn: async () => {
			const res = await getPokemonFn({ data: { q: String(selectedId) } });
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		enabled: selectedId != null
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: onBack,
			className: "mb-3 inline-flex h-10 items-center gap-1 rounded-md bg-pk-ink px-3 font-body text-lg text-pk-screen",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), "Volver"]
		}),
		selectedId == null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "py-8 text-center font-body text-xl text-pk-muted",
			children: "Elige un Pokémon de la lista o búscalo."
		}),
		q.isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "py-8 text-center font-body text-xl text-pk-muted",
			children: "Consultando PokeAPI…"
		}),
		q.isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "rounded-md bg-bad px-3 py-2 font-body text-base text-white",
			children: q.error.message
		}),
		q.data && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PokemonSheet, {
			p: q.data,
			isFav: fav.has(q.data.id),
			onFav: () => fav.toggle(q.data.id),
			caught: log.isCaught(q.data.id),
			onCatch: () => log.toggleCaught(q.data.id),
			onOpen,
			onCompare: () => onCompare(q.data.id)
		})
	] });
}
function PokemonSheet({ p, isFav, onFav, caught, onCatch, onOpen, onCompare }) {
	const special = p.abilities.find((a) => !a.hidden) ?? p.abilities[0];
	const [mode, setMode] = (0, import_react.useState)("anim");
	const [isShiny, setIsShiny] = (0, import_react.useState)(false);
	const [aiNote, setAiNote] = (0, import_react.useState)(null);
	const [aiBusy, setAiBusy] = (0, import_react.useState)(false);
	const img = mode === "anim" ? isShiny ? shinyAnimatedGifUrl(p.id) : p.animated ?? p.artwork : isShiny ? shinyArtworkUrl(p.id) : p.artwork;
	const typeLabel = p.types.map((t) => TYPE_LABELS[t] ?? t).join(" y ");
	(0, import_react.useEffect)(() => {
		playDexOpen();
		playCry(p.cry);
		speakDex(`Pokémon número ${p.id}. ${p.nameEs}. Tipo ${typeLabel}.`);
		setAiNote(null);
		return () => {
			stopSpeak();
		};
	}, [
		p.id,
		p.cry,
		p.nameEs,
		typeLabel
	]);
	async function analyze() {
		setAiBusy(true);
		const res = await askDexFn({ data: {
			mode: "analyze",
			pokemon: {
				id: p.id,
				nameEs: p.nameEs,
				types: p.types,
				description: p.description,
				stats: p.stats,
				abilities: p.abilities.map((a) => ({ nameEs: a.nameEs }))
			}
		} });
		setAiBusy(false);
		if (res.ok) {
			setAiNote(res.text);
			speakDex(res.text);
		} else setAiNote(res.error);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex size-52 items-center justify-center rounded-xl border-4 border-pk-muted bg-pk-panel p-2 shadow-inner shadow-black/10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: img,
							alt: isShiny ? `${p.nameEs} shiny` : p.nameEs,
							className: cn(mode === "anim" ? "sprite-idle h-38 w-38 object-contain pixelated" : "sprite-idle h-48 w-48 object-contain")
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-wrap justify-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setMode("anim"),
								className: cn("rounded-full px-3 py-1 font-body text-base", mode === "anim" ? "bg-pk-ink text-pk-screen" : "bg-pk-panel"),
								children: "Sprite"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setMode("art"),
								className: cn("rounded-full px-3 py-1 font-body text-base", mode === "art" ? "bg-pk-ink text-pk-screen" : "bg-pk-panel"),
								children: "Arte"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setIsShiny((v) => !v),
								className: cn("rounded-full px-3 py-1 font-body text-base", isShiny ? "bg-yellow-400 text-black" : "bg-pk-panel text-pk-ink"),
								children: isShiny ? "Shiny" : "Normal"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 font-body text-lg text-pk-muted",
						children: ["Nº ", padDex(p.id)]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-[13px] leading-relaxed",
						children: p.nameEs
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex gap-1",
						children: p.types.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypeBadge, { type: t }, t))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => {
						playCry(p.cry);
						speakDex(`${p.nameEs}. Tipo ${typeLabel}. ${p.description}`);
					},
					className: "btn-press inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-pk-red font-body text-lg text-pk-paper",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" }), "Grito y ficha"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: onFav,
					className: "btn-press inline-flex h-11 items-center justify-center gap-2 rounded-md border-2 border-pk-muted bg-pk-panel px-3 font-body text-lg",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
						className: "size-4",
						fill: isFav ? "currentColor" : "none"
					}), isFav ? "Favorito" : "Guardar"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onCatch,
					className: cn("btn-press h-11 flex-1 rounded-md font-body text-lg", caught ? "bg-pk-red text-pk-paper" : "border-2 border-pk-muted bg-pk-panel"),
					children: caught ? "Capturado" : "Capturar"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onCompare,
					className: "btn-press h-11 flex-1 rounded-md border-2 border-pk-muted bg-pk-panel font-body text-lg",
					children: "Comparar"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => void analyze(),
				disabled: aiBusy,
				className: "btn-press inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-pk-ink font-body text-lg text-pk-screen disabled:opacity-60",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "size-4" }), aiBusy ? "Analizando…" : "Análisis IA"]
			}),
			aiNote && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md border-2 border-pk-ink bg-pk-panel px-3 py-2 font-body text-lg leading-snug",
				children: aiNote
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md border-2 border-pk-muted bg-pk-panel px-3 py-2 font-body text-lg leading-snug",
				children: p.description
			}),
			special && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-md border-2 border-pk-muted bg-pk-panel px-3 py-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-body text-sm uppercase tracking-wide text-pk-muted",
						children: "Poder especial"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-body text-xl",
						children: special.nameEs
					}),
					p.abilities.filter((a) => a.hidden).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-body text-base text-pk-muted",
						children: ["Oculta: ", a.nameEs]
					}, a.name))
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoCell, {
						label: "Altura",
						value: `${p.height} m`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoCell, {
						label: "Peso",
						value: `${p.weight} kg`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoCell, {
						label: "Captura",
						value: String(p.captureRate ?? "—")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoCell, {
						label: "Hábitat",
						value: p.habitat ? titleCase(p.habitat) : "—"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EvolutionRow, {
				stages: p.evolution,
				onOpen,
				currentId: p.id
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MatchupBlock, { types: p.types }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mb-1 font-body text-lg text-pk-muted",
				children: "Estadísticas"
			}), p.stats.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1 flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-16 font-body text-base text-pk-muted",
						children: STAT_LABEL[s.name] ?? s.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-2.5 flex-1 overflow-hidden rounded-sm bg-pk-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full bg-ok",
							style: { width: `${Math.min(100, s.base / 180 * 100)}%` }
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-8 text-right font-body text-base tabular-nums",
						children: s.base
					})
				]
			}, s.name))] }),
			p.moves.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mb-1 font-body text-lg text-pk-muted",
				children: "Movimientos Gen 1"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1",
				children: p.moves.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-sm bg-pk-ink px-2 py-0.5 font-body text-base text-pk-screen",
					children: titleCase(m)
				}, m))
			})] })
		]
	});
}
function InfoCell({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md border-2 border-pk-muted bg-pk-panel px-2 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-body text-sm uppercase text-pk-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-body text-lg",
			children: value
		})]
	});
}
function MatchupBlock({ types }) {
	const m = defenseMatchup(types);
	const rows = [
		{
			title: "Debilidades",
			items: m.weak
		},
		{
			title: "Resistencias",
			items: m.resist
		},
		{
			title: "Inmune",
			items: m.immune
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
		className: "mb-1 font-body text-lg text-pk-muted",
		children: "Tipos rivales"
	}), rows.map((row) => row.items.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-body text-base text-pk-muted",
			children: row.title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 flex flex-wrap gap-1",
			children: row.items.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "inline-flex items-center gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypeBadge, { type: g.type }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-body text-sm",
					children: formatMult(g.mult)
				})]
			}, g.type))
		})]
	}, row.title))] });
}
function CompareView({ leftId, rightId, setLeftId, setRightId, onOpen }) {
	const [pick, setPick] = (0, import_react.useState)("");
	const leftQ = useQuery({
		queryKey: ["pokemon", leftId],
		queryFn: async () => {
			const res = await getPokemonFn({ data: { q: String(leftId) } });
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		enabled: leftId != null
	});
	const rightQ = useQuery({
		queryKey: ["pokemon", rightId],
		queryFn: async () => {
			const res = await getPokemonFn({ data: { q: String(rightId) } });
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		enabled: rightId != null
	});
	function choose(raw) {
		const hit = findInCatalog(raw);
		if (!hit) return;
		setPick("");
		if (!leftId) setLeftId(hit.id);
		else setRightId(hit.id);
	}
	const a = leftQ.data;
	const b = rightQ.data;
	const statNames = a?.stats.map((s) => s.name) ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mb-2 font-display text-[10px] leading-relaxed",
			children: "Comparar"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2 flex gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: pick,
				onChange: (e) => setPick(e.target.value),
				onKeyDown: (e) => {
					if (e.key === "Enter") choose(pick);
				},
				placeholder: leftId ? "Rival (nº o nombre)" : "Primer Pokémon",
				className: "h-11 flex-1 rounded-md border-2 border-pk-muted bg-pk-panel px-3 font-body text-lg outline-none"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => choose(pick),
				className: "h-11 rounded-md bg-pk-ink px-3 font-body text-lg text-pk-screen",
				children: "Añadir"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 grid grid-cols-2 gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompareSlot, {
				p: a,
				loading: leftQ.isLoading
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompareSlot, {
				p: b,
				loading: rightQ.isLoading
			})]
		}),
		a && b && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mb-1 font-body text-lg text-pk-muted",
				children: "Stats"
			}),
			statNames.map((name) => {
				const av = a.stats.find((s) => s.name === name)?.base ?? 0;
				const bv = b.stats.find((s) => s.name === name)?.base ?? 0;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-body text-sm text-pk-muted",
						children: STAT_LABEL[name] ?? name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1 font-body text-base",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("w-8 tabular-nums", av > bv && "font-bold"),
								children: av
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex h-2.5 flex-1 overflow-hidden rounded-sm bg-pk-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full bg-ok",
									style: { width: `${av / (av + bv || 1) * 100}%` }
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full bg-pk-red",
									style: { width: `${bv / (av + bv || 1) * 100}%` }
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("w-8 text-right tabular-nums", bv > av && "font-bold"),
								children: bv
							})
						]
					})]
				}, name);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MatchupBlock, { types: a.types }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MatchupBlock, { types: b.types })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onOpen(a.id),
					className: "h-10 flex-1 rounded-md bg-pk-ink font-body text-lg text-pk-screen",
					children: "Ficha A"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onOpen(b.id),
					className: "h-10 flex-1 rounded-md bg-pk-ink font-body text-lg text-pk-screen",
					children: "Ficha B"
				})]
			})
		] })
	] });
}
function CompareSlot({ p, loading }) {
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-md border-2 border-pk-muted bg-pk-panel px-2 py-6 text-center font-body text-lg text-pk-muted",
		children: "Cargando…"
	});
	if (!p) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-md border-2 border-dashed border-pk-muted bg-pk-panel px-2 py-6 text-center font-body text-lg text-pk-muted",
		children: "Elige un Pokémon"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md border-2 border-pk-muted bg-pk-panel p-2 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-body text-sm text-pk-muted",
				children: ["Nº ", padDex(p.id)]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: p.animated ?? p.sprite,
				alt: p.nameEs,
				className: "pixelated mx-auto size-12"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-body text-lg",
				children: p.nameEs
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 flex justify-center gap-1",
				children: p.types.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypeBadge, { type: t }, t))
			})
		]
	});
}
function EvolutionRow({ stages, onOpen, currentId }) {
	if (stages.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
		className: "mb-2 font-body text-lg text-pk-muted",
		children: "Evoluciones"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap items-center justify-center gap-1",
		children: stages.map((stage, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-1",
			children: [i > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 text-pk-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-1",
				children: stage.map((node) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onOpen(node.id),
					className: cn("flex items-center gap-1 rounded-md border-2 bg-pk-panel px-1 py-1", node.id === currentId ? "border-pk-ink" : "border-pk-muted"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: spriteUrl(node.id),
						alt: "",
						className: "pixelated size-14"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block font-body text-base leading-tight",
							children: titleCase(node.name)
						}), node.method && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block font-body text-sm text-pk-muted",
							children: node.method
						})]
					})]
				}, node.id))
			})]
		}, i))
	})] });
}
function QuizView({ onOpen }) {
	const [guess, setGuess] = (0, import_react.useState)("");
	const [revealed, setRevealed] = (0, import_react.useState)(false);
	const [result, setResult] = (0, import_react.useState)(null);
	const [score, setScore] = (0, import_react.useState)({
		ok: 0,
		bad: 0
	});
	const [seed, setSeed] = (0, import_react.useState)(0);
	const [hint, setHint] = (0, import_react.useState)(null);
	const [hintBusy, setHintBusy] = (0, import_react.useState)(false);
	const q = useQuery({
		queryKey: ["quiz", seed],
		queryFn: () => getQuizFn()
	});
	(0, import_react.useEffect)(() => {
		setGuess("");
		setRevealed(false);
		setResult(null);
		setHint(null);
	}, [seed]);
	(0, import_react.useEffect)(() => {
		if (!q.data || revealed) return;
		playWhoIsThat();
		playQuizLoop();
		speakDex("¿Quién es ese Pokémon?");
		return () => {
			stopLoop();
		};
	}, [q.data?.id, revealed]);
	function next() {
		setSeed((s) => s + 1);
	}
	function check(p, raw) {
		const g = (raw ?? guess).trim().toLowerCase();
		if (!g) return;
		const names = [p.name, p.nameEs].map((n) => n.toLowerCase().replace(/[.'♀♂]/g, ""));
		const compact = g.replace(/[.'♀♂\s]/g, "");
		const hit = names.some((n) => {
			const clean = n.replace(/-/g, "");
			return n === g || clean === compact || g.length >= 3 && (n.startsWith(g) || clean.startsWith(compact));
		});
		setRevealed(true);
		setResult(hit ? "ok" : "bad");
		setScore((s) => hit ? {
			...s,
			ok: s.ok + 1
		} : {
			...s,
			bad: s.bad + 1
		});
		if (hit) {
			playCorrectSfx();
			playCry(`https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${p.id}.ogg`);
			speakDex(`¡Correcto! Es ${p.nameEs}.`);
		} else {
			playWrongSfx();
			speakDex(`Incorrecto. Era ${p.nameEs}.`);
		}
	}
	async function askHint(p) {
		setHintBusy(true);
		const res = await askDexFn({ data: {
			mode: "hint",
			pokemon: {
				id: p.id,
				nameEs: p.nameEs,
				types: p.types
			}
		} });
		setHintBusy(false);
		if (res.ok) {
			setHint(res.text);
			speakDex(res.text);
		} else setHint(res.error);
	}
	const p = q.data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mb-3 text-center font-display text-[11px] leading-relaxed",
			children: "¿Quién es ese Pokémon?"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "quiz-stage mx-auto mb-4 flex size-44 items-center justify-center rounded-lg border-4 border-pk-muted",
			children: p ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: p.sprite,
				alt: revealed ? p.nameEs : "Silueta",
				className: cn("max-h-72 max-w-72", revealed ? "revealed" : "silhouette")
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-body text-lg text-pk-muted",
				children: "Cargando…"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2 flex gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: guess,
				onChange: (e) => setGuess(e.target.value),
				onKeyDown: (e) => {
					if (e.key === "Enter" && p && !revealed) check(p);
				},
				placeholder: "Escribe el nombre…",
				disabled: !p || revealed,
				className: "h-11 flex-1 rounded-md border-2 border-pk-muted bg-pk-panel px-3 font-body text-xl outline-none disabled:opacity-60"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: !p || revealed,
				onClick: () => p && check(p),
				className: "h-11 rounded-md bg-pk-ink px-3 font-body text-lg text-pk-screen disabled:opacity-50",
				children: "Adivinar"
			})]
		}),
		p && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-3 grid grid-cols-2 gap-1",
			children: p.options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: revealed,
				onClick: () => check(p, opt.nameEs),
				className: "h-11 rounded-md border-2 border-pk-muted bg-pk-panel font-body text-lg disabled:opacity-60",
				children: opt.nameEs
			}, opt.id))
		}),
		result && p && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: cn("mb-2 rounded-md px-3 py-2 font-body text-lg text-white", result === "ok" ? "bg-ok" : "bg-bad"),
			children: [
				result === "ok" ? "Correcto: " : "Era ",
				p.nameEs,
				" (#",
				padDex(p.id),
				")"
			]
		}),
		hint && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mb-2 rounded-md border-2 border-pk-muted bg-pk-panel px-3 py-2 font-body text-lg leading-snug",
			children: ["Pista: ", hint]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: next,
					className: "btn-press h-10 flex-1 rounded-md bg-pk-screen-dim font-body text-lg",
					children: "Siguiente"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => p && void askHint(p),
					disabled: !p || revealed || hintBusy,
					className: "btn-press h-10 flex-1 rounded-md bg-pk-screen-dim font-body text-lg disabled:opacity-50",
					children: hintBusy ? "Pista…" : "Pista IA"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						setRevealed(true);
						setResult(null);
						stopLoop();
						if (p) {
							playCry(`https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${p.id}.ogg`);
							speakDex(`Es ${p.nameEs}.`);
						}
					},
					disabled: !p || revealed,
					className: "btn-press h-10 flex-1 rounded-md bg-pk-screen-dim font-body text-lg disabled:opacity-50",
					children: "Revelar"
				})
			]
		}),
		p && revealed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => onOpen(p.id),
			className: "mb-3 w-full rounded-md border-2 border-pk-muted bg-pk-panel py-2 font-body text-lg",
			children: "Ver ficha"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-center font-body text-lg text-pk-muted",
			children: [
				"Aciertos ",
				score.ok,
				" · Fallos ",
				score.bad
			]
		})
	] });
}
function BootScreen({ onPower }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-[280px] flex-col items-center justify-center text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-[11px] leading-relaxed",
				children: "POKéDEX"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-body text-xl text-pk-muted",
				children: "Kanto · 151"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 max-w-[16rem] font-body text-lg leading-snug",
				children: "Pulsa para encender el audio: gritos, voz de la Pokédex y el reto de la silueta."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onPower,
				className: "btn-press mt-6 h-12 rounded-md bg-pk-ink px-6 font-body text-xl text-pk-screen",
				children: "Encender"
			})
		]
	});
}
function AiView({ selectedId }) {
	const [question, setQuestion] = (0, import_react.useState)("");
	const [log, setLog] = (0, import_react.useState)([]);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const q = useQuery({
		queryKey: ["pokemon", selectedId],
		queryFn: async () => {
			const res = await getPokemonFn({ data: { q: String(selectedId) } });
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		enabled: selectedId != null
	});
	async function send(text) {
		const prompt = text.trim();
		if (!prompt || busy) return;
		setQuestion("");
		setLog((prev) => [...prev, {
			role: "user",
			text: prompt
		}]);
		setBusy(true);
		const p = q.data;
		const res = await askDexFn({ data: {
			mode: "chat",
			question: prompt,
			pokemon: p ? {
				id: p.id,
				nameEs: p.nameEs,
				types: p.types,
				description: p.description,
				stats: p.stats,
				abilities: p.abilities.map((a) => ({ nameEs: a.nameEs }))
			} : void 0
		} });
		setBusy(false);
		const reply = res.ok ? res.text : res.error;
		setLog((prev) => [...prev, {
			role: "dex",
			text: reply
		}]);
		speakDex(reply);
	}
	const chips = [
		"¿Cuál es el más rápido de Kanto?",
		"¿Qué tipos le ganan al agua?",
		selectedId ? "¿Cómo lo uso en combate?" : "¿Quién es el nº 25?"
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
			className: "mb-2 flex items-center gap-2 font-display text-[10px] leading-relaxed",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "size-4" }), "Profesor Dex"]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mb-3 font-body text-lg leading-snug text-pk-muted",
			children: ["IA de Kanto", q.data ? ` · ficha de ${q.data.nameEs}` : " · abre una ficha para más contexto"]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-2 flex flex-wrap gap-1",
			children: chips.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => void send(c),
				className: "btn-press rounded-full bg-pk-panel px-3 py-1 font-body text-base",
				children: c
			}, c))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2 max-h-56 space-y-2 overflow-y-auto",
			children: [
				log.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md border-2 border-pk-muted bg-pk-panel px-3 py-2 font-body text-lg",
					children: "Pregúntame tipos, combates, evoluciones o el juego de la silueta."
				}),
				log.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cn("rounded-md px-3 py-2 font-body text-lg leading-snug", m.role === "user" ? "bg-pk-ink text-pk-screen" : "border-2 border-pk-muted bg-pk-panel"),
					children: m.text
				}, i)),
				busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-body text-lg text-pk-muted",
					children: "Pensando…"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: question,
				onChange: (e) => setQuestion(e.target.value),
				onKeyDown: (e) => {
					if (e.key === "Enter") send(question);
				},
				placeholder: "Pregunta a la IA…",
				className: "h-11 flex-1 rounded-md border-2 border-pk-muted bg-pk-panel px-3 font-body text-lg outline-none"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: busy,
				onClick: () => void send(question),
				className: "btn-press h-11 rounded-md bg-pk-ink px-3 font-body text-lg text-pk-screen disabled:opacity-50",
				children: "Enviar"
			})]
		})
	] });
}
var Route = createFileRoute("/")({ component: Home });
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PokedexApp, {});
}
var rootRouteChildren = { IndexRoute: Route.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$1
}) };
var routeTree = Route$1._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { getRouter };
