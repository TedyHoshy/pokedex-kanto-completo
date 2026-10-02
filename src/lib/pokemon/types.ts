export type PokemonStat = { name: string; base: number };

export type PokemonAbility = {
  name: string;
  nameEs: string;
  hidden: boolean;
};

export type EvolutionNode = {
  id: number;
  fromId: number | null;
  name: string;
  method: string | null;
};

export type LearnableMove = {
  name: string;
  level: number;
};

export type PokemonDetail = {
  id: number;
  name: string;
  nameEs: string;
  types: string[];
  height: number | null;
  weight: number | null;
  baseExperience: number | null;
  captureRate: number | null;
  habitat: string | null;
  color: string | null;
  legendary: boolean;
  mythical: boolean;
  description: string;
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  moves: string[];
  learnableMoves: LearnableMove[];
  sprite: string;
  artwork: string;
  model3d: string;
  model3dShiny: string;
  animated: string | null;
  cry: string;
  evolution: EvolutionNode[][];
};

export type PokemonResult =
  | { ok: true; data: PokemonDetail }
  | { ok: false; error: string };

export type QuizPokemon = {
  id: number;
  name: string;
  nameEs: string;
  types: string[];
  sprite: string;
  options: { id: number; nameEs: string }[];
};

export type DexContext = {
  id: number;
  nameEs: string;
  types: string[];
  description?: string;
  stats?: { name: string; base: number }[];
  abilities?: { nameEs: string }[];
};

export type AskDexInput = {
  mode: "chat" | "hint" | "analyze";
  question?: string;
  pokemon?: DexContext;
};
