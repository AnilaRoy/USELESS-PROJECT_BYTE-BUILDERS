// Rage Puzzle — Click & Drag Chaos (multi-puzzle)
// Added: multiple puzzle sets/themes. Twists may now switch the current puzzle set mid-game.

const modeSelect = document.getElementById('modeSelect');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const difficulty = document.getElementById('difficulty');

const boardWrapper = document.getElementById('boardWrapper');
const timeEl = document.getElementById('time');
const movesEl = document.getElementById('moves');
const accuracyEl = document.getElementById('accuracy');
const twistsEl = document.getElementById('twists');
const resultPanel = document.getElementById('resultPanel');
const resultText = document.getElementById('resultText');
const playAgainBtn = document.getElementById('playAgain');

let gameState = {
  active: false,
  mode: 'tiles',
  gridSize: 4,
  pairs: 8,
  startTime: null,
  timerInterval: null,
  twistInterval: null,
  moves: 0,
  attempts: 0,
  correct: 0,
  twists: 0,
  encounteredPuzzles: []
};

// ------------ PUZZLE SETS ------------
// Each set { id, modeHint, type: 'tiles'|'pairs', data: ... }
// For tiles: data = { values: [...], visual: 'numbers'|'emoji'|'colors' }
// For pairs: data = { values: [...] } (values are shown on pair backs)
const PUZZLE_SETS = [
  { id: 'numbers_asc', type: 'tiles', name: 'Numbers', data: { values: null, visual: 'numbers' }},
  { id: 'emoji_tiles', type: 'tiles', name: 'Emoji Tiles', data: { values: null, visual: 'emoji' }},
  { id: 'colors_tiles', type: 'tiles', name: 'Color Tiles', data: { values: null, visual: 'colors' }},
  { id: 'fruits_pairs', type: 'pairs', name: 'Fruity Pairs', data: { values: ['🍉','🍓','🍌','🍒','🥝','🍇','🍍','🍑','🍋','🍐','🥥','🍊'] } },
  { id: 'faces_pairs', type: 'pairs', name: 'Funny Faces', data: { values: ['😀','😅','😂','🤪','😎','😍','🤩','🤯','🥳','🤡','🤖','👻'] } }
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------- State for tile & pair gameplay ----------
let tileState = { order: [], correctOrder: [], visual: 'numbers' };
let pairState = { deck: [], revealed: [], matched: new Set() };
let currentSet = null;

// ---------- Build & switch puzzles ----------
function chooseRandomSetForMode(mode) {
  const candidates = PUZZLE_SETS.filter(s => s.type === mode);
  // pick one not equal to current if possible
  const options = candidates.filter(s => !currentSet || s.id !== currentSet.id);
  return options.length ? options[Math.floor(Math.random() * options.length)] : candidates[Math.floor(Math.random() * candidates.length)];
}

function buildBoard() {
  boardWrapper.innerHTML = '';
  resultPanel.hidden = true;

  if (gameState.mode === 'tiles') buildTileGrid();
  else buildPairsGrid();
}

// ---------- TILE GRID ----------
function buildTileGrid() {
  // difficulty => grid size
  const diff = difficulty.value;
  let n = diff === 'easy' ? 3 : diff === 'medium' ? 4 : 5;
  gameState.gridSize = n;
  const count = n * n;

  // choose puzzle set for tiles (possibly with theme)
  if (!currentSet || currentSet.type !== 'tiles') {
    currentSet = chooseRandomSetForMode('tiles');
    gameState.encounteredPuzzles.push(currentSet.name);
  }

  // build values depending on visual
  let values = Array.from({length: count}, (_, i) => i + 1);
  if (currentSet.data.visual === 'emoji') {
    // use an emoji bank, repeat if necessary
    const pool = ['🌟','🍀','⚡','🎈','🔥','💎','🌸','🍩','🍪','🎵','🍭','🍋','🍓','🍎','🥑','🍕','☕','🍔','🌈','🎮'];
    values = Array.from({length: count}, (_, i) => pool[i % pool.length]);
  } else if (currentSet.data.visual === 'colors') {
    const palette = [
      'linear-gradient(135deg,#ff7b7b,#ffb199)',
      'linear-gradient(135deg,#9be15d,#00e3ae)',
      'linear-gradient(135deg,#7afcff,#5c8cff)',
      'linear-gradient(135deg,#ffd86b,#ffb86b)',
      'linear-gradient(135deg,#c3a6ff,#7ae2ff)',
      'linear-gradient(135deg,#ff9db6,#ff8b4d)',
      'linear-gradient(135deg,#b8ffb2,#6be2ff)',
      'linear-gradient(135deg,#ffd1ff,#ffa3d1)'
    ];
    values = Array.from({length: count}, (_, i) => palette[i % palette.length]);
  }

  tileState.correctOrder = values.slice();
  tileState.order = shuffle(values.slice());

  tileState.visual = currentSet.data.visual || 'numbers';

  const grid = document.createElement('div');
  grid.className = 'grid';
  grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  grid.style.gap = '8px';
  grid.style.maxWidth = (n * 84) + 'px';

  tileState.order.forEach((val, idx) => {
    const tile = createTileElement(val, idx);
    grid.appendChild(tile);
  });

  grid.addEventListener('dragover', (e) => e.preventDefault());
  boardWrapper.appendChild(grid);

  renderTileGrid(grid);
}

function createTileElement(val, idx) {
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.draggable = true;
  tile.dataset.valueIndex = idx; // position index
  tile.dataset.value = typeof val === 'string' ? val : String(val);
  tile.style.height = tile.style.width = '72px';

  if (tileState.visual === 'colors') {
    tile.classList.add('colorTile');
    tile.style.background = val;
    tile.textContent = '';
  } else {
    tile.textContent = val;
  }

  tile.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', e.target.dataset.value);
    e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('dragging');
  });
  tile.addEventListener('dragend', (e) => e.target.classList.remove('dragging'));

  tile.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.target.classList.add('dragover');
  });
  tile.addEventListener('dragleave', (e) => e.target.classList.remove('dragover'));

  tile.addEventListener('drop', (e) => {
    e.preventDefault();
    const fromVal = e.dataTransfer.getData('text/plain');
    const toVal = e.target.dataset.value;
    swapTilesByValue(fromVal, toVal);
    renderTileGrid(tile.parentElement);
    registerMove();
  });

  return tile;
}

