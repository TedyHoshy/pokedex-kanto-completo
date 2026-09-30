export const MAX_DEX = 151;

export const RANGE_ERROR =
  "Error: Esta Pokédex solo contiene los primeros 151 Pokémon de la primera generación.";

export const TYPE_LABELS: Record<string, string> = {
  normal: "Normal",
  fire: "Fuego",
  water: "Agua",
  electric: "Eléctrico",
  grass: "Planta",
  ice: "Hielo",
  fighting: "Lucha",
  poison: "Veneno",
  ground: "Tierra",
  flying: "Volador",
  psychic: "Psíquico",
  bug: "Bicho",
  rock: "Roca",
  ghost: "Fantasma",
  dragon: "Dragón",
  dark: "Siniestro",
  steel: "Acero",
  fairy: "Hada",
};

export const TYPE_CLASS: Record<string, string> = {
  normal: "bg-type-normal text-pk-ink",
  fire: "bg-type-fire text-white",
  water: "bg-type-water text-white",
  electric: "bg-type-electric text-pk-ink",
  grass: "bg-type-grass text-pk-ink",
  ice: "bg-type-ice text-pk-ink",
  fighting: "bg-type-fighting text-white",
  poison: "bg-type-poison text-white",
  ground: "bg-type-ground text-pk-ink",
  flying: "bg-type-flying text-white",
  psychic: "bg-type-psychic text-white",
  bug: "bg-type-bug text-pk-ink",
  rock: "bg-type-rock text-white",
  ghost: "bg-type-ghost text-white",
  dragon: "bg-type-dragon text-white",
  dark: "bg-type-dark text-white",
  steel: "bg-type-steel text-pk-ink",
  fairy: "bg-type-fairy text-pk-ink",
};

export type CatalogEntry = {
  id: number;
  name: string;
  nameEs: string;
  types: string[];
};

type Row = [number, string, string, string[]];

