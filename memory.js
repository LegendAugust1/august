// ═══════════════════════════
//  MEMORY CARD GAME
// ═══════════════════════════

const MEM_KEY  = 'rblx_memory_best';
const MEM_EMOJIS = [
  '🎮','🚀','🌟','🎯','🔥','💎','🌈','⚡',
  '🦄','🐉','🍀','🎸','🏆','🎪','🌙','🦋'
];

let memCards      = [];   // [{id, emoji, flipped, matched}]
let memFlipped    = [];   // indices currently face-up (max 2)
let memMoves      = 0;
let memPairsFound = 0;
let memTimerV     = 0;
let memTimerI     = null;
let memLocked     = false;
let memState      = 'idle'; // idle | playing | won

function memInit() {
  memLoadBest();
  memNewGame();
}

function memNewGame() {
  if (memTimerI) clearInterval(memTimerI);
  memMoves      = 0;
  memPairsFound = 0;
  memTimerV     = 0;
  memLocked     = false;
  memState      = 'idle';
  memFlipped    = [];

  // build 32 cards (16 pairs)
  const pool = [...MEM_EMOJIS, ...MEM_EMOJIS];
  // shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  memCards = pool.map((emoji, i) => ({ id:i, emoji, flipped:false, matched:false }));

  const msg = document.getElementById('memMsg');
  if (msg) { msg.textContent = ''; msg.style.color = ''; }
  memUpdateUI();
  memRender();
}

function memRender() {
  const grid = document.getElementById('memoryGrid');
  if (!grid) return;
  grid.innerHTML = memCards.map((card, idx) => {
    const fCls = card.flipped || card.matched ? 'flipped' : '';
    const mCls = card.matched ? 'matched' : '';
    return `<div class="mem-card ${fCls} ${mCls}" data-idx="${idx}" onclick="memFlipCard(${idx})">
      <div class="mem-card-front"></div>
      <div class="mem-card-back">${card.emoji}</div>
    </div>`;
  }).join('');
}

function memFlipCard(idx) {
  if (memLocked) return;
  const card = memCards[idx];
  if (card.flipped || card.matched) return;
  if (memFlipped.length >= 2) return;

  // start timer on first flip
  if (memState === 'idle') {
    memState = 'playing';
    memTimerI = setInterval(() => { memTimerV++; memUpdateUI(); }, 1000);
  }

  card.flipped = true;
  memFlipped.push(idx);
  memRender();

  if (memFlipped.length === 2) {
    memMoves++;
    memLocked = true;
    const [a, b] = memFlipped;
    if (memCards[a].emoji === memCards[b].emoji) {
      // match!
      setTimeout(() => {
        memCards[a].matched = true;
        memCards[b].matched = true;
        memCards[a].flipped = false;
        memCards[b].flipped = false;
        memFlipped = [];
        memLocked  = false;
        memPairsFound++;
        memUpdateUI();
        memRender();
        if (memPairsFound === 16) memWin();
      }, 380);
    } else {
      // no match — flip back
      setTimeout(() => {
        memCards[a].flipped = false;
        memCards[b].flipped = false;
        memFlipped = [];
        memLocked  = false;
        memUpdateUI();
        memRender();
      }, 900);
    }
  }
  memUpdateUI();
}

function memWin() {
  memState = 'won';
  clearInterval(memTimerI);

  // save best (fewer moves = better)
  const prev = parseInt(localStorage.getItem(MEM_KEY) || '9999');
  if (memMoves < prev) localStorage.setItem(MEM_KEY, memMoves);
  memLoadBest();
  if (typeof updateHubScores === 'function') updateHubScores();

  const stars = memMoves <= 20 ? '⭐⭐⭐' : memMoves <= 30 ? '⭐⭐' : memMoves <= 45 ? '⭐' : '😅';
  const msg = document.getElementById('memMsg');
  if (msg) {
    msg.textContent = `🎉 Hoàn thành! ${stars}  ${memMoves} lượt · ${memTimerV}s`;
    msg.style.color = 'var(--green)';
  }
}

function memUpdateUI() {
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('memTimer',     memTimerV);
  set('memMoves',     memMoves);
  set('memTimerBig',  memTimerV + 's');
  set('memMovesBig',  memMoves);
  set('memPairs',     memPairsFound + ' / 16');
}

function memLoadBest() {
  const b = localStorage.getItem(MEM_KEY);
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('memBest', b ? b + ' lượt' : '--');
  const hub = document.getElementById('hubMemoryBest');
  if (hub) hub.textContent = b ? b + ' lượt' : '--';
}
