const CATALOG = require("./catalog.json");

const TYPE_LABELS = {
  normal: "Normal",
  fire: "Fuego",
  water: "Agua",
  electric: "Eléctrico",
  grass: "Planta",
  ice: "Hielo",
  fighting: "Lucha",
  poison: "Veneno",
  ground: "Tierra",
  flying: "Volador",
  psychic: "Psíquico",
  bug: "Bicho",
  rock: "Roca",
  ghost: "Fantasma",
  dragon: "Dragón",
  dark: "Siniestro",
  steel: "Acero",
  fairy: "Hada",
};

const BEATS = {
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

function labelTypes(types) {
  return (types || []).map((t) => TYPE_LABELS[t] || t).join(" y ");
}

function findByQuestion(q) {
  const num = q.match(/\b(\d{1,3})\b/);
  if (num) {
    const id = Number(num[1]);
    if (id >= 1 && id <= 151) return CATALOG.find((p) => p.id === id);
  }
  const compact = q.replace(/[.'¿?¡!]/g, "").trim();
  return CATALOG.find((p) => {
    return compact.includes(p.nameEs.toLowerCase()) || compact.includes(p.name);
  });
}

function localAsk(input) {
  const p = input.pokemon;

  if (input.mode === "hint" && p) {
    return `Pista: es de tipo ${labelTypes(p.types)}. Mira bien la silueta, no el color.`;
  }

  if (input.mode === "analyze" && p) {
    const off = (p.types || []).flatMap((t) => BEATS[t] || []);
    const unique = [...new Set(off)].map((t) => TYPE_LABELS[t] || t);
    return `${p.nameEs || p.name} (nº ${p.id}) es ${labelTypes(p.types)}. Golpea fuerte a: ${unique.slice(0, 5).join(", ") || "ataques neutrales"}.`;
  }

  const q = String(input.question || "").toLowerCase();

  if (q.includes("rápido") || q.includes("velocidad")) {
    return "En Kanto, Electrode, Alakazam y Jolteon suelen ir primero. Abre su ficha para ver la velocidad exacta.";
  }
  if (q.includes("fuerte") || q.includes("ataque") || q.includes("legend")) {
    return "Los más temidos de Kanto en ataque son Dragonite, Mewtwo y los fósiles revividos. Mewtwo es el más especial.";
  }
  if (q.includes("debil") || q.includes("ganan") || q.includes("contra") || q.includes("tipo")) {
    const typeHit = Object.keys(TYPE_LABELS).find(
      (t) => q.includes(TYPE_LABELS[t].toLowerCase()) || q.includes(t),
    );
    if (typeHit) {
      const from = Object.entries(BEATS)
        .filter(([, list]) => list.includes(typeHit))
        .map(([t]) => TYPE_LABELS[t]);
      return `Al tipo ${TYPE_LABELS[typeHit]} le superan: ${from.join(", ") || "casi nada de forma directa"}.`;
    }
  }

  const hit = findByQuestion(q) || (p ? CATALOG.find((c) => c.id === p.id) : undefined);
  if (hit) {
    return `${hit.nameEs} es el nº ${hit.id}. Tipo ${labelTypes(hit.types)}. Pregúntame combate o abre la ficha.`;
  }
  if (p) {
    return `${p.nameEs || p.name} es tipo ${labelTypes(p.types)}. Pregunta un tipo, un número o un combate de Kanto.`;
  }
  return "Soy el Profesor Dex local (sin internet extra). Pregunta un nombre, un número 1–151 o un tipo de Kanto.";
}

module.exports = { localAsk };
