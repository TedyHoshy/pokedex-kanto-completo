import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CATALOG, spriteUrl } from "./catalog";
import type { PokemonResult, QuizPokemon } from "./types";

export const getPokemonFn = createServerFn({ method: "GET" })
  .validator(z.object({ q: z.string().min(1).max(48) }))
  .handler(async ({ data }): Promise<PokemonResult> => {
    const { loadPokemon } = await import("./pokeapi.server");
    return loadPokemon(data.q);
  });

export const getQuizFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QuizPokemon> => {
    const id = Math.floor(Math.random() * CATALOG.length) + 1;
    const entry = CATALOG.find((p) => p.id === id) ?? CATALOG[0];
    const pool = CATALOG.filter((p) => p.id !== entry.id);
    const distractors: typeof CATALOG = [];
    while (distractors.length < 3 && pool.length > 0) {
      const i = Math.floor(Math.random() * pool.length);
      distractors.push(pool.splice(i, 1)[0]);
    }
    const mixed = [entry, ...distractors];
    for (let i = mixed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
    }
    return {
      id: entry.id,
      name: entry.name,
      nameEs: entry.nameEs,
      types: entry.types,
      sprite: spriteUrl(entry.id),
      options: mixed.map((p) => ({ id: p.id, nameEs: p.nameEs })),
    };
  },
);

const askSchema = z.object({
  mode: z.enum(["chat", "hint", "analyze"]),
  question: z.string().max(280).optional(),
  pokemon: z
    .object({
      id: z.number().int().min(1).max(151),
      nameEs: z.string(),
      types: z.array(z.string()),
      description: z.string().optional(),
      stats: z
        .array(z.object({ name: z.string(), base: z.number() }))
        .optional(),
      abilities: z.array(z.object({ nameEs: z.string() })).optional(),
    })
    .optional(),
});

export const askDexFn = createServerFn({ method: "POST" })
  .validator(askSchema)
  .handler(async ({ data }) => {
    const { askDex } = await import("./ai.server");
    return askDex(data);
  });
