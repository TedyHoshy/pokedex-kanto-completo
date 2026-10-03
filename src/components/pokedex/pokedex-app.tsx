import { TypeBadge } from "@/components/pokedex/type-badge";
import {
  CATALOG,
  FILTER_TYPES,
  findInCatalog,
  MAX_DEX,
  RANGE_ERROR,
  spriteUrl,
  suggestCatalog,
  TYPE_CLASS,
  TYPE_LABELS,
} from "@/lib/pokemon/catalog";
import { useFavorites } from "@/lib/pokemon/favorites";
import { useDexLog, type StatusFilter } from "@/lib/pokemon/dex-log";
import { defenseMatchup, formatMult } from "@/lib/pokemon/matchup";
import { getPokemonFn, getQuizFn, askDexFn } from "@/lib/pokemon/fns";
import {
  isMuted,
  loadMutePref,
  playBoot,
  playClick,
  playCorrectSfx,
  playCry,
  playDexOpen,
  playQuizLoop,
  playWhoIsThat,
  playWrongSfx,
  setMuted,
  stopLoop,
  unlockAudio,
} from "@/lib/pokemon/sfx";
import { speakDex, stopSpeak, warmupVoices } from "@/lib/pokemon/voice";
import type { PokemonDetail, QuizPokemon } from "@/lib/pokemon/types";
import { cn, padDex, titleCase } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronRight,
  Bot,
  Search,
  Star,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

type Tab = "list" | "detail" | "quiz" | "ai" | "compare";

const STAT_LABEL: Record<string, string> = {
  hp: "PS",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. Esp.",
  "special-defense": "Def. Esp.",
  speed: "Velocidad",
};

