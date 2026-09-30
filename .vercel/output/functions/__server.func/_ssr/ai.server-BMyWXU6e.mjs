import { a as TYPE_LABELS, t as CATALOG } from "./catalog-Wwq4LA80.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ai.server-BMyWXU6e.js
var BEATS = {
	normal: [],
	fire: [
		"grass",
		"ice",
		"bug",
		"steel"
	],
	water: [
		"fire",
		"ground",
		"rock"
	],
	electric: ["water", "flying"],
	grass: [
		"water",
		"ground",
		"rock"
	],
	ice: [
		"grass",
		"ground",
		"flying",
		"dragon"
	],
	fighting: [
		"normal",
		"ice",
		"rock",
		"dark",
		"steel"
	],
	poison: ["grass", "fairy"],
	ground: [
		"fire",
		"electric",
		"poison",
		"rock",
		"steel"
	],
	flying: [
		"grass",
		"fighting",
		"bug"
	],
	psychic: ["fighting", "poison"],
	bug: [
		"grass",
		"psychic",
		"dark"
	],
	rock: [
		"fire",
		"ice",
		"flying",
		"bug"
	],
	ghost: ["psychic", "ghost"],
	dragon: ["dragon"],
	dark: ["psychic", "ghost"],
	steel: [
		"ice",
		"rock",
		"fairy"
	],
	fairy: [
		"fighting",
		"dragon",
		"dark"
	]
};
function labelTypes(types) {
	return types.map((t) => TYPE_LABELS[t] ?? t).join(" y ");
}
function findByQuestion(q) {
	const num = q.match(/\b(\d{1,3})\b/);
	if (num) {
		const id = Number(num[1]);
		return CATALOG.find((p) => p.id === id);
	}
	const compact = q.replace(/[.'¿?¡!]/g, "").trim();
	return CATALOG.find((p) => {
		const es = p.nameEs.toLowerCase();
		const en = p.name.toLowerCase();
		return compact.includes(es) || compact.includes(en);
	});
}
function localAsk(input) {
	const p = input.pokemon;
	if (input.mode === "hint" && p) return `Pista: es de tipo ${labelTypes(p.types)}. Mira bien la silueta, no el color.`;
	if (input.mode === "analyze" && p) {
		const off = p.types.flatMap((t) => BEATS[t] ?? []);
		const unique = [...new Set(off)].map((t) => TYPE_LABELS[t] ?? t);
		return `${p.nameEs} (nº ${p.id}) es ${labelTypes(p.types)}. Golpea fuerte a: ${unique.slice(0, 5).join(", ") || "ataques neutrales"}. ${p.description ?? ""}`.slice(0, 420);
	}
	const q = (input.question ?? "").toLowerCase();
	if (q.includes("rápido") || q.includes("velocidad")) return "En Kanto, Electrode, Alakazam y Jolteon suelen ir primero. Abre su ficha para ver la velocidad exacta.";
	if (q.includes("fuerte") || q.includes("ataque") || q.includes("legend")) return "Los más temidos de Kanto en ataque son Dragonite, Mewtwo y los fósiles revividos. Mewtwo es el más especial.";
	if (q.includes("debil") || q.includes("ganan") || q.includes("contra") || q.includes("tipo")) {
		const typeHit = Object.keys(TYPE_LABELS).find((t) => q.includes(TYPE_LABELS[t].toLowerCase()) || q.includes(t));
		if (typeHit) {
			const from = Object.entries(BEATS).filter(([, list]) => list.includes(typeHit)).map(([t]) => TYPE_LABELS[t]);
			return `Al tipo ${TYPE_LABELS[typeHit]} le superan: ${from.join(", ") || "casi nada de forma directa"}.`;
		}
	}
	const hit = findByQuestion(q) ?? (p ? CATALOG.find((c) => c.id === p.id) : void 0);
	if (hit) return `${hit.nameEs} es el nº ${hit.id}. Tipo ${labelTypes(hit.types)}. Pregúntame combate o abre la ficha para stats, grito y movimientos.`;
	if (p) return `${p.nameEs} es tipo ${labelTypes(p.types)}. ${p.description ?? "Abre otra pregunta sobre Kanto."}`;
	return "Solo cubro los 151 de Kanto. Pregunta un nombre, un número, un tipo o pide un análisis de combate.";
}
var analyzeCache = /* @__PURE__ */ new Map();
function systemFor(mode) {
	const base = "Eres el módulo de IA de una Pokédex de la primera generación (solo Pokémon 001 a 151 de Kanto). Hablas español, tono de dispositivo clásico: claro, breve y útil. Máximo 90 palabras. Si preguntan por un Pokémon posterior al 151, recuerdas el límite de esta Pokédex. No inventes datos. No uses emojis.";
	if (mode === "hint") return base + " El usuario está adivinando una silueta. Da UNA pista (forma, tipo, hábitat o rasgo) " + "SIN decir el nombre, el número ni la línea evolutiva completa.";
	if (mode === "analyze") return base + " Resume al Pokémon como una ficha de combate: rol, punto fuerte, punto débil y un consejo Gen 1.";
	return base + " Responde la pregunta sobre Kanto. Si hay ficha en contexto, úsala.";
}
async function askDex(input) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: true,
		text: localAsk(input)
	};
	if (input.mode === "analyze" && input.pokemon?.id) {
		const hit = analyzeCache.get(input.pokemon.id);
		if (hit) return {
			ok: true,
			text: hit
		};
	}
	const userBits = [];
	if (input.pokemon) {
		const p = input.pokemon;
		userBits.push(`Ficha: nº ${p.id} ${p.nameEs}. Tipos: ${p.types.join(", ")}.`);
		if (p.description) userBits.push(`Pokédex: ${p.description}`);
		if (p.abilities?.length) userBits.push(`Habilidades: ${p.abilities.map((a) => a.nameEs).join(", ")}`);
		if (p.stats?.length) userBits.push(`Stats: ${p.stats.map((s) => `${s.name} ${s.base}`).join(", ")}`);
	}
	if (input.mode === "hint") userBits.push("Pide una pista para adivinar la silueta.");
	else if (input.mode === "analyze") userBits.push("Analiza este Pokémon para un entrenador de Kanto.");
	else userBits.push(input.question?.trim() || "Explícame este Pokémon.");
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			max_tokens: 220,
			temperature: .6,
			messages: [{
				role: "system",
				content: systemFor(input.mode)
			}, {
				role: "user",
				content: userBits.join("\n")
			}]
		})
	});
	if (!res.ok) return {
		ok: true,
		text: localAsk(input)
	};
	const text = (await res.json()).choices?.[0]?.message?.content?.trim() ?? "";
	if (!text) return {
		ok: true,
		text: localAsk(input)
	};
	if (input.mode === "analyze" && input.pokemon?.id) analyzeCache.set(input.pokemon.id, text);
	return {
		ok: true,
		text
	};
}
//#endregion
export { askDex };
