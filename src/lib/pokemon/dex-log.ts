import { useCallback, useEffect, useState } from "react";

const KEY = "pokedex-gen1-log";

type Log = { seen: number[]; caught: number[] };

function read(): Log {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { seen: [], caught: [] };
    const parsed = JSON.parse(raw) as Partial<Log>;
    const seen = Array.isArray(parsed.seen)
      ? parsed.seen.filter((n): n is number => typeof n === "number")
      : [];
    const caught = Array.isArray(parsed.caught)
      ? parsed.caught.filter((n): n is number => typeof n === "number")
      : [];
    return { seen, caught };
  } catch {
    return { seen: [], caught: [] };
  }
}

function write(log: Log) {
  localStorage.setItem(KEY, JSON.stringify(log));
}

function uniq(ids: number[]) {
  return [...new Set(ids)];
}

export function useDexLog() {
  const [log, setLog] = useState<Log>({ seen: [], caught: [] });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setLog(read());
    setIsLoaded(true);
  }, []);

  const markSeen = useCallback((id: number) => {
    setLog((prev) => {
      if (prev.seen.includes(id)) return prev;
      const next = { ...prev, seen: uniq([...prev.seen, id]) };
      write(next);
      return next;
    });
  }, []);

  /** Marca todos los Pokémon de la Pokédex (1–151) como vistos. */
  const revealAll = useCallback(() => {
    setLog((prev) => {
      const allIds = Array.from({ length: 151 }, (_, i) => i + 1);
      const next = { ...prev, seen: uniq([...prev.seen, ...allIds]) };
      write(next);
      return next;
    });
  }, []);

  const toggleCaught = useCallback((id: number) => {
    setLog((prev) => {
      const has = prev.caught.includes(id);
      const caught = has
        ? prev.caught.filter((x) => x !== id)
        : uniq([...prev.caught, id]);
      const seen = has ? prev.seen : uniq([...prev.seen, id]);
      const next = { seen, caught };
      write(next);
      return next;
    });
  }, []);

  const isSeen = useCallback((id: number) => log.seen.includes(id), [log.seen]);
  const isCaught = useCallback(
    (id: number) => log.caught.includes(id),
    [log.caught],
  );

  return {
    isLoaded,
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
