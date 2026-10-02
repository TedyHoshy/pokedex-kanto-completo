import { artworkUrl, CATALOG, cryUrl, spriteUrl } from "./catalog";
import type { PokemonDetail, QuizPokemon } from "./types";

const DETAIL_PREFIX = "pokedex-kanto:offline-detail:";

export function saveOfflinePokemon(pokemon: PokemonDetail) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${DETAIL_PREFIX}${pokemon.id}`, JSON.stringify(pokemon));
  } catch {
    return;
  }
}

export function getOfflinePokemon(id: number): PokemonDetail | null {
  const entry = CATALOG.find((pokemon) => pokemon.id === id);
  if (!entry) return null;

  if (typeof window !== "undefined") {
    try {
      const saved = window.localStorage.getItem(`${DETAIL_PREFIX}${id}`);
      if (saved) {
        const parsed = JSON.parse(saved) as PokemonDetail;
        if (parsed.id === id) return parsed;
      }
    } catch {
      window.localStorage.removeItem(`${DETAIL_PREFIX}${id}`);
    }
  }

  const artwork = artworkUrl(id);
  return {
    id,
    name: entry.name,
    nameEs: entry.nameEs,
    types: entry.types,
    height: null,
    weight: null,
    baseExperience: null,
    captureRate: null,
    habitat: null,
    color: null,
    legendary: false,
    mythical: false,
    description: "Ficha básica del catálogo local. Conéctate para cargar los datos completos.",
    stats: [],
    abilities: [],
    moves: [],
    learnableMoves: [
      { name: "tackle", level: 1 },
      { name: "growl", level: 1 },
      { name: "quick-attack", level: 5 },
      { name: "body-slam", level: 5 },
    ],
    sprite: spriteUrl(id),
    artwork,
    model3d: artwork,
    model3dShiny: artwork,
    animated: null,
    cry: cryUrl(id),
    evolution: [],
  };
}

export function getLocalQuiz(): QuizPokemon {
  const entry = CATALOG[Math.floor(Math.random() * CATALOG.length)];
  const pool = CATALOG.filter((pokemon) => pokemon.id !== entry.id);
  const choices = [entry];
  while (choices.length < 4 && pool.length > 0) {
    choices.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  for (let index = choices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [choices[index], choices[swapIndex]] = [choices[swapIndex], choices[index]];
  }
  return {
    id: entry.id,
    name: entry.name,
    nameEs: entry.nameEs,
    types: entry.types,
    sprite: spriteUrl(entry.id),
    options: choices.map(({ id, nameEs }) => ({ id, nameEs })),
  };
}
