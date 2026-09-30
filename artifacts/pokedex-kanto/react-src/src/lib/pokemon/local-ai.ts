import { CATALOG, TYPE_LABELS } from "./catalog";
import type { AskDexInput } from "./types";

const BEATS: Record<string, string[]> = {
  normal: [],
  fire: ["grass", "ice", "bug", "steel"],
  water: ["fire", "ground", "rock"],
  electric: ["water", "flying"],
  grass: ["water", "ground", "rock"],
  ice: ["grass", "ground", "flying", "dragon"],
  fighting: ["normal", "ice", "rock", "dark", "steel"],
  poison: ["grass", "fairy"],
  ground: ["fire", "electric", "poison", "rock", "steel"],
  flying: ["grass", "fighting", "bug"],
  psychic: ["fighting", "poison"],
  bug: ["grass", "psychic", "dark"],
  rock: ["fire", "ice", "flying", "bug"],
  ghost: ["psychic", "ghost"],
  dragon: ["dragon"],
  dark: ["psychic", "ghost"],
  steel: ["ice", "rock", "fairy"],
  fairy: ["fighting", "dragon", "dark"],
};

function labelTypes(types: string[]) {
  return types.map((t) => TYPE_LABELS[t] ?? t).join(" y ");
}

function findByQuestion(q: string) {
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

export function localAsk(input: AskDexInput): string {
  const p = input.pokemon;

  if (input.mode === "hint" && p) {
    return `Pista: es de tipo ${labelTypes(p.types)}. Mira bien la silueta, no el color.`;
  }

  if (input.mode === "analyze" && p) {
    const off = p.types.flatMap((t) => BEATS[t] ?? []);
    const unique = [...new Set(off)].map((t) => TYPE_LABELS[t] ?? t);
    return `${p.nameEs} (nº ${p.id}) es ${labelTypes(p.types)}. Golpea fuerte a: ${unique.slice(0, 5).join(", ") || "ataques neutrales"}. ${p.description ?? ""}`.slice(0, 420);
  }

  const q = (input.question ?? "").toLowerCase();

  if (q.includes("rápido") || q.includes("velocidad")) {
    return "En Kanto, Electrode, Alakazam y Jolteon suelen ir primero. Abre su ficha para ver la velocidad exacta.";
  }
  if (q.includes("fuerte") || q.includes("ataque") || q.includes("legend")) {
    return "Los más temidos de Kanto en ataque son Dragonite, Mewtwo y los fósiles revividos. Mewtwo es el más especial.";
  }
  if (q.includes("debil") || q.includes("ganan") || q.includes("contra") || q.includes("tipo")) {
    const typeHit = Object.keys(TYPE_LABELS).find((t) =>
      q.includes(TYPE_LABELS[t].toLowerCase()) || q.includes(t),
    );
    if (typeHit) {
      const from = Object.entries(BEATS)
        .filter(([, list]) => list.includes(typeHit))
        .map(([t]) => TYPE_LABELS[t]);
      return `Al tipo ${TYPE_LABELS[typeHit]} le superan: ${from.join(", ") || "casi nada de forma directa"}.`;
    }
  }

  const hit = findByQuestion(q) ?? (p ? CATALOG.find((c) => c.id === p.id) : undefined);
  if (hit) {
    return `${hit.nameEs} es el nº ${hit.id}. Tipo ${labelTypes(hit.types)}. Pregúntame combate o abre la ficha para stats, grito y movimientos.`;
  }

  if (p) {
    return `${p.nameEs} es tipo ${labelTypes(p.types)}. ${p.description ?? "Abre otra pregunta sobre Kanto."}`;
  }

  return "Solo cubro los 151 de Kanto. Pregunta un nombre, un número, un tipo o pide un análisis de combate.";
}
