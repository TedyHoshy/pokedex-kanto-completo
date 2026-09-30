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
    const catalog = CATALOG.find((entry) => entry.id === p.id) ?? null;
    const types = catalog?.types ?? p.types;
    const typeText = labelTypes(types);

    const shape =
      types.includes("water")
        ? "Cuerpo alargado, con aletas o forma de pez."
        : types.includes("fire")
          ? "Más alto que ancho y muy agresivo."
          : types.includes("grass")
            ? "Forma redondeada, natural y muy vegetal."
            : types.includes("electric")
              ? "Ligero, nervioso y con líneas muy dinámicas."
              : types.includes("psychic")
                ? "Se ve raro, etéreo y poco físico."
                : types.includes("ghost")
                  ? "Silueta fantasmagórica y casi incorpórea."
                  : types.includes("bug")
                    ? "Pequeño, segmentado y con patas marcadas."
                    : types.includes("rock")
                      ? "Duro, pesado y muy compacto."
                      : types.includes("flying")
                        ? "Cuerpo aéreo, con alas muy visibles."
                        : "Silueta simple y bastante normal.";

    const comparison =
      p.id <= 40
        ? "Es pequeño o mediano."
        : p.id <= 90
          ? "Tiene tamaño medio."
          : "Es grande y bastante pesado.";

    const pose =
      types.includes("flying") || types.includes("water")
        ? "Parece moverse mucho."
        : types.includes("rock") || types.includes("ground")
          ? "Se ve más estable y firme."
          : "Tiene una pose más equilibrada.";

    return `Tipo ${typeText}. ${shape} ${comparison} ${pose}`;
  }

  if (input.mode === "analyze" && p) {
    const off = p.types.flatMap((t) => BEATS[t] ?? []);
    const unique = [...new Set(off)].map((t) => TYPE_LABELS[t] ?? t);
    return `${p.nameEs} (nº ${p.id}) es ${labelTypes(p.types)}. Golpea fuerte a: ${unique.slice(0, 5).join(", ") || "ataques neutrales"}. ${p.description ?? ""}`.slice(0, 420);
  }

  const q = (input.question ?? "").toLowerCase();

  if (!q.trim()) {
    if (p) {
      return `${p.nameEs} es tipo ${labelTypes(p.types)}. ${p.description ?? "Abre otra pregunta sobre Kanto."}`;
    }
    return "Solo cubro los 151 de Kanto. Pregunta por un Pokémon, un tipo, una debilidad, un combate o una estadística.";
  }

  const typeHit = Object.keys(TYPE_LABELS).find((t) =>
    q.includes(TYPE_LABELS[t].toLowerCase()) || q.includes(t),
  );

  if (q.includes("rápido") || q.includes("velocidad") || q.includes("más rápido") || q.includes("speed")) {
    return "En Kanto, los más rápidos suelen ser Alakazam, Jolteon y Electrode. Si quieres, te digo cuál es mejor según tu equipo.";
  }

  if (q.includes("fuerte") || q.includes("ataque") || q.includes("más potente") || q.includes("power")) {
    return "Los más fuertes de Kanto suelen ser Mewtwo, Dragonite, Snorlax y Gyarados. En ofensiva, Mewtwo es el más dominante por su daño bruto.";
  }

  if (q.includes("débil") || q.includes("debil") || q.includes("ganan") || q.includes("contra") || q.includes("tipo")) {
    if (typeHit) {
      const from = Object.entries(BEATS)
        .filter(([, list]) => list.includes(typeHit))
        .map(([t]) => TYPE_LABELS[t]);
      return `Al tipo ${TYPE_LABELS[typeHit]} le superan: ${from.join(", ") || "casi nada de forma directa"}.`;
    }
  }

  if (q.includes("mejor") || q.includes("recomend") || q.includes("equipo") || q.includes("equilibrado")) {
    return "Para un equipo fiable en Kanto suele ir bien: Bulbasaur, Pikachu, Gyarados o Snorlax, según si prefieres ataque, defensa o velocidad. Puedo sugerirte una composición exacta.";
  }

  if (q.includes("evoluc") || q.includes("evolución") || q.includes("evolucion")) {
    const hit = findByQuestion(q) ?? (p ? CATALOG.find((c) => c.id === p.id) : undefined);
    if (hit) {
      return `${hit.nameEs} es el nº ${hit.id} de Kanto. Tiene tipo ${labelTypes(hit.types)} y forma parte del árbol de evolución de la primera generación. Puedes pedir su línea evolutiva exacta o su ficha completa.`;
    }
  }

  if (q.includes("stats") || q.includes("estad") || q.includes("hp") || q.includes("ataque") || q.includes("defensa")) {
    const hit = findByQuestion(q) ?? (p ? CATALOG.find((c) => c.id === p.id) : undefined);
    if (hit) {
      return `${hit.nameEs} tiene tipo ${labelTypes(hit.types)} y pertenece a la Pokédex de Kanto. Abre su ficha para ver sus stats exactos, habilidades y movimientos.`;
    }
  }

  if (q.includes("habitat") || q.includes("lugar") || q.includes("dónde vive") || q.includes("donde vive")) {
    const hit = findByQuestion(q) ?? (p ? CATALOG.find((c) => c.id === p.id) : undefined);
    if (hit) {
      return `${hit.nameEs} es un Pokémon de Kanto. Si quieres, te digo su habitat más típico y su rol en la región.`;
    }
  }

  if (q.includes("legend") || q.includes("mitico") || q.includes("raro") || q.includes("es raro")) {
    return "En Kanto, Mewtwo, Mew y Articuno, Zapdos y Moltres son los más emblemáticos. Mewtwo es el más poderoso y Mew el más raro por su estatus mítico.";
  }

  const hit = findByQuestion(q) ?? (p ? CATALOG.find((c) => c.id === p.id) : undefined);
  if (hit) {
    return `${hit.nameEs} es el nº ${hit.id}. Tipo ${labelTypes(hit.types)}. En Kanto, suele aparecer en combate, evolución y análisis de equipo. Puedo explicar debilidades, fortalezas, stats o compararlo con otro Pokémon.`;
  }

  if (p) {
    return `${p.nameEs} es tipo ${labelTypes(p.types)}. ${p.description ?? "Puedo explicarte sus fortalezas, debilidades o comparación con otros Pokémon de Kanto."}`;
  }

  return "Puedo responder sobre Pokémon de Kanto: tipos, debilidades, evoluciones, estadísticas, mejores opciones o comparar rivales. Dime el nombre, número o temática.";
}
