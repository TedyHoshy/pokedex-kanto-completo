import { useCallback } from "react";

import { usePersistentState } from "./storage";

const KEY = "pokedex-gen1-favorites";

function parseFavorites(raw: string): number[] {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((n): n is number => typeof n === "number");
}

export function useFavorites() {
  const [ids, setIds] = usePersistentState<number[]>(KEY, [], {
    parse: (raw) => {
      try {
        return parseFavorites(raw);
      } catch {
        return [];
      }
    },
    serialize: JSON.stringify,
  });

  const toggle = useCallback((id: number) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, [setIds]);

  const has = useCallback((id: number) => ids.includes(id), [ids]);

  return { ids, toggle, has };
}
