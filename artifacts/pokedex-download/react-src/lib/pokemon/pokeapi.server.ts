import { artworkUrl, cryUrl, MAX_DEX, RANGE_ERROR, spriteUrl, animatedGifUrl } from "./catalog";
import type {
  EvolutionNode,
  PokemonAbility,
  PokemonDetail,
  PokemonResult,
  QuizPokemon,
} from "./types";

const BASE = "https://pokeapi.co/api/v2";
const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 1000 * 60 * 30;

function fromCache<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL) {
    cache.delete(key);
    return null;
  }
  return hit.data as T;
}

function toCache<T>(key: string, data: T): T {
  cache.set(key, { at: Date.now(), data });
  return data;
}

async function pokeFetch<T>(path: string): Promise<T> {
  const key = `get:${path}`;
  const cached = fromCache<T>(key);
  if (cached) return cached;
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const err = new Error(`PokeAPI ${res.status}`);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }
  const json = (await res.json()) as T;
  return toCache(key, json);
}

function idFromUrl(url: string): number {
  const parts = url.split("/").filter(Boolean);
  return Number(parts[parts.length - 1]);
}

function pickName(
  names: { name: string; language: { name: string } }[],
  fallback: string,
) {
  return names.find((n) => n.language.name === "es")?.name ?? fallback;
}

function formatMethod(details: Array<Record<string, unknown>> | undefined) {
  const d = details?.[0];
  if (!d) return null;
  const trigger = (d.trigger as { name?: string } | null)?.name;
  const minLevel = d.min_level as number | null;
  const item = (d.item as { name?: string } | null)?.name;
  const held = (d.held_item as { name?: string } | null)?.name;
  const happiness = d.min_happiness as number | null;
  const time = d.time_of_day as string | null;
  if (minLevel) return `Nv. ${minLevel}`;
  if (item) return item.replace(/-/g, " ");
  if (trigger === "trade") return held ? `Intercambio (${held})` : "Intercambio";
  if (happiness) return "Amistad";
  if (time) return time;
  if (trigger === "use-item") return "Objeto";
  if (trigger) return trigger.replace(/-/g, " ");
  return null;
}

type ChainLink = {
  species: { name: string; url: string };
  evolution_details: Array<Record<string, unknown>>;
  evolves_to: ChainLink[];
};

function flattenChain(root: ChainLink): EvolutionNode[][] {
  const stages: EvolutionNode[][] = [];

  function walk(node: ChainLink, method: string | null, depth: number, parentInRange: boolean) {
    const id = idFromUrl(node.species.url);
    const inRange = id >= 1 && id <= MAX_DEX;
    const nextDepth = inRange ? depth + 1 : depth;
    if (inRange) {
      if (!stages[depth]) stages[depth] = [];
      if (!stages[depth].some((n) => n.id === id)) {
        stages[depth].push({
          id,
          name: node.species.name,
          method: parentInRange ? method : null,
        });
      }
    }
    for (const child of node.evolves_to) {
      walk(child, formatMethod(child.evolution_details), nextDepth, inRange);
    }
  }

  walk(root, null, 0, false);
  return stages.filter((s) => s && s.length > 0);
}

const STAT_ORDER = [
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
];

type PokeJson = {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number | null;
  types: { slot: number; type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { ability: { name: string; url: string }; is_hidden: boolean }[];
  moves: {
    move: { name: string };
    version_group_details: { version_group: { name: string } }[];
  }[];
  sprites: {
    front_default: string | null;
    other?: { "official-artwork"?: { front_default: string | null } };
    versions?: {
      "generation-v"?: {
        "black-white"?: { animated?: { front_default: string | null } };
      };
    };
  };
};

type SpeciesJson = {
  names: { name: string; language: { name: string } }[];
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
  }[];
  is_legendary: boolean;
  is_mythical: boolean;
  capture_rate: number;
  habitat: { name: string } | null;
  color: { name: string } | null;
  evolution_chain: { url: string };
};

