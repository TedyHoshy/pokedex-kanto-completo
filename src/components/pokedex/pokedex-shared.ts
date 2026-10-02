import { getOfflinePokemon, saveOfflinePokemon } from "@/lib/pokemon/offline";

export const PARTY_LIMIT = 6;

export async function loadPokemonForMode(id: number, offlineMode: boolean) {
  const local = getOfflinePokemon(id);
  if (offlineMode) {
    if (local) return local;
    throw new Error("Este Pokémon no está en el catálogo local.");
  }

  try {
    const { getPokemonFn } = await import("@/lib/pokemon/fns");
    const result = await getPokemonFn({ data: { q: String(id) } });
    if (!result.ok) throw new Error(result.error);
    saveOfflinePokemon(result.data);
    return result.data;
  } catch (error) {
    if (local) return local;
    throw error;
  }
}

export const STAT_LABEL: Record<string, string> = {
  hp: "PS",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. Esp.",
  "special-defense": "Def. Esp.",
  speed: "Velocidad",
};

export const TYPE_ACCENTS: Record<string, { from: string; to: string; glow: string }> = {
  normal: { from: "#d7d4af", to: "#a8a97b", glow: "rgba(255,255,255,0.42)" },
  fire: { from: "#fca65d", to: "#e75932", glow: "rgba(255,184,92,0.46)" },
  water: { from: "#7ec5ff", to: "#4d7ef5", glow: "rgba(133,214,255,0.45)" },
  grass: { from: "#9ee88a", to: "#4bb76b", glow: "rgba(166,255,170,0.44)" },
  electric: { from: "#f9ec7a", to: "#e2b63a", glow: "rgba(255,246,157,0.44)" },
  ice: { from: "#b5f1ff", to: "#6ecfe8", glow: "rgba(217,248,255,0.48)" },
  fighting: { from: "#ef6c63", to: "#9a2c2c", glow: "rgba(255,172,166,0.42)" },
  poison: { from: "#cb88e7", to: "#7c47b8", glow: "rgba(200,170,255,0.42)" },
  ground: { from: "#e7c66a", to: "#b98d2a", glow: "rgba(247,220,145,0.42)" },
  flying: { from: "#b5c5ff", to: "#7a86df", glow: "rgba(210,218,255,0.42)" },
  psychic: { from: "#fbb0d3", to: "#de4f86", glow: "rgba(255,196,224,0.42)" },
  bug: { from: "#c8d76b", to: "#7ea423", glow: "rgba(210,235,126,0.45)" },
  rock: { from: "#d5b870", to: "#9d7b2d", glow: "rgba(236,209,122,0.42)" },
  ghost: { from: "#a48ad5", to: "#56407f", glow: "rgba(208,186,255,0.42)" },
  dragon: { from: "#8d7cf7", to: "#4d39be", glow: "rgba(175,160,255,0.42)" },
  dark: { from: "#8f7367", to: "#47372f", glow: "rgba(163,143,136,0.4)" },
  steel: { from: "#d3d9e7", to: "#7d8da6", glow: "rgba(224,232,244,0.42)" },
  fairy: { from: "#f5bfd9", to: "#dd7fb1", glow: "rgba(255,215,236,0.4)" },
};
