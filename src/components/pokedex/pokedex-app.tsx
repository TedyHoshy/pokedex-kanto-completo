import { TypeBadge } from "@/components/pokedex/type-badge";
import {
  CATALOG,
  FILTER_TYPES,
  findInCatalog,
  MAX_DEX,
  RANGE_ERROR,
  shinyAnimatedGifUrl,
  shinyArtworkUrl,
  shinySpriteUrl,
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
  playBattleAttack,
  playBattleDangerLoop,
  playBattleFlee,
  playBattleHeal,
  playBattleHit,
  playBattleLoop,
  playClick,
  playCorrectSfx,
  playCry,
  playDexOpen,
  playQuizLoop,
  playWhoIsThat,
  playWrongSfx,
  setMuted,
  stopCry,
  stopLoop,
  unlockAudio,
} from "@/lib/pokemon/sfx";
import { speakDex, stopSpeak, warmupVoices } from "@/lib/pokemon/voice";
import type { EvolutionNode, PokemonDetail, QuizPokemon } from "@/lib/pokemon/types";
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

type Tab = "list" | "detail" | "quiz" | "ai" | "compare" | "game";

const PARTY_LIMIT = 6;

const STAT_LABEL: Record<string, string> = {
  hp: "PS",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. Esp.",
  "special-defense": "Def. Esp.",
  speed: "Velocidad",
};

const TYPE_ACCENTS: Record<string, { from: string; to: string; glow: string }> = {
  normal: { from: "#d7d4af", to: "#a8a97b", glow: "rgba(255,255,255,0.42)" },
  fire: { from: "#fca65d", to: "#e75932", glow: "rgba(255,184,92,0.46)" },
  water: { from: "#7ec5ff", to: "#4d7ef5", glow: "rgba(133,214,255,0.45)" },
  grass: { from: "#9ee88a", to: "#4bb76b", glow: "rgba(166,255,170,0.44)" },
  electric: { from: "#f9ec7a", to: "#e2b63a", glow: "rgba(255,246,157,0.44)" },
  ice: { from: "#b5f1ff", to: "#6ecfe8", glow: "rgba(217,248,255,0.48)" },
  fighting: { from: "#ef6c63", to: "#9a2c2c", glow: "rgba(255,172,166,0.42)" },
  poison: { from: "#cb88e7", to: "#7c47b8", glow: "rgba(200,170,255,0.42)" },
  ground: { from: "#e7c66a", to: "#b98d2a", glow: "rgba(247,220,145,0.42)" },
  flying: { from: "#b5c5ff", to: "#7a86df", glow: "rgba(210,218,255,0.42)" },
  psychic: { from: "#fbb0d3", to: "#de4f86", glow: "rgba(255,196,224,0.42)" },
  bug: { from: "#c8d76b", to: "#7ea423", glow: "rgba(210,235,126,0.45)" },
  rock: { from: "#d5b870", to: "#9d7b2d", glow: "rgba(236,209,122,0.42)" },
  ghost: { from: "#a48ad5", to: "#56407f", glow: "rgba(208,186,255,0.42)" },
  dragon: { from: "#8d7cf7", to: "#4d39be", glow: "rgba(175,160,255,0.42)" },
  dark: { from: "#8f7367", to: "#47372f", glow: "rgba(163,143,136,0.4)" },
  steel: { from: "#d3d9e7", to: "#7d8da6", glow: "rgba(224,232,244,0.42)" },
  fairy: { from: "#f5bfd9", to: "#dd7fb1", glow: "rgba(255,215,236,0.4)" },
};