function swapTilesByValue(a, b) {
  const idxA = tileState.order.indexOf(a);
  const idxB = tileState.order.indexOf(b);
  if (idxA === -1 || idxB === -1) return;
  [tileState.order[idxA], tileState.order[idxB]] = [tileState.order[idxB], tileState.order[idxA]];
}

function renderTileGrid(grid) {
  grid.innerHTML = '';
  tileState.order.forEach((val, idx) => {
    const tile = createTileElement(val, idx);
    // mark correct
    if (String(val) === String(tileState.correctOrder[idx])) tile.classList.add('correct');
    grid.appendChild(tile);
  });
  checkTileCompletion();
}

function checkTileCompletion() {
  const allCorrect = tileState.order.every((v, i) => String(v) === String(tileState.correctOrder[i]));
  updateStatsUI();
  if (allCorrect && gameState.active) {
    endGame();
  }
}

// ---------- PAIRS GRID ----------
function buildPairsGrid() {
  // pairs from difficulty
  let pairs = difficulty.value === 'easy' ? 6 : difficulty.value === 'medium' ? 8 : 12;
  gameState.pairs = pairs;

  if (!currentSet || currentSet.type !== 'pairs') {
    // choose a pairs puzzle set
    currentSet = chooseRandomSetForMode('pairs');
    gameState.encounteredPuzzles.push(currentSet.name);
  }

  // prepare deck of emojis (truncate or reuse)
  const pool = currentSet.data.values.slice(0, pairs);
  let deck = shuffle([...pool, ...pool]);

  pairState.deck = deck;
  pairState.revealed = [];
  pairState.matched = new Set();

  const cols = Math.ceil(Math.sqrt(deck.length));
  const grid = document.createElement('div');
  grid.className = 'cards';
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  grid.style.maxWidth = (cols * 110) + 'px';

  deck.forEach((val, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = idx;

    const inner = document.createElement('div');
    inner.className = 'inner';

    const front = document.createElement('div');
    front.className = 'front';
    front.textContent = '';

    const back = document.createElement('div');
    back.className = 'back';
    back.textContent = val;

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    card.addEventListener('click', () => onCardClick(idx, card));
    grid.appendChild(card);
  });

  boardWrapper.appendChild(grid);
}

