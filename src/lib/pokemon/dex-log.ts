import { useCallback } from "react";

import { usePersistentState } from "./storage";

const KEY = "pokedex-gen1-log";

type Log = { seen: number[]; caught: number[] };

const EMPTY_LOG: Log = { seen: [], caught: [] };

function parseLog(raw: string): Log {
  const parsed = JSON.parse(raw) as Partial<Log>;
  const seen = Array.isArray(parsed.seen)
    ? parsed.seen.filter((n): n is number => typeof n === "number")
    : [];
  const caught = Array.isArray(parsed.caught)
    ? parsed.caught.filter((n): n is number => typeof n === "number")
    : [];

  return { seen, caught };
}

function uniq(ids: number[]) {
  return [...new Set(ids)];
}

export function useDexLog() {
  const [log, setLog] = usePersistentState<Log>(KEY, EMPTY_LOG, {
    parse: (raw) => {
      try {
        return parseLog(raw);
      } catch {
        return EMPTY_LOG;
      }
    },
    serialize: JSON.stringify,
  });

  const markSeen = useCallback((id: number) => {
    setLog((prev) => {
      if (prev.seen.includes(id)) return prev;
      return { ...prev, seen: uniq([...prev.seen, id]) };
    });
  }, [setLog]);

  /** Marca todos los Pokémon de la Pokédex (1–151) como vistos. */
  const revealAll = useCallback(() => {
    setLog((prev) => {
      const allIds = Array.from({ length: 151 }, (_, i) => i + 1);
      return { ...prev, seen: uniq([...prev.seen, ...allIds]) };
    });
  }, [setLog]);

  const toggleCaught = useCallback((id: number) => {
    setLog((prev) => {
      const has = prev.caught.includes(id);
      const caught = has
        ? prev.caught.filter((x) => x !== id)
        : uniq([...prev.caught, id]);
      const seen = has ? prev.seen : uniq([...prev.seen, id]);
      return { seen, caught };
    });
  }, [setLog]);

  const isSeen = useCallback((id: number) => log.seen.includes(id), [log.seen]);
  const isCaught = useCallback(
    (id: number) => log.caught.includes(id),
    [log.caught],
  );

  return {
    isLoaded: true,
    seenCount: log.seen.length,
    caughtCount: log.caught.length,
    markSeen,
    revealAll,
    toggleCaught,
    isSeen,
    isCaught,
  };
}

export type StatusFilter = "all" | "seen" | "caught" | "missing";