export function PokedexApp() {
  const [powered, setPowered] = useState(false);
  const [muted, setMutedUi] = useState(false);
  const [tab, setTab] = useState<Tab>("list");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(1);
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

  const listViewMode = tab === "list";
  const lcdSelectedId = listViewMode ? null : selectedId;
  const lcdName =
    lcdSelectedId != null
      ? CATALOG.find((p) => p.id === lcdSelectedId)?.nameEs ?? ""
      : "";

  function openPokemon(id: number) {
    stopCry();
    setError(null);
    setSelectedId(id);
    log.markSeen(id);
    setTab("detail");
    setSuggestOpen(false);
    playClick();
  }

  function openCompare(left: number, right?: number) {
    stopCry();
    log.markSeen(left);
    setVsLeft(left);
    setVsRight(right ?? null);
    setSelectedId(left);
    playClick();
    stopLoop();
    setTab("compare");
  }

  function goTab(next: Tab) {
    stopCry();
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
    setSelectedId((current) => current ?? 1);
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
    stopCry();
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
                      {tab === "game" && <GameView log={log} muted={muted} onMenu={() => goTab("list")} />}
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
                <button type="button" className="dex-dpad-btn up" aria-label="Arriba" onClick={() => movePad("up")} />
                <button type="button" className="dex-dpad-btn down" aria-label="Abajo" onClick={() => movePad("down")} />
                <button type="button" className="dex-dpad-btn left" aria-label="Izquierda" onClick={() => movePad("left")} />
                <button type="button" className="dex-dpad-btn right" aria-label="Derecha" onClick={() => movePad("right")} />
              </div>
            </div>
          </section>

          <div className="dex-hinge" aria-hidden />

          <section className="dex-panel dex-right">
            <div className="dex-lcd" aria-live="polite">
              <span>{powered ? (lcdSelectedId ? `Nº ${padDex(lcdSelectedId)}` : "KANTO · 151") : "OFF"}</span>
              <span>{powered ? lcdName || (listViewMode ? "Índice" : tabLabel(tab)) : "Pulsa el botón verde"}</span>
            </div>
            <div className="dex-blue-pad">
              {([["list", "LISTA"], ["detail", "FICHA"], ["quiz", "SOMBRA"], ["game", "BATALLA"]] as const).map(([id, label]) => (
                <button key={id} type="button" className={cn("btn-press", tab === id && powered && "is-on")} onClick={() => !powered ? powerOn() : goTab(id)}>
                  {label}
                </button>
              ))}
              <button type="button" className="btn-press" disabled={tab === "list" || !selectedId} onClick={() => selectedId && playCry(`https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${selectedId}.ogg`)}>GRITO</button>
              <button type="button" className="btn-press" onClick={() => selectedId && fav.toggle(selectedId)}>FAV</button>
              <button type="button" className="btn-press" onClick={() => !powered ? powerOn() : openPokemon(Math.floor(Math.random() * MAX_DEX) + 1)}>DADO</button>
              <button type="button" className="btn-press" onClick={toggleMute}>{muted ? "MUTE" : "SONIDO"}</button>
            </div>
            <div className="dex-right-mid">
              <div className="dex-white-pair">
                <button type="button" className="dex-white-key btn-press" aria-label="Anterior" onClick={() => stepDex(-1)}>Prev</button>
                <button type="button" className="dex-white-key btn-press" aria-label="Siguiente" onClick={() => stepDex(1)}>Next</button>
              </div>
              <button type="button" className="dex-yellow btn-press" aria-label={powered ? "Apagar" : "Encender"} onClick={() => powered ? powerOff() : powerOn()} />
            </div>
            <div className="dex-black-row">
              <button type="button" className="dex-black-key btn-press" onClick={() => !powered ? powerOn() : openCompare(selectedId ?? visible[cursor]?.id ?? 1)}>VS</button>
              <button type="button" className="dex-black-key btn-press" onClick={() => !powered ? powerOn() : goTab("ai")}>PROF. DEX</button>
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
  if (tab === "game") return "Juego";
  if (tab === "ai") return "Profesor Dex";
  if (tab === "detail") return "Ficha";
  if (tab === "compare") return "Comparar";
  return "Índice";
}

function ListView(props: {
  query: string;
  setQuery: (value: string) => void;
  error: string | null;
  suggestions: typeof CATALOG;
  suggestOpen: boolean;
  setSuggestOpen: (value: boolean) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  onSearch: (query: string) => void;
  onPick: (id: number) => void;
  typeFilter: string | null;
  setTypeFilter: (value: string | null) => void;
  onlyFavs: boolean;
  setOnlyFavs: (value: boolean) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  visible: typeof CATALOG;
  fav: ReturnType<typeof useFavorites>;
  log: ReturnType<typeof useDexLog>;
  cursor: number;
}) {
  return (
    <div className="dex-list-view">
      <div className="mb-3 flex items-end justify-between border-b-2 border-pk-muted pb-2">
        <h1 className="font-display text-[11px] leading-relaxed text-pk-ink">POKEDEX</h1>
        <span className="rounded-sm bg-pk-ink px-2 py-1 font-body text-sm text-pk-screen">GEN 1 · 151</span>
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
            ["caught", "Capturados"],
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
                "dex-pokemon-tile relative rounded-md border-2 bg-pk-panel p-1.5 text-center transition-transform duration-150 hover:scale-105",
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
                  className="pixelated mx-auto size-12"
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
  const [mode, setMode] = useState<"anim" | "art" | "3d">("anim");
  const [isShiny, setIsShiny] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const img =
    mode === "anim"
      ? isShiny
        ? shinyAnimatedGifUrl(p.id)
        : p.animated ?? p.artwork
      : mode === "3d"
        ? isShiny
          ? p.model3dShiny || p.model3d
          : p.model3d || p.artwork
        : isShiny
          ? shinyArtworkUrl(p.id)
          : p.artwork;
  const typeLabel = p.types.map((t) => TYPE_LABELS[t] ?? t).join(" y ");
  const accent = TYPE_ACCENTS[p.types[0]] ?? TYPE_ACCENTS.normal;
  const heroStyle = {
    background: `radial-gradient(circle at top, ${accent.glow}, transparent 34%), linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`,
  } as const;

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
      <div className="pokemon-sheet-shell" style={heroStyle}>
        <div className="pokemon-sheet-header">
          <span className="pokemon-sheet-badge">Nº {padDex(p.id)}</span>
          <span className="pokemon-sheet-tracker">{TYPE_LABELS[p.types[0]] ?? p.types[0]}</span>
        </div>

        <div className="pokemon-portrait-room">
          <div className="pokemon-portrait-frame">
            {mode === "3d" ? (
              <div className="dex-3d-scene dex-3d-clean">
                <img
                  src={img}
                  alt={isShiny ? `${p.nameEs} shiny` : p.nameEs}
                  className="dex-3d-clean-image h-40 w-40 object-contain"
                />
              </div>
            ) : (
              <img
                src={img}
                alt={isShiny ? `${p.nameEs} shiny` : p.nameEs}
                className={cn(
                  mode === "anim"
                    ? "sprite-idle h-38 w-38 object-contain pixelated"
                    : "sprite-idle h-48 w-48 object-contain",
                )}
              />
            )}
          </div>
        </div>

        <div className="pokemon-title-wrap">
          <div>
            <p className="pokemon-subtitle">Ficha de Kanto</p>
            <h2 className="font-display text-[13px] leading-relaxed">{p.nameEs}</h2>
          </div>
          <div className="flex flex-wrap gap-1">
            {p.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-1">
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
        <button
          type="button"
          onClick={() => setMode("3d")}
          className={cn(
            "rounded-full px-3 py-1 font-body text-base",
            mode === "3d" ? "bg-pk-ink text-pk-screen" : "bg-pk-panel",
          )}
        >
          3D
        </button>
        <button
          type="button"
          onClick={() => setIsShiny((v) => !v)}
          className={cn(
            "rounded-full px-3 py-1 font-body text-base",
            isShiny ? "bg-yellow-400 text-black" : "bg-pk-panel text-pk-ink",
          )}
        >
          {isShiny ? "Shiny" : "Normal"}
        </button>
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

      <p className="pokemon-flavor-card">
        {p.description}
      </p>

      {special && (
        <div className="pokemon-ability-card">
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

      <div className="pokemon-stats-panel">
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
    <div className="pokemon-stat-tile">
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
    <div className="pokemon-matchup-shell">
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
    <div className="dex-compare-view">
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
        className="pixelated mx-auto size-12"
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
                    className="pixelated size-14"
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
      const cleanText = res.text.replace(/^Pista\s*:\s*/i, "");
      setHint(cleanText);
      speakDex(cleanText);
    } else {
      setHint(res.error.replace(/^Pista\s*:\s*/i, ""));
    }
  }

  const p = q.data;
  const hintText = hint ? hint.replace(/^Pista\s*:\s*/i, "") : "";

  return (
    <div className="dex-quiz-view">
      <h2 className="mb-3 text-center font-display text-[11px] leading-relaxed">
        ¿Quién es ese Pokémon?
      </h2>
      <div className="quiz-stage quiz-portrait mx-auto mb-4 flex size-44 items-center justify-center rounded-lg border-4 border-pk-muted">
        {p ? (
          <img
            src={p.sprite}
            alt={revealed ? p.nameEs : "Silueta"}
            className={cn(
              "max-h-72 max-w-72",
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

      {hintText && (
        <div className="quiz-hint mb-2">
          <span className="quiz-hint-label">Pista</span>
          <p className="quiz-hint-text">{hintText}</p>
        </div>
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
      <p className="quiz-score text-center font-body text-lg text-pk-muted">
        Aciertos {score.ok} · Fallos {score.bad}
      </p>
    </div>
  );
}

function BootScreen({ onPower }: { onPower: () => void }) {
  return (
    <div className="dex-boot-screen flex min-h-[280px] flex-col items-center justify-center text-center">
      <p className="font-display text-[11px] leading-relaxed">Pokémon</p>
      <p className="font-display text-[11px] leading-relaxed">Rojo y Verde</p>
      <p className="mt-3 font-body text-xl text-pk-muted">Kanto · 151</p>
      <p className="mt-6 max-w-[16rem] font-body text-lg leading-snug">
        Elige la versión y entra en la región de Kanto.
      </p>
      <button
        type="button"
        onClick={onPower}
        className="btn-press mt-6 h-12 rounded-md bg-pk-ink px-6 font-body text-lg text-pk-screen"
      >
        Pokémon Rojo y Pokémon Verde
      </button>
    </div>
  );
}

function GameView({
  log,
  muted,
  onMenu,
}: {
  log: ReturnType<typeof useDexLog>;
  muted: boolean;
  onMenu: () => void;
}) {
  const [encounterId, setEncounterId] = useState<number>(16);
  const [encounterLevel, setEncounterLevel] = useState(5);
  const [playerId, setPlayerId] = useState(1);
  const [partyInitialized, setPartyInitialized] = useState(false);
  const [battleAnimation, setBattleAnimation] = useState<BattleAnimation>("idle");
  const battleAnimationTimer = useRef<number | null>(null);
  const [pokemonProgress, setPokemonProgress] = useState<PokemonProgressMap>(loadPokemonProgress);
  const [playerHp, setPlayerHp] = useState(60);
  const [enemyHp, setEnemyHp] = useState(30);
  const [enemyMaxHp, setEnemyMaxHp] = useState(30);
  const [enemyAttackStage, setEnemyAttackStage] = useState(0);
  const [enemyDefenseStage, setEnemyDefenseStage] = useState(0);
  const [message, setMessage] = useState("Un Pokémon salvaje apareció.");
  const [enemyDefeated, setEnemyDefeated] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [choosingMove, setChoosingMove] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [partyOpen, setPartyOpen] = useState(false);
  const [moves, setMoves] = useState<string[]>([]);
  const [inventory, setInventory] = useState<BattleItem[]>([
    WORLD_ITEMS[0], WORLD_ITEMS[2], WORLD_ITEMS[3],
  ]);

  const encounter = CATALOG.find((p) => p.id === encounterId) ?? CATALOG[0];
  const player = CATALOG.find((pokemon) => pokemon.id === playerId) ?? CATALOG[6];
  const playerProgress = pokemonProgress[playerId] ?? { level: 5, xp: 0 };
  const playerLevel = playerProgress.level;
  const playerXp = playerProgress.xp;
  const playerMaxHp = 40 + (playerLevel - 1) * 5;
  const caughtPokemon = CATALOG.filter((pokemon) => log.isCaught(pokemon.id));
  const teamPokemon = [
    player,
    ...caughtPokemon.filter((pokemon) => pokemon.id !== playerId),
  ].slice(0, PARTY_LIMIT);
  const reservePokemon = teamPokemon.filter((pokemon) => pokemon.id !== playerId);

  useEffect(() => {
    if (!log.isLoaded || partyInitialized) return;
    const firstCaught = CATALOG.find((pokemon) => log.isCaught(pokemon.id));
    if (firstCaught) {
      setPlayerId(firstCaught.id);
      setPlayerHp(40 + ((pokemonProgress[firstCaught.id]?.level ?? 5) - 1) * 5);
    }
    setPartyInitialized(true);
  }, [log, partyInitialized, pokemonProgress]);

  useEffect(() => {
    if (!partyInitialized) return;
    playCry(`https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${playerId}.ogg`);
    return stopCry;
  }, [partyInitialized, playerId]);

  const playerQuery = useQuery({
    queryKey: ["pokemon", "battle-player", playerId],
    queryFn: async () => {
      const res = await getPokemonFn({ data: { q: String(playerId) } });
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
  });
  const enemyRatio = Math.max(0, Math.min(100, (enemyHp / enemyMaxHp) * 100));
  const playerRatio = Math.max(0, Math.min(100, (playerHp / playerMaxHp) * 100));
  const xpThreshold = playerLevel * 20;
  const xpRatio = Math.min(100, (playerXp / xpThreshold) * 100);
  const dangerMusic = playerHp > 0 && playerRatio <= 50;

  useEffect(() => {
    if (muted || gameOver) {
      stopLoop();
      return;
    }
    if (dangerMusic) playBattleDangerLoop();
    else playBattleLoop();
    return stopLoop;
  }, [muted, dangerMusic, gameOver]);

  useEffect(() => () => {
    if (battleAnimationTimer.current != null) {
      window.clearTimeout(battleAnimationTimer.current);
    }
  }, []);

  useEffect(() => {
    const available = (playerQuery.data?.learnableMoves ?? [])
      .filter((move) => move.level <= playerLevel)
      .map((move) => move.name);
    if (available.length === 0) {
      setMoves([]);
      return;
    }
    const shuffled = [...new Set(available)];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    const statusMove = shuffled.find((move) => STATUS_MOVE_EFFECTS[move]);
    setMoves(statusMove
      ? [statusMove, ...shuffled.filter((move) => move !== statusMove)].slice(0, 4)
      : shuffled.slice(0, 4));
  }, [playerQuery.data, playerLevel]);

  function spawnRandomEncounter() {
    const encounters = CATALOG.filter((pokemon) => pokemon.id !== playerId);
    const next = encounters[Math.floor(Math.random() * encounters.length)];
    const nextLevel = Math.max(1, playerLevel + Math.floor(Math.random() * 5) - 2);
    const nextHp = 26 + (next.id % 12) * 3;
    setEncounterId(next.id);
    setEncounterLevel(nextLevel);
    setEnemyHp(nextHp);
    setEnemyMaxHp(nextHp);
    setEnemyAttackStage(0);
    setEnemyDefenseStage(0);
    setEnemyDefeated(false);
    setChoosingMove(false);
    setBagOpen(false);
    setPartyOpen(false);
    setMessage(`¡${next.nameEs} salvaje apareció!`);
    return next;
  }

  function awardExperience() {
    const levelGap = Math.max(0, encounterLevel - playerLevel);
    const levelBonus = levelGap >= 3 ? levelGap * 4 : 0;
    const gained = 4 + encounterLevel * 3 + levelBonus;
    let remainingXp = playerXp + gained;
    let nextLevel = playerLevel;
    while (remainingXp >= nextLevel * 20) {
      remainingXp -= nextLevel * 20;
      nextLevel += 1;
    }
    const levelsGained = nextLevel - playerLevel;
    let evolvedPokemonId = playerId;
    let evolvedPokemonName: string | null = null;
    const evolutionChain = playerQuery.data?.evolution ?? [];
    for (let level = playerLevel + 1; level <= nextLevel; level += 1) {
      const evolution = findLevelEvolution(evolutionChain, evolvedPokemonId, level);
      if (evolution) {
        evolvedPokemonId = evolution.id;
        evolvedPokemonName = CATALOG.find((pokemon) => pokemon.id === evolution.id)?.nameEs ?? evolution.name;
      }
    }
    const nextProgress = {
      ...pokemonProgress,
      [playerId]: { level: nextLevel, xp: remainingXp },
      [evolvedPokemonId]: { level: nextLevel, xp: remainingXp },
    };
    setPokemonProgress(nextProgress);
    savePokemonProgress(nextProgress);
    if (evolvedPokemonId !== playerId) {
      const evolved = CATALOG.find((pokemon) => pokemon.id === evolvedPokemonId);
      setPlayerId(evolvedPokemonId);
      setMoves([]);
      log.markSeen(evolvedPokemonId);
      if (!log.isCaught(evolvedPokemonId)) log.toggleCaught(evolvedPokemonId);
      evolvedPokemonName = evolved?.nameEs ?? "su siguiente etapa";
    }
    if (levelsGained > 0) {
      setPlayerHp((current) => current + levelsGained * 5);
    }
    setMessage(
      `¡${encounter.nameEs} cayó! ${player.nameEs} ganó ${gained} EXP${levelsGained > 0 ? ` y subió al nivel ${nextLevel}` : ""}${evolvedPokemonName ? ` y evolucionó a ${evolvedPokemonName}` : ""}.`,
    );
    return { pokemonId: evolvedPokemonId, progress: nextProgress };
  }

  function evolvePokemon(
    evolution: EvolutionNode,
    fromId: number,
    sourceProgress: PokemonProgressMap = pokemonProgress,
    itemIndex?: number,
  ) {
    const progress = sourceProgress[fromId] ?? pokemonProgress[fromId] ?? { level: 5, xp: 0 };
    const nextProgress = { ...sourceProgress, [evolution.id]: progress };
    const fromPokemon = CATALOG.find((pokemon) => pokemon.id === fromId);
    const toPokemon = CATALOG.find((pokemon) => pokemon.id === evolution.id);
    setPokemonProgress(nextProgress);
    savePokemonProgress(nextProgress);
    setPlayerId(evolution.id);
    setMoves([]);
    if (battleAnimationTimer.current != null) window.clearTimeout(battleAnimationTimer.current);
    setBattleAnimation("player-switch");
    battleAnimationTimer.current = window.setTimeout(() => {
      setBattleAnimation("idle");
      battleAnimationTimer.current = null;
    }, 420);
    if (itemIndex != null) {
      setInventory((current) => current.filter((_, index) => index !== itemIndex));
    }
    log.markSeen(evolution.id);
    if (!log.isCaught(evolution.id)) log.toggleCaught(evolution.id);
    setMessage(`¡${fromPokemon?.nameEs ?? player.nameEs} evolucionó a ${toPokemon?.nameEs ?? evolution.name}!`);
    return nextProgress;
  }

  function animateBattleSequence(sequence: BattleAnimationStep[]) {
    if (battleAnimationTimer.current != null) {
      window.clearTimeout(battleAnimationTimer.current);
    }
    let stepIndex = 0;
    const playNextStep = () => {
      const step = sequence[stepIndex];
      if (!step) {
        if (sequence.at(-1)?.action !== "flee") setBattleAnimation("idle");
        battleAnimationTimer.current = null;
        return;
      }
      setBattleAnimation(step.action);
      battleAnimationTimer.current = window.setTimeout(() => {
        stepIndex += 1;
        playNextStep();
      }, step.duration);
    };
    playNextStep();
  }

  function attack(move: string) {
    if (enemyDefeated || gameOver || playerHp <= 0 || battleAnimation !== "idle") return;
    setChoosingMove(false);
    playBattleAttack();
    const moveEffect = STATUS_MOVE_EFFECTS[move];
    let playerTurnMessage: string;
    let nextEnemy = enemyHp;
    let effectiveEnemyAttackStage = enemyAttackStage;

    if (moveEffect) {
      const currentStage = moveEffect.stat === "attack" ? enemyAttackStage : enemyDefenseStage;
      if (currentStage > -6) {
        const nextStage = Math.max(-6, currentStage - moveEffect.stages);
        if (moveEffect.stat === "attack") {
          setEnemyAttackStage(nextStage);
          effectiveEnemyAttackStage = nextStage;
        }
        else setEnemyDefenseStage(nextStage);
        playerTurnMessage = `¡${formatMoveName(move)}! El ${moveEffect.label} de ${encounter.nameEs} bajó.`;
      } else {
        playerTurnMessage = `¡${formatMoveName(move)}! ${encounter.nameEs} no puede bajar más su ${moveEffect.label}.`;
      }
      animateBattleSequence([
        { action: "player-attack", duration: 300 },
        { action: "enemy-debuff", duration: 220 },
        { action: "enemy-attack", duration: 300 },
        { action: "player-hit", duration: 220 },
      ]);
    } else {
      const baseDamage = 8 + Math.floor(Math.random() * 14);
      const damage = Math.max(1, Math.floor(baseDamage / stageMultiplier(enemyDefenseStage)));
      nextEnemy = Math.max(0, enemyHp - damage);
      setEnemyHp(nextEnemy);
      playBattleHit();

      if (nextEnemy <= 0) {
        animateBattleSequence([
          { action: "player-attack", duration: 300 },
          { action: "enemy-hit", duration: 280 },
        ]);
        setEnemyDefeated(true);
        const item = Math.random() < 0.18
          ? EVOLUTION_STONES[Math.floor(Math.random() * EVOLUTION_STONES.length)]
          : WORLD_ITEMS[Math.floor(Math.random() * WORLD_ITEMS.length)];
        const reward = awardExperience();
        const itemEvolution = item.effect === "evolution"
          ? findItemEvolution(playerQuery.data?.evolution ?? [], reward.pokemonId, item.method)
          : undefined;
        if (itemEvolution) {
          evolvePokemon(itemEvolution, reward.pokemonId, reward.progress);
          setMessage(`¡${encounter.nameEs} dejó caer ${item.name}! ¡${player.nameEs} evolucionó a ${itemEvolution.name}!`);
        } else {
          setInventory((current) => [...current, item]);
          setMessage((current) => `${current} Dejó caer: ${item.name}.`);
        }
        return;
      }

      playerTurnMessage = `¡${formatMoveName(move)}! ${encounter.nameEs} recibió ${damage} PS de daño.`;
      animateBattleSequence([
        { action: "player-attack", duration: 300 },
        { action: "enemy-hit", duration: 220 },
        { action: "enemy-attack", duration: 300 },
        { action: "player-hit", duration: 220 },
      ]);
    }

    playBattleHit();
    const enemyDamage = 5 + Math.floor(Math.random() * 10);
    const reducedEnemyDamage = Math.max(1, Math.floor(enemyDamage * stageMultiplier(effectiveEnemyAttackStage)));
    const nextPlayerHp = Math.max(0, playerHp - reducedEnemyDamage);
    setPlayerHp(nextPlayerHp);
    setMessage(
      nextPlayerHp === 0
        ? reservePokemon.length > 0
          ? `¡${player.nameEs} se debilitó! Elige otro Pokémon.`
          : `¡${encounter.nameEs} debilitó a ${player.nameEs}! ¡Has perdido!`
        : `${playerTurnMessage} ¡${encounter.nameEs} contraataca y causa ${reducedEnemyDamage} PS de daño.`,
    );
    if (nextPlayerHp === 0) {
      if (reservePokemon.length > 0) setPartyOpen(true);
      else setGameOver(true);
    }
  }

  function handleBattleItem(itemIndex: number) {
    const item = inventory[itemIndex];
    if (!item) return;
    if (item.effect === "heal" && playerHp < playerMaxHp) {
      animateBattleSequence([{ action: "player-heal", duration: 650 }]);
      playBattleHeal();
      setPlayerHp((current) => Math.min(playerMaxHp, current + item.power));
      setInventory((current) => current.filter((_, index) => index !== itemIndex));
      setMessage(`${player.nameEs} usó ${item.name}.`);
      setBagOpen(false);
      return;
    }
    if (item.effect === "evolution") {
      const evolution = findItemEvolution(
        playerQuery.data?.evolution ?? [],
        playerId,
        item.method,
      );
      if (!evolution) {
        setMessage(`${player.nameEs} no puede evolucionar con ${item.name}.`);
        return;
      }
      evolvePokemon(evolution, playerId, pokemonProgress, itemIndex);
      setBagOpen(false);
      return;
    }
    if (item.effect === "catch") {
      setInventory((current) => current.filter((_, index) => index !== itemIndex));
      const chance = Math.random() < 0.25 + (1 - enemyHp / enemyMaxHp) * 0.65;
      if (chance) {
        const alreadyCaught = log.isCaught(encounter.id);
        if (!alreadyCaught) log.toggleCaught(encounter.id);
        setEnemyDefeated(true);
        const teamFull = teamPokemon.length >= PARTY_LIMIT && !teamPokemon.some((pokemon) => pokemon.id === encounter.id);
        setMessage(
          teamFull
            ? `¡${encounter.nameEs} se registró en la Pokédex! Equipo completo: ${PARTY_LIMIT}/${PARTY_LIMIT}.`
            : `¡Capturaste a ${encounter.nameEs}! Ya está en tu equipo.`,
        );
      } else {
        setMessage(`¡${encounter.nameEs} escapó de la Poké Ball!`);
      }
      setBagOpen(false);
      return;
    }
    if (item.effect === "attract") {
      setInventory((current) => current.filter((_, index) => index !== itemIndex));
      const next = spawnRandomEncounter();
      setMessage(`El cebo atrajo a ${next.nameEs}.`);
      return;
    }
    setMessage(`${item.name}: no se puede usar ahora.`);
  }

  function flee() {
    if (enemyDefeated || gameOver) return;
    animateBattleSequence([{ action: "flee", duration: 650 }]);
    playBattleFlee();
    setGameOver(true);
    setChoosingMove(false);
    setBagOpen(false);
    setPartyOpen(false);
    setMessage("Huiste del combate. La partida terminó.");
  }

  function restartBattle() {
    setPlayerHp(playerMaxHp);
    setGameOver(false);
    spawnRandomEncounter();
  }

  function choosePokemon(id: number) {
    animateBattleSequence([{ action: "player-switch", duration: 420 }]);
    setPlayerId(id);
    setPlayerHp(40 + ((pokemonProgress[id]?.level ?? 5) - 1) * 5);
    setMoves([]);
    setPartyOpen(false);
    setMessage(`${CATALOG.find((pokemon) => pokemon.id === id)?.nameEs} entra en combate.`);
  }

  function continueAfterWin() {
    const next = spawnRandomEncounter();
    setMessage(`¡Adelante! Apareció ${next.nameEs}.`);
  }

  return (
    <div className="battle-shell">
      <div className="battle-header">
        <div className="battle-header__brand">
          <span className="battle-header__icon" aria-hidden />
          <span>Pokémon · Kanto</span>
        </div>
        <span className="battle-header__team">Equipo {teamPokemon.length}/{PARTY_LIMIT}</span>
      </div>

      <div className={cn("battle-field", dangerMusic && "battle-field--danger")}>
        <div className="battle-status battle-status--enemy">
          <div className="battle-status__heading">
            <span className="battle-status__name">{encounter.nameEs}</span>
            <span className="battle-status__level">Lv {encounterLevel}</span>
          </div>
          <div className="battle-status__bar battle-status__bar--enemy">
            <span style={{ width: `${enemyRatio}%` }} />
          </div>
        </div>

        <div className={cn(
          "battle-sprite battle-sprite--left",
          battleAnimation === "idle" && "battle-sprite--idle",
          battleAnimation === "player-attack" && "battle-sprite--attacking",
          battleAnimation === "player-hit" && "battle-sprite--hit",
          battleAnimation === "player-heal" && "battle-sprite--healing",
          battleAnimation === "player-switch" && "battle-sprite--switching",
          battleAnimation === "flee" && "battle-sprite--fleeing",
        )}>
          <img
            src={battleSpriteUrl(playerId, "back")}
            alt={`${player.nameEs} de espaldas`}
            className="pixelated"
            onError={(event) => {
              event.currentTarget.src = spriteUrl(playerId);
            }}
          />
        </div>

        <div className={cn(
          "battle-sprite battle-sprite--right",
          battleAnimation === "idle" && "battle-sprite--idle",
          battleAnimation === "enemy-attack" && "battle-sprite--attacking",
          battleAnimation === "enemy-hit" && "battle-sprite--hit",
          battleAnimation === "enemy-debuff" && "battle-sprite--debuff",
          battleAnimation === "flee" && "battle-sprite--fleeing",
        )}>
          <img
            src={battleSpriteUrl(encounter.id, "front")}
            alt={encounter.nameEs}
            className="pixelated"
            onError={(event) => {
              event.currentTarget.src = spriteUrl(encounter.id);
            }}
          />
        </div>

        <div className="battle-status battle-status--player">
          <div className="battle-status__heading">
            <span className="battle-status__name">{player.nameEs}</span>
            <span className="battle-status__level">Lv {playerLevel}</span>
          </div>
          <div className={cn(
            "battle-status__bar battle-status__bar--player",
            dangerMusic && "battle-status__bar--danger",
          )}>
            <span style={{ width: `${playerRatio}%` }} />
          </div>
          <div className="battle-status__bar battle-status__bar--xp">
            <span style={{ width: `${xpRatio}%` }} />
          </div>
          <span className="battle-status__hp">{playerHp} / {playerMaxHp} PS · {playerXp}/{xpThreshold} EXP</span>
        </div>
      </div>

      <div key={message} className="battle-message">{message}</div>

      {gameOver || (playerHp <= 0 && reservePokemon.length === 0) ? (
        <div className="battle-actions">
          <button type="button" onClick={restartBattle} className="btn-press battle-actions__btn battle-actions__btn--primary">Reintentar</button>
          <button type="button" onClick={onMenu} className="btn-press battle-actions__btn">Ir al menú</button>
        </div>
      ) : enemyDefeated ? (
        <button type="button" onClick={continueAfterWin} className="btn-press battle-actions__btn battle-actions__btn--primary">Continuar</button>
      ) : bagOpen ? (
        <div className="battle-inventory">
          <div className="battle-inventory__heading">
            <span>Mochila</span>
            <button type="button" onClick={() => { playClick(); setBagOpen(false); }} aria-label="Cerrar mochila">×</button>
          </div>
          {inventory.length === 0 ? (
            <p>La mochila está vacía.</p>
          ) : (
            inventory.map((item, index) => (
              <button key={`${item.name}-${index}`} type="button" onClick={() => handleBattleItem(index)}>
                <span>{item.name}</span><span>Usar</span>
              </button>
            ))
          )}
        </div>
      ) : partyOpen || playerHp <= 0 ? (
        <div className="battle-inventory battle-party">
          <div className="battle-inventory__heading">
            <span>Equipo {teamPokemon.length}/{PARTY_LIMIT}{playerHp <= 0 ? " · Elige otro" : ""}</span>
            {playerHp > 0 && <button type="button" onClick={() => { playClick(); setPartyOpen(false); }} aria-label="Cerrar equipo">×</button>}
          </div>
          {reservePokemon.length === 0 ? (
            <p>No quedan compañeros disponibles.</p>
          ) : (
            reservePokemon.map((pokemon) => (
              <button key={pokemon.id} type="button" onClick={() => choosePokemon(pokemon.id)}>
                <span className="battle-party__entry"><img src={battleSpriteUrl(pokemon.id, "front")} alt="" />{pokemon.nameEs}</span>
                <span>{pokemon.id === playerId ? "En combate" : "Elegir"}</span>
              </button>
            ))
          )}
        </div>
      ) : choosingMove ? (
        <div className="battle-actions battle-actions--moves">
          {moves.length > 0 ? moves.map((move) => (
              <button key={move} type="button" onClick={() => attack(move)} className="btn-press battle-actions__btn">
                {formatMoveName(move)}
              </button>
            )) : (
              <p className="battle-actions__loading">
                {playerQuery.isPending ? "Cargando movimientos…" : "No hay movimientos aprendidos a este nivel."}
              </p>
            )}
          <button type="button" onClick={() => { playClick(); setChoosingMove(false); }} className="btn-press battle-actions__back">
            Volver
          </button>
        </div>
      ) : (
        <div className="battle-actions">
          <button type="button" onClick={() => { playClick(); setChoosingMove(true); }} className="btn-press battle-actions__btn battle-actions__btn--primary">
            Luchar
          </button>
          <button type="button" onClick={() => { playClick(); setBagOpen(true); }} className="btn-press battle-actions__btn">
            Mochila
          </button>
          <button type="button" onClick={() => { playClick(); setPartyOpen(true); }} className="btn-press battle-actions__btn">
            Pokémon
          </button>
          <button type="button" onClick={flee} className="btn-press battle-actions__btn">
            Huir
          </button>
        </div>
      )}
    </div>
  );
}

type PokemonProgress = { level: number; xp: number };
type PokemonProgressMap = Record<number, PokemonProgress>;
type BattleAnimation = "idle" | "player-attack" | "enemy-hit" | "enemy-debuff" | "enemy-attack" | "player-hit" | "player-heal" | "player-switch" | "flee";
type BattleAnimationStep = {
  action: Exclude<BattleAnimation, "idle">;
  duration: number;
};

const STATUS_MOVE_EFFECTS: Record<string, { stat: "attack" | "defense"; stages: number; label: string }> = {
  growl: { stat: "attack", stages: 1, label: "ataque" },
  leer: { stat: "defense", stages: 1, label: "defensa" },
  "tail-whip": { stat: "defense", stages: 1, label: "defensa" },
  screech: { stat: "defense", stages: 2, label: "defensa" },
};

function stageMultiplier(stage: number) {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
}

function findLevelEvolution(chain: EvolutionNode[][], fromId: number, level: number) {
  return chain.flat().find((evolution) => {
    if (evolution.fromId !== fromId || !evolution.method) return false;
    const requiredLevel = evolution.method.match(/^Nv\.\s*(\d+)$/);
    return requiredLevel != null && Number(requiredLevel[1]) <= level;
  });
}

function findItemEvolution(chain: EvolutionNode[][], fromId: number, method: string) {
  return chain.flat().find(
    (evolution) => evolution.fromId === fromId && evolution.method === method,
  );
}

const BATTLE_PROGRESS_KEY = "pokedex-gen1-battle-progress";

function loadPokemonProgress(): PokemonProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(BATTLE_PROGRESS_KEY) ?? "{}");
    if (!saved || typeof saved !== "object") return {};
    const entries = Object.entries(saved).flatMap(([rawId, value]) => {
      const id = Number(rawId);
      if (!Number.isInteger(id) || id < 1 || id > MAX_DEX || !value || typeof value !== "object") return [];
      const progress = value as Record<string, unknown>;
      if (typeof progress.level !== "number" || typeof progress.xp !== "number") return [];
      return [[id, {
        level: Math.max(5, Math.floor(progress.level)),
        xp: Math.max(0, Math.floor(progress.xp)),
      }] as const];
    });
    return Object.fromEntries(entries) as PokemonProgressMap;
  } catch {
    return {};
  }
}

function savePokemonProgress(progress: PokemonProgressMap) {
  try {
    localStorage.setItem(BATTLE_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    return;
  }
}

const WORLD_ITEMS = [
  { name: "Poción", effect: "heal", power: 20 },
  { name: "Superpoción", effect: "heal", power: 40 },
  { name: "Poké Ball", effect: "catch", power: 0 },
  { name: "Cebo", effect: "attract", power: 0 },
] as const;

const EVOLUTION_STONES = [
  { name: "Piedra Fuego", effect: "evolution", method: "fire stone", power: 0 },
  { name: "Piedra Agua", effect: "evolution", method: "water stone", power: 0 },
  { name: "Piedra Trueno", effect: "evolution", method: "thunder stone", power: 0 },
  { name: "Piedra Hoja", effect: "evolution", method: "leaf stone", power: 0 },
  { name: "Piedra Lunar", effect: "evolution", method: "moon stone", power: 0 },
] as const;

type BattleItem = (typeof WORLD_ITEMS)[number] | (typeof EVOLUTION_STONES)[number];

function battleSpriteUrl(id: number, side: "front" | "back") {
  const root = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue";
  return side === "back"
    ? `${root}/transparent/back/${id}.png`
    : `${root}/transparent/${id}.png`;
}

function formatMoveName(move: string) {
  const spanishNames: Record<string, string> = {
    "water-gun": "Pistola Agua",
    "tail-whip": "Látigo",
    growl: "Gruñido",
    leer: "Malicioso",
    screech: "Chirrido",
    "poison-powder": "Polvo Veneno",
    "razor-leaf": "Hoja Afilada",
    "take-down": "Derribo",
    tackle: "Placaje",
    "bubble": "Burbuja",
    "quick-attack": "Ataque Rápido",
    "vine-whip": "Látigo Cepa",
    "thunder-shock": "Impactrueno",
    "body-slam": "Golpe Cuerpo",
    "double-edge": "Doble Filo",
  };
  return spanishNames[move] ?? move.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
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
    <div className="dex-professor-view">
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