export function PokedexApp() {
  const [powered, setPowered] = useState(false);
  const [muted, setMutedUi] = useState(false);
  const [tab, setTab] = useState<Tab>("list");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [vsLeft, setVsLeft] = useState<number | null>(null);
  const [vsRight, setVsRight] = useState<number | null>(null);
  const fav = useFavorites();
  const log = useDexLog();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMutedUi(loadMutePref());
    warmupVoices();
  }, []);

  const suggestions = useMemo(() => suggestCatalog(query), [query]);

  const visible = useMemo(() => {
    return CATALOG.filter((p) => {
      if (onlyFavs && !fav.has(p.id)) return false;
      if (typeFilter && !p.types.includes(typeFilter)) return false;
      if (statusFilter === "seen" && !log.isSeen(p.id)) return false;
      if (statusFilter === "caught" && !log.isCaught(p.id)) return false;
      if (statusFilter === "missing" && log.isSeen(p.id)) return false;
      return true;
    });
  }, [onlyFavs, typeFilter, statusFilter, fav, log]);

  useEffect(() => {
    setCursor(0);
  }, [typeFilter, onlyFavs, statusFilter]);

  const lcdName =
    selectedId != null
      ? CATALOG.find((p) => p.id === selectedId)?.nameEs ?? ""
      : "";

  function openPokemon(id: number) {
    setError(null);
    setSelectedId(id);
    log.markSeen(id);
    setTab("detail");
    setSuggestOpen(false);
    playClick();
  }

  function openCompare(left: number, right?: number) {
    log.markSeen(left);
    setVsLeft(left);
    setVsRight(right ?? null);
    setSelectedId(left);
    playClick();
    stopLoop();
    setTab("compare");
  }

  function goTab(next: Tab) {
    playClick();
    if (next !== "quiz") stopLoop();
    setTab(next);
  }

  function runSearch(raw: string) {
    const q = raw.trim();
    if (!q) {
      setError("Escribe un número (1–151) o un nombre.");
      return;
    }
    if (/^\d+$/.test(q)) {
      const n = Number(q);
      if (n < 1 || n > MAX_DEX) {
        setError(RANGE_ERROR);
        return;
      }
    }
    const hit = findInCatalog(q);
    if (hit) {
      setQuery(hit.nameEs);
      openPokemon(hit.id);
      return;
    }
    setTab("detail");
    setSelectedId(null);
    void lookupUnknown(q);
  }

  async function lookupUnknown(q: string) {
    setError(null);
    const res = await getPokemonFn({ data: { q } });
    if (!res.ok) {
      setError(res.error);
      setTab("list");
      return;
    }
    openPokemon(res.data.id);
  }

  function powerOn() {
    void unlockAudio();
    playBoot();
    speakDex("Pokédex de Kanto lista. Ciento cincuenta y un Pokémon.");
    log.revealAll();
    setPowered(true);
  }

  function toggleMute() {
    const next = !isMuted();
    setMuted(next);
    setMutedUi(next);
  }

  function stepDex(delta: number) {
    if (!powered) return;
    const base = selectedId ?? visible[cursor]?.id ?? 1;
    const next = Math.min(MAX_DEX, Math.max(1, base + delta));
    openPokemon(next);
  }

  function movePad(dir: "up" | "down" | "left" | "right") {
    if (!powered) return;
    playClick();
    if (tab !== "list") {
      if (dir === "left") stepDex(-1);
      if (dir === "right") stepDex(1);
      if (dir === "up") setTab("list");
      if (dir === "down") setTab("quiz");
      return;
    }
    const cols = 3;
    let i = cursor;
    if (dir === "left") i -= 1;
    if (dir === "right") i += 1;
    if (dir === "up") i -= cols;
    if (dir === "down") i += cols;
    if (i >= 0 && i < visible.length) setCursor(i);
  }

  function confirmPad() {
    playClick();
    if (!powered) {
      powerOn();
      return;
    }
    if (tab === "list" && visible[cursor]) openPokemon(visible[cursor].id);
    else setTab("list");
  }

  function powerOff() {
    stopLoop();
    stopSpeak();
    setPowered(false);
  }

  return (
    <div className="dex-stage">
      <div className="w-full max-w-[920px]">
        <div className="dex-unit">
          <section className="dex-panel dex-left">
            <div className="dex-left-head">
              <button
                type="button"
                className={cn("dex-lens", powered && "lens-pulse")}
                aria-label={powered ? "Pokédex encendida" : "Encender"}
                onClick={() => {
                  if (!powered) powerOn();
                }}
              />
              <div className="dex-leds" aria-hidden>
                <span className="dex-led dex-led-r" />
                <span className="dex-led dex-led-y" />
                <span className="dex-led dex-led-g" />
              </div>
            </div>
            <div className="dex-bezel">
              <div className="dex-bezel-dots" aria-hidden>
                <span className="dex-bezel-dot" />
                <span className="dex-bezel-dot" />
              </div>
              <div className="dex-bezel-inner">
                <div className="dex-screen dex-screen-scroll screen-in p-3 text-pk-ink">
                  {!powered ? (
                    <BootScreen onPower={powerOn} />
                  ) : (
                    <>
                      {tab === "list" && (
                        <ListView
                          query={query}
                          setQuery={setQuery}
                          error={error}
                          suggestions={suggestions}
                          suggestOpen={suggestOpen}
                          setSuggestOpen={setSuggestOpen}
                          searchRef={searchRef}
                          onSearch={runSearch}
                          onPick={openPokemon}
                          typeFilter={typeFilter}
                          setTypeFilter={setTypeFilter}
                          onlyFavs={onlyFavs}
                          setOnlyFavs={setOnlyFavs}
                          statusFilter={statusFilter}
                          setStatusFilter={setStatusFilter}
                          visible={visible}
                          fav={fav}
                          log={log}
                          cursor={cursor}
                        />
                      )}
                      {tab === "detail" && (
                        <DetailView
                          selectedId={selectedId}
                          onBack={() => setTab("list")}
                          onOpen={openPokemon}
                          onCompare={(id) => openCompare(id)}
                          fav={fav}
                          log={log}
                        />
                      )}
                      {tab === "quiz" && <QuizView onOpen={openPokemon} />}
                      {tab === "ai" && <AiView selectedId={selectedId} />}
                      {tab === "compare" && (
                        <CompareView
                          leftId={vsLeft}
                          rightId={vsRight}
                          setLeftId={setVsLeft}
                          setRightId={setVsRight}
                          onOpen={openPokemon}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="dex-left-foot">
              <button
                type="button"
                className="dex-green btn-press"
                aria-label="Confirmar"
                onClick={confirmPad}
              />
              <div className="dex-dpad" aria-label="Cruz de dirección">
                <span className="dex-dpad-arm dex-dpad-ud" />
                <span className="dex-dpad-arm dex-dpad-lr" />
                <button
                  type="button"
                  className="dex-dpad-btn up"
                  aria-label="Arriba"
                  onClick={() => movePad("up")}
                />
                <button
                  type="button"
                  className="dex-dpad-btn down"
                  aria-label="Abajo"
                  onClick={() => movePad("down")}
                />
                <button
                  type="button"
                  className="dex-dpad-btn left"
                  aria-label="Izquierda"
                  onClick={() => movePad("left")}
                />
                <button
                  type="button"
                  className="dex-dpad-btn right"
                  aria-label="Derecha"
                  onClick={() => movePad("right")}
                />
              </div>
            </div>
          </section>

          <div className="dex-hinge" aria-hidden />

          <section className="dex-panel dex-right">
            <div className="dex-lcd" aria-live="polite">
              <span>
                {powered
                  ? selectedId
                    ? `Nº ${padDex(selectedId)}`
                    : "KANTO · 151"
                  : "OFF"}
              </span>
              <span>
                {powered ? lcdName || tabLabel(tab) : "Pulsa el botón verde"}
              </span>
            </div>
            <div className="dex-blue-pad">
              {(
                [
                  ["list", "LISTA"],
                  ["detail", "FICHA"],
                  ["quiz", "SOMBRA"],
                  ["ai", "IA"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={cn("btn-press", tab === id && powered && "is-on")}
                  onClick={() => {
                    if (!powered) {
                      powerOn();
                      return;
                    }
                    goTab(id);
                  }}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                className="btn-press"
                onClick={() => {
                  if (selectedId) {
                    playCry(
                      `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${selectedId}.ogg`,
                    );
                  }
                }}
              >
                GRITO
              </button>
              <button
                type="button"
                className="btn-press"
                onClick={() => {
                  if (selectedId) fav.toggle(selectedId);
                }}
              >
                FAV
              </button>
              <button
                type="button"
                className="btn-press"
                onClick={() => {
                  if (!powered) {
                    powerOn();
                    return;
                  }
                  openPokemon(Math.floor(Math.random() * MAX_DEX) + 1);
                }}
              >
                DADO
              </button>
              <button type="button" className="btn-press" onClick={toggleMute}>
                {muted ? "MUTE" : "SONIDO"}
              </button>
            </div>
            <div className="dex-right-mid">
              <div className="dex-white-pair">
                <button
                  type="button"
                  className="dex-white-key btn-press"
                  aria-label="Anterior"
                  onClick={() => stepDex(-1)}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="dex-white-key btn-press"
                  aria-label="Siguiente"
                  onClick={() => stepDex(1)}
                >
                  Next
                </button>
              </div>
              <button
                type="button"
                className="dex-yellow btn-press"
                aria-label={powered ? "Apagar" : "Encender"}
                onClick={() => (powered ? powerOff() : powerOn())}
              />
            </div>
            <div className="dex-black-row">
              <button
                type="button"
                className="dex-black-key btn-press"
                onClick={() => {
                  if (!powered) {
                    powerOn();
                    return;
                  }
                  openCompare(selectedId ?? visible[cursor]?.id ?? 1);
                }}
              >
                VS
              </button>
              <button
                type="button"
                className="dex-black-key btn-press"
                onClick={() => (powered ? goTab("ai") : powerOn())}
              >
                PROF. DEX
              </button>
            </div>
          </section>
        </div>
        <p className="dex-caption">Pokédex de Kanto · 151 · Gen 1</p>
      </div>
    </div>
  );
}

function tabLabel(tab: Tab) {
  if (tab === "quiz") return "¿Quién es ese?";
  if (tab === "ai") return "Profesor Dex";
  if (tab === "detail") return "Ficha";
  if (tab === "compare") return "Comparar";
  return "Índice";
}

function ListView(props: {
  query: string;
  setQuery: (v: string) => void;
  error: string | null;
  suggestions: typeof CATALOG;
  suggestOpen: boolean;
  setSuggestOpen: (v: boolean) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  onSearch: (q: string) => void;
  onPick: (id: number) => void;
  typeFilter: string | null;
  setTypeFilter: (v: string | null) => void;
  onlyFavs: boolean;
  setOnlyFavs: (v: boolean) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  visible: typeof CATALOG;
  fav: ReturnType<typeof useFavorites>;
  log: ReturnType<typeof useDexLog>;
  cursor: number;
}) {
  const seenPct = Math.round((props.log.seenCount / MAX_DEX) * 100);
  const caughtPct = Math.round((props.log.caughtCount / MAX_DEX) * 100);

  return (
    <div>
      <div className="mb-3 flex items-end justify-between border-b-2 border-pk-muted pb-2">
        <h1 className="font-display text-[11px] leading-relaxed text-pk-ink">
          POKEDEX
        </h1>
        <span className="rounded-sm bg-pk-ink px-2 py-1 font-body text-sm text-pk-screen">
          GEN 1 · 151
        </span>
      </div>

      <div className="mb-3 space-y-1 rounded-md border-2 border-pk-muted bg-pk-panel px-2 py-2">
        <p className="font-body text-base">
          Vistos {props.log.seenCount}/{MAX_DEX} · Capturados{" "}
          {props.log.caughtCount}/{MAX_DEX}
        </p>
        <div className="h-2 overflow-hidden rounded-sm bg-pk-muted">
          <div className="h-full bg-ok" style={{ width: `${seenPct}%` }} />
        </div>
        <div className="h-2 overflow-hidden rounded-sm bg-pk-muted">
          <div
            className="h-full bg-pk-red"
            style={{ width: `${caughtPct}%` }}
          />
        </div>
      </div>

      <div className="relative mb-2">
        <div className="flex gap-1">
          <label className="sr-only" htmlFor="dex-search">
            Buscar Pokémon
          </label>
          <input
            id="dex-search"
            ref={props.searchRef}
            value={props.query}
            onChange={(e) => {
              props.setQuery(e.target.value);
              props.setSuggestOpen(true);
            }}
            onFocus={() => props.setSuggestOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                props.onSearch(props.query);
              }
              if (e.key === "Escape") props.setSuggestOpen(false);
            }}
            placeholder="Nº o nombre…"
            className="h-11 min-h-11 flex-1 rounded-md border-2 border-pk-muted bg-pk-panel px-3 font-body text-xl text-pk-ink outline-none placeholder:text-pk-muted focus:border-pk-ink"
            autoComplete="off"
          />
          <button
            type="button"
            aria-label="Buscar"
            onClick={() => props.onSearch(props.query)}
            className="inline-flex size-11 items-center justify-center rounded-md bg-pk-ink text-pk-screen"
          >
            <Search className="size-5" />
          </button>
        </div>
        {props.suggestOpen && props.suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border-2 border-pk-muted bg-pk-panel shadow-lg">
            {props.suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left font-body text-lg hover:bg-pk-screen"
                  onClick={() => {
                    props.setQuery(s.nameEs);
                    props.onPick(s.id);
                  }}
                >
                  <img
                    src={spriteUrl(s.id)}
                    alt=""
                    className="pixelated size-8"
                  />
                  <span className="text-pk-muted">#{padDex(s.id)}</span>
                  <span>{s.nameEs}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {props.error && (
        <p className="mb-2 rounded-md bg-bad px-3 py-2 font-body text-base leading-snug text-white">
          {props.error}
        </p>
      )}

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => props.setOnlyFavs(!props.onlyFavs)}
          className={cn(
            "inline-flex h-10 items-center gap-1 rounded-full px-3 font-body text-base",
            props.onlyFavs
              ? "bg-pk-ink text-pk-screen"
              : "border-2 border-pk-muted bg-pk-panel text-pk-ink",
          )}
        >
          <Star
            className="size-4"
            fill={props.onlyFavs ? "currentColor" : "none"}
          />
          Favoritos
        </button>
        {(
          [
            ["all", "Todos"],
            ["seen", "Vistos"],
            ["caught", "Capturados"],
            ["missing", "Faltan"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => props.setStatusFilter(id)}
            className={cn(
              "h-10 rounded-full px-3 font-body text-base",
              props.statusFilter === id
                ? "bg-pk-ink text-pk-screen"
                : "border-2 border-pk-muted bg-pk-panel",
            )}
          >
            {label}
          </button>
        ))}
        {props.typeFilter && (
          <button
            type="button"
            onClick={() => props.setTypeFilter(null)}
            className="font-body text-base text-pk-muted underline"
          >
            Quitar tipo
          </button>
        )}
      </div>

      <div className="-mx-1 mb-3 flex gap-1 overflow-x-auto pb-1">
        {FILTER_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() =>
              props.setTypeFilter(props.typeFilter === t ? null : t)
            }
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 font-body text-sm uppercase",
              props.typeFilter === t
                ? TYPE_CLASS[t]
                : "bg-pk-panel text-pk-muted",
            )}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {props.visible.length === 0 ? (
        <p className="py-10 text-center font-body text-xl text-pk-muted">
          No hay Pokémon con ese filtro.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {props.visible.map((p, i) => {
            const caught = props.log.isCaught(p.id);
            return (
            <div
              key={p.id}
              className={cn(
                "relative rounded-md border-2 bg-pk-panel p-1.5 text-center transition-transform duration-150 hover:scale-105",
                i === props.cursor ? "border-pk-ink" : "border-pk-muted",
              )}
            >
              <button
                type="button"
                aria-label={
                  props.fav.has(p.id)
                    ? "Quitar de favoritos"
                    : "Añadir a favoritos"
                }
                onClick={() => props.fav.toggle(p.id)}
                className="absolute right-1 top-1 z-10 text-pk-ink"
              >
                <Star
                  className="size-4"
                  fill={props.fav.has(p.id) ? "currentColor" : "none"}
                />
              </button>
              <button
                type="button"
                aria-label={caught ? "Soltar" : "Marcar capturado"}
                onClick={() => props.log.toggleCaught(p.id)}
                className={cn(
                  "absolute left-1 top-1 z-10 size-4 rounded-full border-2",
                  caught
                    ? "border-pk-ink bg-pk-red"
                    : "border-pk-muted bg-pk-panel",
                )}
              />
              <button
                type="button"
                onClick={() => props.onPick(p.id)}
                className="w-full"
              >
                <p className="font-body text-sm text-pk-muted">#{padDex(p.id)}</p>
                <img
                  src={spriteUrl(p.id)}
                  alt={p.nameEs}
                  className="pixelated mx-auto size-16"
                  loading="lazy"
                />
                <p className="truncate font-body text-base leading-tight">
                  {p.nameEs}
                </p>
              </button>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DetailView({
  selectedId,
  onBack,
  onOpen,
  onCompare,
  fav,
  log,
}: {
  selectedId: number | null;
  onBack: () => void;
  onOpen: (id: number) => void;
  onCompare: (id: number) => void;
  fav: ReturnType<typeof useFavorites>;
  log: ReturnType<typeof useDexLog>;
}) {
  const q = useQuery({
    queryKey: ["pokemon", selectedId],
    queryFn: async () => {
      const res = await getPokemonFn({ data: { q: String(selectedId) } });
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    enabled: selectedId != null,
  });

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex h-10 items-center gap-1 rounded-md bg-pk-ink px-3 font-body text-lg text-pk-screen"
      >
        <ArrowLeft className="size-4" />
        Volver
      </button>
      {selectedId == null && (
        <p className="py-8 text-center font-body text-xl text-pk-muted">
          Elige un Pokémon de la lista o búscalo.
        </p>
      )}
      {q.isLoading && (
        <p className="py-8 text-center font-body text-xl text-pk-muted">
          Consultando PokeAPI…
        </p>
      )}
      {q.isError && (
        <p className="rounded-md bg-bad px-3 py-2 font-body text-base text-white">
          {(q.error as Error).message}
        </p>
      )}
      {q.data && (
        <PokemonSheet
          p={q.data}
          isFav={fav.has(q.data.id)}
          onFav={() => fav.toggle(q.data.id)}
          caught={log.isCaught(q.data.id)}
          onCatch={() => log.toggleCaught(q.data.id)}
          onOpen={onOpen}
          onCompare={() => onCompare(q.data.id)}
        />
      )}
    </div>
  );
}

function PokemonSheet({
  p,
  isFav,
  onFav,
  caught,
  onCatch,
  onOpen,
  onCompare,
}: {
  p: PokemonDetail;
  isFav: boolean;
  onFav: () => void;
  caught: boolean;
  onCatch: () => void;
  onOpen: (id: number) => void;
  onCompare: () => void;
}) {
  const special = p.abilities.find((a) => !a.hidden) ?? p.abilities[0];
  const [mode, setMode] = useState<"anim" | "art">("anim");
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const img = mode === "anim" && p.animated ? p.animated : p.artwork;
  const typeLabel = p.types.map((t) => TYPE_LABELS[t] ?? t).join(" y ");

  useEffect(() => {
    playDexOpen();
    playCry(p.cry);
    speakDex(
      `Pokémon número ${p.id}. ${p.nameEs}. Tipo ${typeLabel}.`,
    );
    setAiNote(null);
    return () => {
      stopSpeak();
    };
  }, [p.id, p.cry, p.nameEs, typeLabel]);

  async function analyze() {
    setAiBusy(true);
    const res = await askDexFn({
      data: {
        mode: "analyze",
        pokemon: {
          id: p.id,
          nameEs: p.nameEs,
          types: p.types,
          description: p.description,
          stats: p.stats,
          abilities: p.abilities.map((a) => ({ nameEs: a.nameEs })),
        },
      },
    });
    setAiBusy(false);
    if (res.ok) {
      setAiNote(res.text);
      speakDex(res.text);
    } else {
      setAiNote(res.error);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center">
        <div className="flex size-40 items-center justify-center rounded-lg border-4 border-pk-muted bg-pk-panel">
          <img
            src={img}
            alt={p.nameEs}
            className={cn(
              "sprite-idle max-h-36 max-w-36",
              mode === "anim" && "pixelated",
            )}
          />
        </div>
        <div className="mt-2 flex gap-1">
          <button
            type="button"
            onClick={() => setMode("anim")}
            className={cn(
              "rounded-full px-3 py-1 font-body text-base",
              mode === "anim" ? "bg-pk-ink text-pk-screen" : "bg-pk-panel",
            )}
          >
            Sprite
          </button>
          <button
            type="button"
            onClick={() => setMode("art")}
            className={cn(
              "rounded-full px-3 py-1 font-body text-base",
              mode === "art" ? "bg-pk-ink text-pk-screen" : "bg-pk-panel",
            )}
          >
            Arte
          </button>
        </div>
        <p className="mt-2 font-body text-lg text-pk-muted">Nº {padDex(p.id)}</p>
        <h2 className="font-display text-[13px] leading-relaxed">{p.nameEs}</h2>
        <div className="mt-2 flex gap-1">
          {p.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            playCry(p.cry);
            speakDex(`${p.nameEs}. Tipo ${typeLabel}. ${p.description}`);
          }}
          className="btn-press inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-pk-red font-body text-lg text-pk-paper"
        >
          <Volume2 className="size-4" />
          Grito y ficha
        </button>
        <button
          type="button"
          onClick={onFav}
          className="btn-press inline-flex h-11 items-center justify-center gap-2 rounded-md border-2 border-pk-muted bg-pk-panel px-3 font-body text-lg"
        >
          <Star className="size-4" fill={isFav ? "currentColor" : "none"} />
          {isFav ? "Favorito" : "Guardar"}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCatch}
          className={cn(
            "btn-press h-11 flex-1 rounded-md font-body text-lg",
            caught
              ? "bg-pk-red text-pk-paper"
              : "border-2 border-pk-muted bg-pk-panel",
          )}
        >
          {caught ? "Capturado" : "Capturar"}
        </button>
        <button
          type="button"
          onClick={onCompare}
          className="btn-press h-11 flex-1 rounded-md border-2 border-pk-muted bg-pk-panel font-body text-lg"
        >
          Comparar
        </button>
      </div>

      <button
        type="button"
        onClick={() => void analyze()}
        disabled={aiBusy}
        className="btn-press inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-pk-ink font-body text-lg text-pk-screen disabled:opacity-60"
      >
        <Bot className="size-4" />
        {aiBusy ? "Analizando…" : "Análisis IA"}
      </button>
      {aiNote && (
        <p className="rounded-md border-2 border-pk-ink bg-pk-panel px-3 py-2 font-body text-lg leading-snug">
          {aiNote}
        </p>
      )}

      <p className="rounded-md border-2 border-pk-muted bg-pk-panel px-3 py-2 font-body text-lg leading-snug">
        {p.description}
      </p>

      {special && (
        <div className="rounded-md border-2 border-pk-muted bg-pk-panel px-3 py-2">
          <p className="font-body text-sm uppercase tracking-wide text-pk-muted">
            Poder especial
          </p>
          <p className="font-body text-xl">{special.nameEs}</p>
          {p.abilities
            .filter((a) => a.hidden)
            .map((a) => (
              <p key={a.name} className="font-body text-base text-pk-muted">
                Oculta: {a.nameEs}
              </p>
            ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <InfoCell label="Altura" value={`${p.height} m`} />
        <InfoCell label="Peso" value={`${p.weight} kg`} />
        <InfoCell label="Captura" value={String(p.captureRate ?? "—")} />
        <InfoCell
          label="Hábitat"
          value={p.habitat ? titleCase(p.habitat) : "—"}
        />
      </div>

      <EvolutionRow stages={p.evolution} onOpen={onOpen} currentId={p.id} />

      <MatchupBlock types={p.types} />

      <div>
        <h3 className="mb-1 font-body text-lg text-pk-muted">Estadísticas</h3>
        {p.stats.map((s) => (
          <div key={s.name} className="mb-1 flex items-center gap-2">
            <span className="w-16 font-body text-base text-pk-muted">
              {STAT_LABEL[s.name] ?? s.name}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-pk-muted">
              <div
                className="h-full bg-ok"
                style={{ width: `${Math.min(100, (s.base / 180) * 100)}%` }}
              />
            </div>
            <span className="w-8 text-right font-body text-base tabular-nums">
              {s.base}
            </span>
          </div>
        ))}
      </div>

      {p.moves.length > 0 && (
        <div>
          <h3 className="mb-1 font-body text-lg text-pk-muted">
            Movimientos Gen 1
          </h3>
          <div className="flex flex-wrap gap-1">
            {p.moves.map((m) => (
              <span
                key={m}
                className="rounded-sm bg-pk-ink px-2 py-0.5 font-body text-base text-pk-screen"
              >
                {titleCase(m)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border-2 border-pk-muted bg-pk-panel px-2 py-2">
      <p className="font-body text-sm uppercase text-pk-muted">{label}</p>
      <p className="font-body text-lg">{value}</p>
    </div>
  );
}

function MatchupBlock({ types }: { types: string[] }) {
  const m = defenseMatchup(types);
  const rows: { title: string; items: { type: string; mult: number }[] }[] = [
    { title: "Debilidades", items: m.weak },
    { title: "Resistencias", items: m.resist },
    { title: "Inmune", items: m.immune },
  ];
  return (
    <div>
      <h3 className="mb-1 font-body text-lg text-pk-muted">Tipos rivales</h3>
      {rows.map((row) =>
        row.items.length === 0 ? null : (
          <div key={row.title} className="mb-2">
            <p className="font-body text-base text-pk-muted">{row.title}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {row.items.map((g) => (
                <span key={g.type} className="inline-flex items-center gap-1">
                  <TypeBadge type={g.type} />
                  <span className="font-body text-sm">{formatMult(g.mult)}</span>
                </span>
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

function CompareView({
  leftId,
  rightId,
  setLeftId,
  setRightId,
  onOpen,
}: {
  leftId: number | null;
  rightId: number | null;
  setLeftId: (id: number) => void;
  setRightId: (id: number) => void;
  onOpen: (id: number) => void;
}) {
  const [pick, setPick] = useState("");
  const leftQ = useQuery({
    queryKey: ["pokemon", leftId],
    queryFn: async () => {
      const res = await getPokemonFn({ data: { q: String(leftId) } });
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    enabled: leftId != null,
  });
  const rightQ = useQuery({
    queryKey: ["pokemon", rightId],
    queryFn: async () => {
      const res = await getPokemonFn({ data: { q: String(rightId) } });
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    enabled: rightId != null,
  });

  function choose(raw: string) {
    const hit = findInCatalog(raw);
    if (!hit) return;
    setPick("");
    if (!leftId) setLeftId(hit.id);
    else setRightId(hit.id);
  }

  const a = leftQ.data;
  const b = rightQ.data;
  const statNames = a?.stats.map((s) => s.name) ?? [];

  return (
    <div>
      <h2 className="mb-2 font-display text-[10px] leading-relaxed">
        Comparar
      </h2>
      <div className="mb-2 flex gap-1">
        <input
          value={pick}
          onChange={(e) => setPick(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") choose(pick);
          }}
          placeholder={leftId ? "Rival (nº o nombre)" : "Primer Pokémon"}
          className="h-11 flex-1 rounded-md border-2 border-pk-muted bg-pk-panel px-3 font-body text-lg outline-none"
        />
        <button
          type="button"
          onClick={() => choose(pick)}
          className="h-11 rounded-md bg-pk-ink px-3 font-body text-lg text-pk-screen"
        >
          Añadir
        </button>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <CompareSlot p={a} loading={leftQ.isLoading} />
        <CompareSlot p={b} loading={rightQ.isLoading} />
      </div>
      {a && b && (
        <div>
          <h3 className="mb-1 font-body text-lg text-pk-muted">Stats</h3>
          {statNames.map((name) => {
            const av = a.stats.find((s) => s.name === name)?.base ?? 0;
            const bv = b.stats.find((s) => s.name === name)?.base ?? 0;
            return (
              <div key={name} className="mb-1">
                <p className="font-body text-sm text-pk-muted">
                  {STAT_LABEL[name] ?? name}
                </p>
                <div className="flex items-center gap-1 font-body text-base">
                  <span
                    className={cn(
                      "w-8 tabular-nums",
                      av > bv && "font-bold",
                    )}
                  >
                    {av}
                  </span>
                  <div className="flex h-2.5 flex-1 overflow-hidden rounded-sm bg-pk-muted">
                    <div
                      className="h-full bg-ok"
                      style={{ width: `${(av / (av + bv || 1)) * 100}%` }}
                    />
                    <div
                      className="h-full bg-pk-red"
                      style={{ width: `${(bv / (av + bv || 1)) * 100}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "w-8 text-right tabular-nums",
                      bv > av && "font-bold",
                    )}
                  >
                    {bv}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <MatchupBlock types={a.types} />
            <MatchupBlock types={b.types} />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => onOpen(a.id)}
              className="h-10 flex-1 rounded-md bg-pk-ink font-body text-lg text-pk-screen"
            >
              Ficha A
            </button>
            <button
              type="button"
              onClick={() => onOpen(b.id)}
              className="h-10 flex-1 rounded-md bg-pk-ink font-body text-lg text-pk-screen"
            >
              Ficha B
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CompareSlot({
  p,
  loading,
}: {
  p: PokemonDetail | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-md border-2 border-pk-muted bg-pk-panel px-2 py-6 text-center font-body text-lg text-pk-muted">
        Cargando…
      </div>
    );
  }
  if (!p) {
    return (
      <div className="rounded-md border-2 border-dashed border-pk-muted bg-pk-panel px-2 py-6 text-center font-body text-lg text-pk-muted">
        Elige un Pokémon
      </div>
    );
  }
  return (
    <div className="rounded-md border-2 border-pk-muted bg-pk-panel p-2 text-center">
      <p className="font-body text-sm text-pk-muted">Nº {padDex(p.id)}</p>
      <img
        src={p.animated ?? p.sprite}
        alt={p.nameEs}
        className="pixelated mx-auto size-16"
      />
      <p className="font-body text-lg">{p.nameEs}</p>
      <div className="mt-1 flex justify-center gap-1">
        {p.types.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </div>
    </div>
  );
}

function EvolutionRow({
  stages,
  onOpen,
  currentId,
}: {
  stages: PokemonDetail["evolution"];
  onOpen: (id: number) => void;
  currentId: number;
}) {
  if (stages.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 font-body text-lg text-pk-muted">Evoluciones</h3>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {stages.map((stage, i) => (
          <div key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-4 text-pk-muted" />}
            <div className="flex flex-col gap-1">
              {stage.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => onOpen(node.id)}
                  className={cn(
                    "flex items-center gap-1 rounded-md border-2 bg-pk-panel px-1 py-1",
                    node.id === currentId
                      ? "border-pk-ink"
                      : "border-pk-muted",
                  )}
                >
                  <img
                    src={spriteUrl(node.id)}
                    alt=""
                    className="pixelated size-10"
                  />
                  <span className="text-left">
                    <span className="block font-body text-base leading-tight">
                      {titleCase(node.name)}
                    </span>
                    {node.method && (
                      <span className="block font-body text-sm text-pk-muted">
                        {node.method}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizView({
  onOpen,
}: {
  onOpen: (id: number) => void;
}) {
  const [guess, setGuess] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<"ok" | "bad" | null>(null);
  const [score, setScore] = useState({ ok: 0, bad: 0 });
  const [seed, setSeed] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [hintBusy, setHintBusy] = useState(false);

  const q = useQuery({
    queryKey: ["quiz", seed],
    queryFn: () => getQuizFn(),
  });

  useEffect(() => {
    setGuess("");
    setRevealed(false);
    setResult(null);
    setHint(null);
  }, [seed]);

  useEffect(() => {
    if (!q.data || revealed) return;
    playWhoIsThat();
    playQuizLoop();
    speakDex("¿Quién es ese Pokémon?");
    return () => {
      stopLoop();
    };
  }, [q.data?.id, revealed]);

  function next() {
    setSeed((s) => s + 1);
  }

  function check(p: QuizPokemon, raw?: string) {
    const g = (raw ?? guess).trim().toLowerCase();
    if (!g) return;
    const names = [p.name, p.nameEs].map((n) =>
      n.toLowerCase().replace(/[.'♀♂]/g, ""),
    );
    const compact = g.replace(/[.'♀♂\s]/g, "");
    const hit = names.some((n) => {
      const clean = n.replace(/-/g, "");
      return (
        n === g ||
        clean === compact ||
        (g.length >= 3 && (n.startsWith(g) || clean.startsWith(compact)))
      );
    });
    setRevealed(true);
    setResult(hit ? "ok" : "bad");
    setScore((s) =>
      hit ? { ...s, ok: s.ok + 1 } : { ...s, bad: s.bad + 1 },
    );
    if (hit) {
      playCorrectSfx();
      playCry(
        `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${p.id}.ogg`,
      );
      speakDex(`¡Correcto! Es ${p.nameEs}.`);
    } else {
      playWrongSfx();
      speakDex(`Incorrecto. Era ${p.nameEs}.`);
    }
  }

  async function askHint(p: QuizPokemon) {
    setHintBusy(true);
    const res = await askDexFn({
      data: {
        mode: "hint",
        pokemon: { id: p.id, nameEs: p.nameEs, types: p.types },
      },
    });
    setHintBusy(false);
    if (res.ok) {
      setHint(res.text);
      speakDex(res.text);
    } else {
      setHint(res.error);
    }
  }

  const p = q.data;

  return (
    <div>
      <h2 className="mb-3 text-center font-display text-[11px] leading-relaxed">
        ¿Quién es ese Pokémon?
      </h2>
      <div className="quiz-stage mx-auto mb-4 flex size-44 items-center justify-center rounded-lg border-4 border-pk-muted">
        {p ? (
          <img
            src={p.sprite}
            alt={revealed ? p.nameEs : "Silueta"}
            className={cn(
              "max-h-40 max-w-40",
              revealed ? "revealed" : "silhouette",
            )}
          />
        ) : (
          <span className="font-body text-lg text-pk-muted">Cargando…</span>
        )}
      </div>

      <div className="mb-2 flex gap-1">
        <input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && p && !revealed) check(p);
          }}
          placeholder="Escribe el nombre…"
          disabled={!p || revealed}
          className="h-11 flex-1 rounded-md border-2 border-pk-muted bg-pk-panel px-3 font-body text-xl outline-none disabled:opacity-60"
        />
        <button
          type="button"
          disabled={!p || revealed}
          onClick={() => p && check(p)}
          className="h-11 rounded-md bg-pk-ink px-3 font-body text-lg text-pk-screen disabled:opacity-50"
        >
          Adivinar
        </button>
      </div>

      {p && (
        <div className="mb-3 grid grid-cols-2 gap-1">
          {p.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={revealed}
              onClick={() => check(p, opt.nameEs)}
              className="h-11 rounded-md border-2 border-pk-muted bg-pk-panel font-body text-lg disabled:opacity-60"
            >
              {opt.nameEs}
            </button>
          ))}
        </div>
      )}

      {result && p && (
        <p
          className={cn(
            "mb-2 rounded-md px-3 py-2 font-body text-lg text-white",
            result === "ok" ? "bg-ok" : "bg-bad",
          )}
        >
          {result === "ok" ? "Correcto: " : "Era "}
          {p.nameEs} (#{padDex(p.id)})
        </p>
      )}

      {hint && (
        <p className="mb-2 rounded-md border-2 border-pk-muted bg-pk-panel px-3 py-2 font-body text-lg leading-snug">
          Pista: {hint}
        </p>
      )}

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={next}
          className="btn-press h-10 flex-1 rounded-md bg-pk-screen-dim font-body text-lg"
        >
          Siguiente
        </button>
        <button
          type="button"
          onClick={() => p && void askHint(p)}
          disabled={!p || revealed || hintBusy}
          className="btn-press h-10 flex-1 rounded-md bg-pk-screen-dim font-body text-lg disabled:opacity-50"
        >
          {hintBusy ? "Pista…" : "Pista IA"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRevealed(true);
            setResult(null);
            stopLoop();
            if (p) {
              playCry(
                `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${p.id}.ogg`,
              );
              speakDex(`Es ${p.nameEs}.`);
            }
          }}
          disabled={!p || revealed}
          className="btn-press h-10 flex-1 rounded-md bg-pk-screen-dim font-body text-lg disabled:opacity-50"
        >
          Revelar
        </button>
      </div>
      {p && revealed && (
        <button
          type="button"
          onClick={() => onOpen(p.id)}
          className="mb-3 w-full rounded-md border-2 border-pk-muted bg-pk-panel py-2 font-body text-lg"
        >
          Ver ficha
        </button>
      )}
      <p className="text-center font-body text-lg text-pk-muted">
        Aciertos {score.ok} · Fallos {score.bad}
      </p>
    </div>
  );
}

function BootScreen({ onPower }: { onPower: () => void }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
      <p className="font-display text-[11px] leading-relaxed">POKéDEX</p>
      <p className="mt-2 font-body text-xl text-pk-muted">Kanto · 151</p>
      <p className="mt-6 max-w-[16rem] font-body text-lg leading-snug">
        Pulsa para encender el audio: gritos, voz de la Pokédex y el reto de la silueta.
      </p>
      <button
        type="button"
        onClick={onPower}
        className="btn-press mt-6 h-12 rounded-md bg-pk-ink px-6 font-body text-xl text-pk-screen"
      >
        Encender
      </button>
    </div>
  );
}

function AiView({
  selectedId,
}: {
  selectedId: number | null;
}) {
  const [question, setQuestion] = useState("");
  const [log, setLog] = useState<{ role: "user" | "dex"; text: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["pokemon", selectedId],
    queryFn: async () => {
      const res = await getPokemonFn({ data: { q: String(selectedId) } });
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    enabled: selectedId != null,
  });

  async function send(text: string) {
    const prompt = text.trim();
    if (!prompt || busy) return;
    setQuestion("");
    setLog((prev) => [...prev, { role: "user", text: prompt }]);
    setBusy(true);
    const p = q.data;
    const res = await askDexFn({
      data: {
        mode: "chat",
        question: prompt,
        pokemon: p
          ? {
              id: p.id,
              nameEs: p.nameEs,
              types: p.types,
              description: p.description,
              stats: p.stats,
              abilities: p.abilities.map((a) => ({ nameEs: a.nameEs })),
            }
          : undefined,
      },
    });
    setBusy(false);
    const reply = res.ok ? res.text : res.error;
    setLog((prev) => [...prev, { role: "dex", text: reply }]);
    speakDex(reply);
  }

  const chips = [
    "¿Cuál es el más rápido de Kanto?",
    "¿Qué tipos le ganan al agua?",
    selectedId ? "¿Cómo lo uso en combate?" : "¿Quién es el nº 25?",
  ];

  return (
    <div>
      <h2 className="mb-2 flex items-center gap-2 font-display text-[10px] leading-relaxed">
        <Bot className="size-4" />
        Profesor Dex
      </h2>
      <p className="mb-3 font-body text-lg leading-snug text-pk-muted">
        IA de Kanto
        {q.data ? ` · ficha de ${q.data.nameEs}` : " · abre una ficha para más contexto"}
      </p>
      <div className="mb-2 flex flex-wrap gap-1">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => void send(c)}
            className="btn-press rounded-full bg-pk-panel px-3 py-1 font-body text-base"
          >
            {c}
          </button>
        ))}
      </div>
      <div className="mb-2 max-h-56 space-y-2 overflow-y-auto">
        {log.length === 0 && (
          <p className="rounded-md border-2 border-pk-muted bg-pk-panel px-3 py-2 font-body text-lg">
            Pregúntame tipos, combates, evoluciones o el juego de la silueta.
          </p>
        )}
        {log.map((m, i) => (
          <p
            key={i}
            className={cn(
              "rounded-md px-3 py-2 font-body text-lg leading-snug",
              m.role === "user"
                ? "bg-pk-ink text-pk-screen"
                : "border-2 border-pk-muted bg-pk-panel",
            )}
          >
            {m.text}
          </p>
        ))}
        {busy && (
          <p className="font-body text-lg text-pk-muted">Pensando…</p>
        )}
      </div>
      <div className="flex gap-1">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send(question);
          }}
          placeholder="Pregunta a la IA…"
          className="h-11 flex-1 rounded-md border-2 border-pk-muted bg-pk-panel px-3 font-body text-lg outline-none"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void send(question)}
          className="btn-press h-11 rounded-md bg-pk-ink px-3 font-body text-lg text-pk-screen disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