const ROWS: Row[] = [
  [1, "bulbasaur", "Bulbasaur", ["grass", "poison"]],
  [2, "ivysaur", "Ivysaur", ["grass", "poison"]],
  [3, "venusaur", "Venusaur", ["grass", "poison"]],
  [4, "charmander", "Charmander", ["fire"]],
  [5, "charmeleon", "Charmeleon", ["fire"]],
  [6, "charizard", "Charizard", ["fire", "flying"]],
  [7, "squirtle", "Squirtle", ["water"]],
  [8, "wartortle", "Wartortle", ["water"]],
  [9, "blastoise", "Blastoise", ["water"]],
  [10, "caterpie", "Caterpie", ["bug"]],
  [11, "metapod", "Metapod", ["bug"]],
  [12, "butterfree", "Butterfree", ["bug", "flying"]],
  [13, "weedle", "Weedle", ["bug", "poison"]],
  [14, "kakuna", "Kakuna", ["bug", "poison"]],
  [15, "beedrill", "Beedrill", ["bug", "poison"]],
  [16, "pidgey", "Pidgey", ["normal", "flying"]],
  [17, "pidgeotto", "Pidgeotto", ["normal", "flying"]],
  [18, "pidgeot", "Pidgeot", ["normal", "flying"]],
  [19, "rattata", "Rattata", ["normal"]],
  [20, "raticate", "Raticate", ["normal"]],
  [21, "spearow", "Spearow", ["normal", "flying"]],
  [22, "fearow", "Fearow", ["normal", "flying"]],
  [23, "ekans", "Ekans", ["poison"]],
  [24, "arbok", "Arbok", ["poison"]],
  [25, "pikachu", "Pikachu", ["electric"]],
  [26, "raichu", "Raichu", ["electric"]],
  [27, "sandshrew", "Sandshrew", ["ground"]],
  [28, "sandslash", "Sandslash", ["ground"]],
  [29, "nidoran-f", "Nidoran♀", ["poison"]],
  [30, "nidorina", "Nidorina", ["poison"]],
  [31, "nidoqueen", "Nidoqueen", ["poison", "ground"]],
  [32, "nidoran-m", "Nidoran♂", ["poison"]],
  [33, "nidorino", "Nidorino", ["poison"]],
  [34, "nidoking", "Nidoking", ["poison", "ground"]],
  [35, "clefairy", "Clefairy", ["fairy"]],
  [36, "clefable", "Clefable", ["fairy"]],
  [37, "vulpix", "Vulpix", ["fire"]],
  [38, "ninetales", "Ninetales", ["fire"]],
  [39, "jigglypuff", "Jigglypuff", ["normal", "fairy"]],
  [40, "wigglytuff", "Wigglytuff", ["normal", "fairy"]],
  [41, "zubat", "Zubat", ["poison", "flying"]],
  [42, "golbat", "Golbat", ["poison", "flying"]],
  [43, "oddish", "Oddish", ["grass", "poison"]],
  [44, "gloom", "Gloom", ["grass", "poison"]],
  [45, "vileplume", "Vileplume", ["grass", "poison"]],
  [46, "paras", "Paras", ["bug", "grass"]],
  [47, "parasect", "Parasect", ["bug", "grass"]],
  [48, "venonat", "Venonat", ["bug", "poison"]],
  [49, "venomoth", "Venomoth", ["bug", "poison"]],
  [50, "diglett", "Diglett", ["ground"]],
  [51, "dugtrio", "Dugtrio", ["ground"]],
  [52, "meowth", "Meowth", ["normal"]],
  [53, "persian", "Persian", ["normal"]],
  [54, "psyduck", "Psyduck", ["water"]],
  [55, "golduck", "Golduck", ["water"]],
  [56, "mankey", "Mankey", ["fighting"]],
  [57, "primeape", "Primeape", ["fighting"]],
  [58, "growlithe", "Growlithe", ["fire"]],
  [59, "arcanine", "Arcanine", ["fire"]],
  [60, "poliwag", "Poliwag", ["water"]],
  [61, "poliwhirl", "Poliwhirl", ["water"]],
  [62, "poliwrath", "Poliwrath", ["water", "fighting"]],
  [63, "abra", "Abra", ["psychic"]],
  [64, "kadabra", "Kadabra", ["psychic"]],
  [65, "alakazam", "Alakazam", ["psychic"]],
  [66, "machop", "Machop", ["fighting"]],
  [67, "machoke", "Machoke", ["fighting"]],
  [68, "machamp", "Machamp", ["fighting"]],
  [69, "bellsprout", "Bellsprout", ["grass", "poison"]],
  [70, "weepinbell", "Weepinbell", ["grass", "poison"]],
  [71, "victreebel", "Victreebel", ["grass", "poison"]],
  [72, "tentacool", "Tentacool", ["water", "poison"]],
  [73, "tentacruel", "Tentacruel", ["water", "poison"]],
  [74, "geodude", "Geodude", ["rock", "ground"]],
  [75, "graveler", "Graveler", ["rock", "ground"]],
  [76, "golem", "Golem", ["rock", "ground"]],
  [77, "ponyta", "Ponyta", ["fire"]],
  [78, "rapidash", "Rapidash", ["fire"]],
  [79, "slowpoke", "Slowpoke", ["water", "psychic"]],
  [80, "slowbro", "Slowbro", ["water", "psychic"]],
  [81, "magnemite", "Magnemite", ["electric", "steel"]],
  [82, "magneton", "Magneton", ["electric", "steel"]],
  [83, "farfetchd", "Farfetch'd", ["normal", "flying"]],
  [84, "doduo", "Doduo", ["normal", "flying"]],
  [85, "dodrio", "Dodrio", ["normal", "flying"]],
  [86, "seel", "Seel", ["water"]],
  [87, "dewgong", "Dewgong", ["water", "ice"]],
  [88, "grimer", "Grimer", ["poison"]],
  [89, "muk", "Muk", ["poison"]],
  [90, "shellder", "Shellder", ["water"]],
  [91, "cloyster", "Cloyster", ["water", "ice"]],
  [92, "gastly", "Gastly", ["ghost", "poison"]],
  [93, "haunter", "Haunter", ["ghost", "poison"]],
  [94, "gengar", "Gengar", ["ghost", "poison"]],
  [95, "onix", "Onix", ["rock", "ground"]],
  [96, "drowzee", "Drowzee", ["psychic"]],
  [97, "hypno", "Hypno", ["psychic"]],
  [98, "krabby", "Krabby", ["water"]],
  [99, "kingler", "Kingler", ["water"]],
  [100, "voltorb", "Voltorb", ["electric"]],
  [101, "electrode", "Electrode", ["electric"]],
  [102, "exeggcute", "Exeggcute", ["grass", "psychic"]],
  [103, "exeggutor", "Exeggutor", ["grass", "psychic"]],
  [104, "cubone", "Cubone", ["ground"]],
  [105, "marowak", "Marowak", ["ground"]],
  [106, "hitmonlee", "Hitmonlee", ["fighting"]],
  [107, "hitmonchan", "Hitmonchan", ["fighting"]],
  [108, "lickitung", "Lickitung", ["normal"]],
  [109, "koffing", "Koffing", ["poison"]],
  [110, "weezing", "Weezing", ["poison"]],
  [111, "rhyhorn", "Rhyhorn", ["ground", "rock"]],
  [112, "rhydon", "Rhydon", ["ground", "rock"]],
  [113, "chansey", "Chansey", ["normal"]],
  [114, "tangela", "Tangela", ["grass"]],
  [115, "kangaskhan", "Kangaskhan", ["normal"]],
  [116, "horsea", "Horsea", ["water"]],
  [117, "seadra", "Seadra", ["water"]],
  [118, "goldeen", "Goldeen", ["water"]],
  [119, "seaking", "Seaking", ["water"]],
  [120, "staryu", "Staryu", ["water"]],
  [121, "starmie", "Starmie", ["water", "psychic"]],
  [122, "mr-mime", "Mr. Mime", ["psychic", "fairy"]],
  [123, "scyther", "Scyther", ["bug", "flying"]],
  [124, "jynx", "Jynx", ["ice", "psychic"]],
  [125, "electabuzz", "Electabuzz", ["electric"]],
  [126, "magmar", "Magmar", ["fire"]],
  [127, "pinsir", "Pinsir", ["bug"]],
  [128, "tauros", "Tauros", ["normal"]],
  [129, "magikarp", "Magikarp", ["water"]],
  [130, "gyarados", "Gyarados", ["water", "flying"]],
  [131, "lapras", "Lapras", ["water", "ice"]],
  [132, "ditto", "Ditto", ["normal"]],
  [133, "eevee", "Eevee", ["normal"]],
  [134, "vaporeon", "Vaporeon", ["water"]],
  [135, "jolteon", "Jolteon", ["electric"]],
  [136, "flareon", "Flareon", ["fire"]],
  [137, "porygon", "Porygon", ["normal"]],
  [138, "omanyte", "Omanyte", ["rock", "water"]],
  [139, "omastar", "Omastar", ["rock", "water"]],
  [140, "kabuto", "Kabuto", ["rock", "water"]],
  [141, "kabutops", "Kabutops", ["rock", "water"]],
  [142, "aerodactyl", "Aerodactyl", ["rock", "flying"]],
  [143, "snorlax", "Snorlax", ["normal"]],
  [144, "articuno", "Articuno", ["ice", "flying"]],
  [145, "zapdos", "Zapdos", ["electric", "flying"]],
  [146, "moltres", "Moltres", ["fire", "flying"]],
  [147, "dratini", "Dratini", ["dragon"]],
  [148, "dragonair", "Dragonair", ["dragon"]],
  [149, "dragonite", "Dragonite", ["dragon", "flying"]],
  [150, "mewtwo", "Mewtwo", ["psychic"]],
  [151, "mew", "Mew", ["psychic"]],
];

