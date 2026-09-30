const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_POKEMON = 151;
const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cache simple en memoria para no saturar PokeAPI
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 min

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Validar ID o nombre dentro de los primeros 151
async function resolvePokemon(idOrName) {
  const key = String(idOrName).toLowerCase().trim();
  
  // Si es número
  if (/^\d+$/.test(key)) {
    const num = parseInt(key, 10);
    if (num < 1 || num > MAX_POKEMON) {
      const err = new Error(`Solo se permiten Pokémon del 1 al ${MAX_POKEMON}. El número ${num} está fuera de rango.`);
      err.status = 400;
      throw err;
    }
    return num;
  }

  // Buscar por nombre (solo gen 1)
  const cached = getCached(`name-${key}`);
  if (cached) return cached;

  try {
    const res = await axios.get(`${POKEAPI_BASE}/pokemon/${key}`);
    const id = res.data.id;
    if (id > MAX_POKEMON) {
      const err = new Error(`"${key}" es el Pokémon #${id}. Esta Pokédex solo incluye los primeros ${MAX_POKEMON} Pokémon de la Generación 1.`);
      err.status = 400;
      throw err;
    }
    setCache(`name-${key}`, id);
    return id;
  } catch (e) {
    if (e.status === 400) throw e;
    const err = new Error(`No se encontró ningún Pokémon llamado "${key}" en la Generación 1.`);
    err.status = 404;
    throw err;
  }
}

// Obtener datos completos de un Pokémon
async function getPokemonData(id) {
  const cacheKey = `pokemon-${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const [pokemonRes, speciesRes] = await Promise.all([
    axios.get(`${POKEAPI_BASE}/pokemon/${id}`),
    axios.get(`${POKEAPI_BASE}/pokemon-species/${id}`)
  ]);

  const p = pokemonRes.data;
  const s = speciesRes.data;

  // Descripción en español (o inglés de fallback)
  const flavor = s.flavor_text_entries.find(e => e.language.name === 'es') 
    || s.flavor_text_entries.find(e => e.language.name === 'en');
  
  // Nombre en español
  const nameEs = s.names.find(n => n.language.name === 'es')?.name || p.name;

  // Generación
  const generation = s.generation?.name || 'generation-i';

  // Tipos
  const types = p.types.map(t => ({
    name: t.type.name,
    slot: t.slot
  }));

  // Stats
  const stats = p.stats.map(st => ({
    name: st.stat.name,
    base: st.base_stat
  }));

  // Habilidades
  const abilities = p.abilities.map(a => ({
    name: a.ability.name,
    is_hidden: a.is_hidden
  }));

  // Movimientos destacados (primeros 4 de nivel 1 o similares)
  const moves = p.moves
    .filter(m => m.version_group_details.some(v => 
      v.version_group.name === 'red-blue' || v.version_group.name === 'yellow'
    ))
    .slice(0, 6)
    .map(m => m.move.name);

  // Sprite preferido (oficial artwork + gen1)
  const sprites = {
    front: p.sprites.front_default,
    back: p.sprites.back_default,
    official: p.sprites.other?.['official-artwork']?.front_default || p.sprites.front_default,
    animated: p.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default || null,
    gen1: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/${id}.png`,
    gen1_gray: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/gray/${id}.png`
  };

  // Cry (sonido)
  const cry = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;

  const data = {
    id: p.id,
    name: p.name,
    nameEs,
    height: p.height / 10, // metros
    weight: p.weight / 10, // kg
    base_experience: p.base_experience,
    types,
    stats,
    abilities,
    moves,
    sprites,
    cry,
    description: flavor ? flavor.flavor_text.replace(/[\n\f]/g, ' ') : 'Sin descripción disponible.',
    generation,
    is_legendary: s.is_legendary,
    is_mythical: s.is_mythical,
    habitat: s.habitat?.name || 'unknown',
    color: s.color?.name || 'unknown',
    shape: s.shape?.name || 'unknown',
    capture_rate: s.capture_rate,
    base_happiness: s.base_happiness,
    growth_rate: s.growth_rate?.name || 'unknown'
  };

  setCache(cacheKey, data);
  return data;
}

// ========== RUTAS API ==========

// Listar todos (solo ids y nombres básicos para el grid)
app.get('/api/pokemon', async (req, res) => {
  try {
    const cached = getCached('list-151');
    if (cached) return res.json(cached);

    const list = [];
    // PokeAPI permite limit=151
    const response = await axios.get(`${POKEAPI_BASE}/pokemon?limit=${MAX_POKEMON}&offset=0`);
    
    for (const item of response.data.results) {
      const id = parseInt(item.url.split('/').filter(Boolean).pop(), 10);
      list.push({
        id,
        name: item.name,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
      });
    }

    setCache('list-151', list);
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la lista de Pokémon' });
  }
});

// Obtener un Pokémon por id o nombre
app.get('/api/pokemon/:idOrName', async (req, res) => {
  try {
    const id = await resolvePokemon(req.params.idOrName);
    const data = await getPokemonData(id);
    res.json(data);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ 
      error: err.message || 'Error al obtener el Pokémon',
      max: MAX_POKEMON
    });
  }
});

// Pokémon aleatorio (para el quiz de sombras)
app.get('/api/random', async (req, res) => {
  try {
    const id = Math.floor(Math.random() * MAX_POKEMON) + 1;
    const data = await getPokemonData(id);
    // Devolvemos solo lo necesario para el quiz (sin revelar el nombre completo al cliente si se quiere, pero lo hacemos en frontend)
    res.json({
      id: data.id,
      name: data.name,
      nameEs: data.nameEs,
      sprite: data.sprites.official || data.sprites.front,
      silhouette: data.sprites.front // el frontend aplicará filtro CSS
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener Pokémon aleatorio' });
  }
});

// Buscar (misma lógica)
app.get('/api/search', async (req, res) => {
  const q = req.query.q;
  if (!q) {
    return res.status(400).json({ error: 'Debes proporcionar un término de búsqueda (?q=...)' });
  }
  try {
    const id = await resolvePokemon(q);
    const data = await getPokemonData(id);
    res.json(data);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ 
      error: err.message || 'Error en la búsqueda',
      max: MAX_POKEMON
    });
  }
});

// Fallback SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🔴 Pokédex Gen 1 corriendo en http://localhost:${PORT}`);
  console.log(`   Solo los primeros ${MAX_POKEMON} Pokémon\n`);
});