function onCardClick(index, cardEl) {
  if (!gameState.active) return;
  if (pairState.matched.has(index)) return;
  if (pairState.revealed.length === 2) return;

  cardEl.classList.add('flipped');
  pairState.revealed.push(index);

  if (pairState.revealed.length === 2) {
    gameState.attempts++;
    gameState.moves++;
    updateStatsUI();

    const [a, b] = pairState.revealed;
    if (pairState.deck[a] === pairState.deck[b]) {
      pairState.matched.add(a);
      pairState.matched.add(b);
      pairState.revealed = [];
      gameState.correct++;
      updateStatsUI();
      if (pairState.matched.size === pairState.deck.length) endGame();
    } else {
      setTimeout(() => {
        const cardA = document.querySelector(`.card[data-index='${a}']`);
        const cardB = document.querySelector(`.card[data-index='${b}']`);
        cardA && cardA.classList.remove('flipped');
        cardB && cardB.classList.remove('flipped');
        pairState.revealed = [];
        updateStatsUI();
      }, 700);
    }
  } else {
    gameState.moves++;
    updateStatsUI();
  }
}

// ---------- GAME FLOW & TWISTS ----------
function resetStats() {
  clearInterval(gameState.timerInterval);
  clearInterval(gameState.twistInterval);

  gameState.moves = 0;
  gameState.attempts = 0;
  gameState.correct = 0;
  gameState.twists = 0;
  gameState.startTime = null;
  gameState.encounteredPuzzles = [];
  timeEl.textContent = '00:00';
  movesEl.textContent = '0';
  accuracyEl.textContent = '100%';
  twistsEl.textContent = '0';
  resultPanel.hidden = true;
}

function startGame() {
  resetStats();
  gameState.mode = modeSelect.value;
  gameState.active = true;
  gameState.startTime = Date.now();
  gameState.encounteredPuzzles = [];
  // choose an initial puzzle set
  currentSet = chooseRandomSetForMode(gameState.mode);
  gameState.encounteredPuzzles.push(currentSet.name);

  buildBoard();
  startTimer();
  // small delay then start twists
  setTimeout(startTwistScheduler, 600);
}

function startTimer() {
  gameState.timerInterval = setInterval(() => {
    const elapsed = Date.now() - gameState.startTime;
    const mm = String(Math.floor(elapsed / 60000)).padStart(2, '0');
    const ss = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
    timeEl.textContent = `${mm}:${ss}`;
  }, 300);
}

function startTwistScheduler() {
  const base = 3000;
  const diffFactor = difficulty.value === 'easy' ? 1.3 : difficulty.value === 'medium' ? 1 : 0.8;
  const jitter = () => base * diffFactor + Math.random() * 1600 - 800;

  // use a self-resetting jittered schedule
  (function scheduleOnce() {
    gameState.twistInterval = setTimeout(() => {
      if (!gameState.active) return;
      performTwist();
      scheduleOnce();
    }, jitter());
  })();
}

function performTwist() {
  gameState.twists++;
  twistsEl.textContent = gameState.twists;
  boardWrapper.classList.add('jumble');
  setTimeout(() => boardWrapper.classList.remove('jumble'), 350);

  // 50% chance to switch to another puzzle set (change puzzle entirely)
  if (Math.random() < 0.5) {
    // pick a new set of the same mode (or sometimes switch mode)
    if (Math.random() < 0.15) {
      // small chance to flip mode unexpectedly
      gameState.mode = gameState.mode === 'tiles' ? 'pairs' : 'tiles';
    }
    const newSet = chooseRandomSetForMode(gameState.mode);
    currentSet = newSet;
    gameState.encounteredPuzzles.push(newSet.name);
    // rebuild board to reflect new set
    buildBoard();
    // small visual cue on tiles/cards
    const el = boardWrapper.querySelector('.tile, .card');
    if (el) { el.classList.add('jumble-anim'); setTimeout(() => el.classList.remove('jumble-anim'), 500); }
    registerMove(); // counts as a chaotic move
    return;
  }

  // otherwise perform an in-place jumble
  if (gameState.mode === 'tiles') {
    const n = tileState.order.length;
    const swaps = Math.max(1, Math.floor(Math.random() * Math.min(4, n)));
    for (let i = 0; i < swaps; i++) {
      const a = Math.floor(Math.random() * n);
      const b = Math.floor(Math.random() * n);
      const valA = tileState.order[a];
      const valB = tileState.order[b];
      if (valA !== undefined && valB !== undefined) swapTilesByValue(valA, valB);
    }
    const grid = document.querySelector('.grid');
    if (grid) {
      renderTileGrid(grid);
      const tiles = grid.querySelectorAll('.tile');
      if (tiles.length) {
        const t = tiles[Math.floor(Math.random() * tiles.length)];
        t.classList.add('jumble-anim');
        setTimeout(() => t.classList.remove('jumble-anim'), 500);
      }
    }
  } else {
    // pairs: flip back revealed and shuffle unmatched
    pairState.revealed.forEach(i => {
      const c = document.querySelector(`.card[data-index='${i}']`);
      c && c.classList.remove('flipped');
    });
    pairState.revealed = [];

    const unmatched = pairState.deck.filter((_, i) => !pairState.matched.has(i));
    const shuffled = shuffle(unmatched);
    // rebuild deck keeping matched positions
    const newDeck = pairState.deck.map((v, idx) => pairState.matched.has(idx) ? v : shuffled.pop());
    pairState.deck = newDeck;
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, i) => {
      const back = card.querySelector('.back');
      if (back) back.textContent = pairState.deck[i];
      card.classList.remove('flipped');
    });
  }
  registerMove();
}

