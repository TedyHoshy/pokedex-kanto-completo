import type { AskDexInput } from "./types";
import { localAsk } from "./local-ai";

export type { AskDexInput };

const analyzeCache = new Map<number, string>();

function systemFor(mode: AskDexInput["mode"]) {
  const base =
    "Eres el módulo de IA de una Pokédex de la primera generación (solo Pokémon 001 a 151 de Kanto). " +
    "Hablas español, tono de dispositivo clásico: claro, breve y útil. Máximo 120 palabras. " +
    "Responde cualquier pregunta útil sobre Kanto: tipos, debilidades, evoluciones, estadísticas, comparativas, recomendaciones de equipo y curiosidades. " +
    "Si preguntan por un Pokémon posterior al 151, recuerdas el límite de esta Pokédex. " +
    "No inventes datos. No uses emojis. " +
    "Si el usuario pregunta por algo fuera de Kanto, redirige a la Pokédex de Kanto y aclara el límite.";
  if (mode === "hint") {
    return (
      base +
      " El usuario está jugando al modo sombra. Da UNA sola pista clara, breve y útil: tipo + forma + rasgo visual muy concreto. " +
      "Nunca digas el nombre, el número ni la evolución completa. Máximo 25 palabras."
    );
  }
  if (mode === "analyze") {
    return (
      base +
      " Resume al Pokémon como una ficha de combate: rol, punto fuerte, punto débil y un consejo Gen 1."
    );
  }
  return base + " Responde la pregunta sobre Kanto. Si hay ficha en contexto, úsala.";
}

export async function askDex(
  input: AskDexInput,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return { ok: true, text: localAsk(input) };
  }

  if (input.mode === "analyze" && input.pokemon?.id) {
    const hit = analyzeCache.get(input.pokemon.id);
    if (hit) return { ok: true, text: hit };
  }

  const userBits: string[] = [];
  if (input.pokemon) {
    const p = input.pokemon;
    userBits.push(
      `Ficha: nº ${p.id} ${p.nameEs}. Tipos: ${p.types.join(", ")}.`,
    );
    if (p.description) userBits.push(`Pokédex: ${p.description}`);
    if (p.abilities?.length) {
      userBits.push(`Habilidades: ${p.abilities.map((a) => a.nameEs).join(", ")}`);
    }
    if (p.stats?.length) {
      userBits.push(
        `Stats: ${p.stats.map((s) => `${s.name} ${s.base}`).join(", ")}`,
      );
    }
  }
  if (input.mode === "hint") {
    userBits.push("Pide una pista para adivinar la silueta.");
  } else if (input.mode === "analyze") {
    userBits.push("Analiza este Pokémon para un entrenador de Kanto.");
  } else {
    userBits.push(input.question?.trim() || "Explícame este Pokémon.");
  }

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      max_tokens: 220,
      temperature: 0.6,
      messages: [
        { role: "system", content: systemFor(input.mode) },
        { role: "user", content: userBits.join("\n") },
      ],
    }),
  });

  if (!res.ok) {
    return { ok: true, text: localAsk(input) };
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) return { ok: true, text: localAsk(input) };

  if (input.mode === "analyze" && input.pokemon?.id) {
    analyzeCache.set(input.pokemon.id, text);
  }
  return { ok: true, text };
}