export async function loadPokemon(query: string): Promise<PokemonResult> {
  const q = query.trim().toLowerCase();
  if (!q) return { ok: false, error: "Escribe un número (1-151) o un nombre." };

  if (/^\d+$/.test(q)) {
    const n = Number(q);
    if (n < 1 || n > MAX_DEX) {
      return {
        ok: false,
        error: RANGE_ERROR,
      };
    }
  }

  let data: PokeJson;
  try {
    data = await pokeFetch<PokeJson>(`/pokemon/${q}`);
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status === 404) {
      return {
        ok: false,
        error: `No hay ningún Pokémon llamado «${q}» en la Generación 1.`,
      };
    }
    return { ok: false, error: "No se pudo consultar PokeAPI. Inténtalo de nuevo." };
  }

  if (data.id > MAX_DEX) {
    return {
      ok: false,
      error: RANGE_ERROR,
    };
  }
  if (data.id < 1) {
    return { ok: false, error: RANGE_ERROR };
  }

  const species = await pokeFetch<SpeciesJson>(`/pokemon-species/${data.id}`);
  const evoId = idFromUrl(species.evolution_chain.url);
  const evo = await pokeFetch<{ chain: ChainLink }>(`/evolution-chain/${evoId}`);

  const abilityPayloads = await Promise.all(
    data.abilities.map(async (a) => {
      try {
        const ability = await pokeFetch<{
          names: { name: string; language: { name: string } }[];
        }>(`/ability/${a.ability.name}`);
        return {
          name: a.ability.name,
          nameEs: pickName(ability.names, a.ability.name),
          hidden: a.is_hidden,
        } satisfies PokemonAbility;
      } catch {
        return {
          name: a.ability.name,
          nameEs: a.ability.name,
          hidden: a.is_hidden,
        } satisfies PokemonAbility;
      }
    }),
  );

  const flavor =
    species.flavor_text_entries.find((f) => f.language.name === "es") ??
    species.flavor_text_entries.find((f) => f.language.name === "en");

  const gen1Moves = data.moves
    .filter((m) =>
      m.version_group_details.some(
        (v) =>
          v.version_group.name === "red-blue" ||
          v.version_group.name === "yellow",
      ),
    )
    .map((m) => m.move.name)
    .slice(0, 16);

  const stats = [...data.stats]
    .sort(
      (a, b) =>
        STAT_ORDER.indexOf(a.stat.name) - STAT_ORDER.indexOf(b.stat.name),
    )
    .map((s) => ({ name: s.stat.name, base: s.base_stat }));

  const detail: PokemonDetail = {
    id: data.id,
    name: data.name,
    nameEs: pickName(species.names, data.name),
    types: data.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    height: data.height / 10,
    weight: data.weight / 10,
    baseExperience: data.base_experience,
    captureRate: species.capture_rate,
    habitat: species.habitat?.name ?? null,
    color: species.color?.name ?? null,
    legendary: species.is_legendary,
    mythical: species.is_mythical,
    description: (flavor?.flavor_text ?? "Sin descripción.")
      .replace(/[\f\n\r]/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
    stats,
    abilities: abilityPayloads,
    moves: gen1Moves,
    sprite: data.sprites.front_default ?? spriteUrl(data.id),
    artwork:
      data.sprites.other?.["official-artwork"]?.front_default ??
      artworkUrl(data.id),
    animated:
      data.sprites.versions?.["generation-v"]?.["black-white"]?.animated
        ?.front_default ?? animatedGifUrl(data.id),
    cry: cryUrl(data.id),
    evolution: flattenChain(evo.chain),
  };

  return { ok: true, data: detail };
}

export function randomQuiz(): QuizPokemon {
  const id = Math.floor(Math.random() * MAX_DEX) + 1;
  return {
    id,
    name: "",
    nameEs: "",
    sprite: artworkUrl(id),
    options: [],
  };
}
