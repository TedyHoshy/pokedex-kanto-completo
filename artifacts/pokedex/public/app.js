/* ===== Pokédex Gen 1 - Frontend ===== */

const API = '/api';
let currentPokemon = null;
let quizPokemon = null;
let scoreCorrect = 0;
let scoreWrong = 0;
let allPokemon = [];

// DOM
const views = {
  home: document.getElementById('view-home'),
  detail: document.getElementById('view-detail'),
  quiz: document.getElementById('view-quiz')
};

const grid = document.getElementById('pokemon-grid');
const detailContent = document.getElementById('detail-content');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const errorMsg = document.getElementById('error-msg');
const cryAudio = document.getElementById('cry-audio');

// ===== UTILIDADES =====
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
  setTimeout(() => errorMsg.classList.add('hidden'), 5000);
}

function hideError() {
  errorMsg.classList.add('hidden');
}

function switchView(name) {
  Object.values(views).forEach(v => v.classList.remove('active'));
  views[name].classList.add('active');

  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.view === name);
  });

  if (name === 'quiz' && !quizPokemon) {
    loadQuizPokemon();
  }
}

function playCry(url) {
  if (!url) return;
  cryAudio.src = url;
  cryAudio.play().catch(() => {
    // Algunos navegadores bloquean autoplay; el usuario ya interactuó normalmente
  });
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function formatStatName(name) {
  const map = {
    hp: 'PS',
    attack: 'Ataque',
    defense: 'Defensa',
    'special-attack': 'At. Esp.',
    'special-defense': 'Def. Esp.',
    speed: 'Velocidad'
  };
  return map[name] || name;
}

// ===== CARGAR LISTA =====
async function loadPokemonList() {
  try {
    const res = await fetch(`${API}/pokemon`);
    if (!res.ok) throw new Error('Error de red');
    allPokemon = await res.json();
    renderGrid(allPokemon);
  } catch (err) {
    grid.innerHTML = `<div class="loading">Error al cargar. ¿Está el servidor corriendo?</div>`;
    console.error(err);
  }
}

function renderGrid(list) {
  if (!list.length) {
    grid.innerHTML = `<div class="loading">No se encontraron Pokémon</div>`;
    return;
  }

  grid.innerHTML = list.map(p => `
    <div class="poke-card" data-id="${p.id}">
      <div class="num">#${String(p.id).padStart(3, '0')}</div>
      <img src="${p.sprite}" alt="${p.name}" loading="lazy" 
           onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png'" />
      <div class="name">${p.name}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.poke-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      showPokemonDetail(id);
    });
  });
}

// ===== DETALLE =====
async function showPokemonDetail(idOrName) {
  hideError();
  switchView('detail');
  detailContent.innerHTML = `<div class="loading">Cargando datos...</div>`;

  try {
    const res = await fetch(`${API}/pokemon/${encodeURIComponent(idOrName)}`);
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Error desconocido');
      detailContent.innerHTML = `<div class="loading">${data.error}</div>`;
      return;
    }

    currentPokemon = data;
    renderDetail(data);
  } catch (err) {
    detailContent.innerHTML = `<div class="loading">Error de conexión</div>`;
    console.error(err);
  }
}

function renderDetail(p) {
  const maxStat = 255;
  const typesHtml = p.types.map(t => 
    `<span class="type-badge type-${t.name}">${t.name}</span>`
  ).join('');

  const statsHtml = p.stats.map(s => {
    const pct = Math.min(100, (s.base / maxStat) * 100);
    return `
      <div class="stat-row">
        <span class="stat-label">${formatStatName(s.name)}</span>
        <div class="stat-bar-bg"><div class="stat-bar" style="width:${pct}%"></div></div>
        <span class="stat-value">${s.base}</span>
      </div>
    `;
  }).join('');

  const abilitiesHtml = p.abilities.map(a => 
    `<span class="ability-tag ${a.is_hidden ? 'hidden-ability' : ''}">${a.name}${a.is_hidden ? ' ★' : ''}</span>`
  ).join('');

  const movesHtml = (p.moves || []).slice(0, 6).map(m => 
    `<span class="move-tag">${m}</span>`
  ).join('') || '<span class="move-tag">—</span>';

  const sprite = p.sprites.official || p.sprites.front || p.sprites.gen1;

  detailContent.innerHTML = `
    <div class="detail-header">
      <div class="detail-sprite-box">
        <img src="${sprite}" alt="${p.name}" 
             onerror="this.src='${p.sprites.front}'" />
      </div>
      <div class="detail-id">Nº ${String(p.id).padStart(3, '0')}</div>
      <div class="detail-name">${capitalize(p.name)}</div>
      ${p.nameEs && p.nameEs.toLowerCase() !== p.name ? 
        `<div class="detail-name-es">${p.nameEs}</div>` : ''}
    </div>

    <div class="types-row">${typesHtml}</div>

    <div class="info-grid">
      <div class="info-item"><span>Altura</span>${p.height} m</div>
      <div class="info-item"><span>Peso</span>${p.weight} kg</div>
      <div class="info-item"><span>Exp. Base</span>${p.base_experience || '—'}</div>
      <div class="info-item"><span>Captura</span>${p.capture_rate}</div>
      <div class="info-item"><span>Hábitat</span>${capitalize(p.habitat)}</div>
      <div class="info-item"><span>Color</span>${capitalize(p.color)}</div>
    </div>

    <div class="description-box">
      ${p.description}
    </div>

    <div class="stats-section">
      <h3>Estadísticas Base</h3>
      ${statsHtml}
    </div>

    <div class="stats-section">
      <h3>Habilidades</h3>
      <div class="abilities-list">${abilitiesHtml}</div>
    </div>

    <div class="stats-section">
      <h3>Movimientos (Gen 1)</h3>
      <div class="moves-list">${movesHtml}</div>
    </div>

    <button class="sound-btn-detail" id="play-cry-btn">
      🔊 Escuchar grito
    </button>
  `;

  document.getElementById('play-cry-btn').addEventListener('click', () => {
    playCry(p.cry);
  });
}

// ===== BÚSQUEDA =====
async function doSearch() {
  const q = searchInput.value.trim();
  if (!q) {
    showError('Escribe un número (1-151) o un nombre de Pokémon');
    return;
  }

  // Validación rápida de número
  if (/^\d+$/.test(q)) {
    const num = parseInt(q, 10);
    if (num < 1 || num > 151) {
      showError(`¡Error! Solo existen 151 Pokémon en esta Pokédex. El número ${num} está fuera de rango.`);
      return;
    }
  }

  hideError();
  await showPokemonDetail(q);
}

// ===== QUIZ DE SOMBRAS =====
async function loadQuizPokemon() {
  const silImg = document.getElementById('quiz-silhouette');
  const resultBox = document.getElementById('quiz-result');
  const guessInput = document.getElementById('quiz-guess');

  silImg.classList.remove('revealed');
  silImg.src = '';
  resultBox.classList.add('hidden');
  resultBox.classList.remove('correct', 'wrong');
  guessInput.value = '';
  quizPokemon = null;

  try {
    const res = await fetch(`${API}/random`);
    if (!res.ok) throw new Error('Error');
    quizPokemon = await res.json();
    silImg.src = quizPokemon.sprite;
    silImg.alt = 'Sombra misteriosa';
  } catch (err) {
    console.error(err);
    resultBox.textContent = 'Error al cargar el Pokémon. Intenta de nuevo.';
    resultBox.classList.remove('hidden');
  }
}

function checkQuizGuess() {
  if (!quizPokemon) return;

  const guess = document.getElementById('quiz-guess').value.trim().toLowerCase();
  const resultBox = document.getElementById('quiz-result');
  const silImg = document.getElementById('quiz-silhouette');

  if (!guess) {
    resultBox.textContent = '¡Escribe un nombre!';
    resultBox.classList.remove('hidden', 'correct');
    resultBox.classList.add('wrong');
    return;
  }

  const correctNames = [
    quizPokemon.name.toLowerCase(),
    (quizPokemon.nameEs || '').toLowerCase()
  ].filter(Boolean);

  const isCorrect = correctNames.includes(guess) || 
                    correctNames.some(n => n.startsWith(guess) && guess.length >= 3);

  silImg.classList.add('revealed');
  resultBox.classList.remove('hidden');

  if (isCorrect) {
    scoreCorrect++;
    resultBox.classList.remove('wrong');
    resultBox.classList.add('correct');
    resultBox.innerHTML = `¡Correcto! Es <strong>${capitalize(quizPokemon.name)}</strong> (#${String(quizPokemon.id).padStart(3,'0')})`;
    // Reproducir grito al acertar
    fetch(`${API}/pokemon/${quizPokemon.id}`)
      .then(r => r.json())
      .then(d => playCry(d.cry))
      .catch(() => {});
  } else {
    scoreWrong++;
    resultBox.classList.remove('correct');
    resultBox.classList.add('wrong');
    resultBox.innerHTML = `Incorrecto... Era <strong>${capitalize(quizPokemon.name)}</strong> (#${String(quizPokemon.id).padStart(3,'0')})`;
  }

  document.getElementById('score-correct').textContent = scoreCorrect;
  document.getElementById('score-wrong').textContent = scoreWrong;
}

function revealQuiz() {
  if (!quizPokemon) return;
  const silImg = document.getElementById('quiz-silhouette');
  const resultBox = document.getElementById('quiz-result');
  silImg.classList.add('revealed');
  resultBox.classList.remove('hidden', 'correct', 'wrong');
  resultBox.style.background = '#5a7a5a';
  resultBox.style.color = '#fff';
  resultBox.innerHTML = `Es <strong>${capitalize(quizPokemon.name)}</strong> (#${String(quizPokemon.id).padStart(3,'0')})`;
}

// ===== EVENTOS =====
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => switchView(tab.dataset.view));
});

document.getElementById('back-to-list').addEventListener('click', () => {
  switchView('home');
  currentPokemon = null;
});

searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') doSearch();
});

document.getElementById('quiz-submit').addEventListener('click', checkQuizGuess);
document.getElementById('quiz-guess').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkQuizGuess();
});
document.getElementById('quiz-next').addEventListener('click', loadQuizPokemon);
document.getElementById('quiz-reveal').addEventListener('click', revealQuiz);

// Botones físicos
document.getElementById('btn-sound').addEventListener('click', () => {
  if (currentPokemon && currentPokemon.cry) {
    playCry(currentPokemon.cry);
  } else if (quizPokemon) {
    // Si estamos en quiz y ya se reveló, intentar
    fetch(`${API}/pokemon/${quizPokemon.id}`)
      .then(r => r.json())
      .then(d => playCry(d.cry));
  }
});

document.getElementById('btn-random').addEventListener('click', async () => {
  const id = Math.floor(Math.random() * 151) + 1;
  await showPokemonDetail(id);
});

// ===== INICIO =====
loadPokemonList();
