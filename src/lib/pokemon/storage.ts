import { useCallback, useState } from "react";

export function readStoredValue<T>(
  key: string,
  fallback: T,
  parse: (raw: string) => T,
): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStoredValue<T>(key: string, value: T, serialize: (value: T) => string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, serialize(value));
  } catch {
    // Ignore storage quota or privacy restrictions.
  }
}

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  options?: {
    parse?: (raw: string) => T;
    serialize?: (value: T) => string;
  },
) {
  const parse = options?.parse ?? ((raw: string) => JSON.parse(raw) as T);
  const serialize = options?.serialize ?? JSON.stringify;

  const [value, setValue] = useState<T>(() => readStoredValue(key, initialValue, parse));

  const updateValue = useCallback(
    (nextValue: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved = typeof nextValue === "function"
          ? (nextValue as (current: T) => T)(current)
          : nextValue;

        writeStoredValue(key, resolved, serialize);
        return resolved;
      });
    },
    [key, serialize],
  );

  return [value, updateValue] as const;
}