export const CATALOG: CatalogEntry[] = ROWS.map(([id, name, nameEs, types]) => ({
  id,
  name,
  nameEs,
  types,
}));

export const FILTER_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "steel",
  "fairy",
];

export function spriteUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function artworkUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function cryUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
}

export function animatedGifUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`;
}

export function findInCatalog(query: string): CatalogEntry | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  if (/^\d+$/.test(q)) {
    const n = Number(q);
    return CATALOG.find((p) => p.id === n);
  }
  const compact = q.replace(/[.'♀♂\s]/g, "");
  return CATALOG.find((p) => {
    const name = p.name.toLowerCase();
    const es = p.nameEs.toLowerCase();
    return (
      name === q ||
      es === q ||
      name.replace(/-/g, "") === compact ||
      es.replace(/[.'♀♂\s]/g, "").toLowerCase() === compact
    );
  });
}

export function suggestCatalog(query: string, limit = 6): CatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  if (/^\d+$/.test(q)) {
    return CATALOG.filter((p) => String(p.id).startsWith(q)).slice(0, limit);
  }
  const compact = q.replace(/[.'♀♂\s]/g, "");
  const scored = CATALOG.map((p) => {
    const name = p.name.toLowerCase();
    const es = p.nameEs.toLowerCase();
    let score = 0;
    if (name.startsWith(q) || es.toLowerCase().startsWith(q)) score = 3;
    else if (name.includes(q) || es.toLowerCase().includes(q)) score = 2;
    else if (name.replace(/-/g, "").includes(compact)) score = 1;
    return { p, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.p.id - b.p.id);
  return scored.slice(0, limit).map((x) => x.p);
}