function registerMove() {
  gameState.moves++;
  updateStatsUI();
}

function updateStatsUI() {
  movesEl.textContent = String(gameState.moves);
  let accuracy = 100;
  if (gameState.mode === 'pairs') {
    const attempts = gameState.attempts || 0;
    accuracy = attempts === 0 ? 100 : Math.round((gameState.correct / attempts) * 100);
  } else {
    const total = tileState.order.length || 1;
    const correctCount = tileState.order.reduce((acc, v, i) => acc + (String(v) === String(tileState.correctOrder[i]) ? 1 : 0), 0);
    accuracy = Math.round((correctCount / total) * 100);
  }
  accuracyEl.textContent = accuracy + '%';
  twistsEl.textContent = String(gameState.twists);
}

function endGame() {
  gameState.active = false;
  clearInterval(gameState.timerInterval);
  clearTimeout(gameState.twistInterval);

  updateStatsUI();

  // compute rating
  const acc = parseInt(accuracyEl.textContent, 10);
  const t = gameState.twists;
  let rating = '';
  if (t > 12 || acc < 30) rating = '🔥 Rage Quit Level 5 — Unhinged Typist';
  else if (t > 7 || acc < 50) rating = '⚡ Keyboard Warrior — Slightly Unhinged';
  else if (t > 3) rating = '😅 Survived The Chaos — Steady Hands';
  else rating = '🙂 Calm Puzzle Master — Respect!';

  resultPanel.hidden = false;
  resultText.textContent = `${rating}\nTime: ${timeEl.textContent} • Moves: ${movesEl.textContent} • Accuracy: ${accuracyEl.textContent} • Twists: ${twistsEl.textContent}\nPuzzles encountered: ${gameState.encounteredPuzzles.join(' → ')}`;
}

// ---------- Reset ----------
function resetGame() {
  clearInterval(gameState.timerInterval);
  clearTimeout(gameState.twistInterval);
  gameState.active = false;
  tileState = { order: [], correctOrder: [], visual: 'numbers' };
  pairState = { deck: [], revealed: [], matched: new Set() };
  boardWrapper.innerHTML = `<div style="color:var(--muted)">Press Start to play. Choose mode & difficulty.</div>`;
  resetStats();
}

// ---------- Event hooks ----------
startBtn.addEventListener('click', () => { startGame(); });
resetBtn.addEventListener('click', resetGame);
playAgainBtn && playAgainBtn.addEventListener('click', () => { resetGame(); startGame(); });

// initial render
resetGame();
function startTimer() {
  gameState.timerInterval = setInterval(() => {
    const elapsed = Date.now() - gameState.startTime;
    if (elapsed >= 60000) {  // 60 seconds
      clearInterval(gameState.timerInterval);
      clearTimeout(gameState.twistInterval);
      gameState.active = false;
      alert('Time is up! Thanks for playing.');
      // Optionally, you can show your result panel here or trigger endGame()
      // endGame(); 
      return;
    }
    const mm = String(Math.floor(elapsed / 60000)).padStart(2, '0');
    const ss = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
    timeEl.textContent = `${mm}:${ss}`;
  }, 300);
}

