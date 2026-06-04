// ═══════════════════════════
//  MINESWEEPER
// ═══════════════════════════

const MINE_DIFFS = {
  easy: { rows:9,  cols:9,  mines:10 },
  med:  { rows:16, cols:16, mines:40 },
  hard: { rows:16, cols:30, mines:99 },
};
const MINE_BEST_KEY = { easy:'rblx_mine_best_easy', med:'rblx_mine_best_med', hard:'rblx_mine_best_hard' };
const NUM_COLORS = ['','mn-1','mn-2','mn-3','mn-4','mn-5','mn-6','mn-7','mn-8'];

let mineDiff    = 'easy';
let mineGrid    = [];      // [{mine,open,flagged,adj}]
let mineRows    = 9;
let mineCols    = 9;
let mineTotal   = 10;
let mineFlags   = 0;
let mineOpened  = 0;
let mineState   = 'idle'; // idle | playing | won | dead
let mineTimerV  = 0;
let mineTimerI  = null;
let mineFirst   = true;

function mineSetDiff(btn, diff) {
  document.querySelectorAll('.mine-diff-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  mineDiff = diff;
  mineNewGame();
}

function mineNewGame() {
  if (mineTimerI) clearInterval(mineTimerI);
  const cfg = MINE_DIFFS[mineDiff];
  mineRows  = cfg.rows;
  mineCols  = cfg.cols;
  mineTotal = cfg.mines;
  mineFlags = 0;
  mineOpened = 0;
  mineState  = 'idle';
  mineTimerV = 0;
  mineFirst  = true;

  mineGrid = [];
  for (let i = 0; i < mineRows * mineCols; i++) {
    mineGrid.push({ mine:false, open:false, flagged:false, adj:0 });
  }
  mineUpdateUI();
  mineRender();
  const msg = document.getElementById('mineMsg');
  if (msg) { msg.textContent = ''; msg.style.color = ''; }
}

function mineInit() {
  mineLoadBests();
  mineNewGame();
}

function mineIdx(r, c) { return r * mineCols + c; }

function minePlaceMines(safeIdx) {
  let placed = 0;
  while (placed < mineTotal) {
    const idx = Math.floor(Math.random() * mineRows * mineCols);
    if (!mineGrid[idx].mine && idx !== safeIdx) {
      mineGrid[idx].mine = true;
      placed++;
    }
  }
  // calc adjacency
  for (let r = 0; r < mineRows; r++) {
    for (let c = 0; c < mineCols; c++) {
      if (mineGrid[mineIdx(r,c)].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = r+dr, nc = c+dc;
        if (nr>=0 && nr<mineRows && nc>=0 && nc<mineCols && mineGrid[mineIdx(nr,nc)].mine) count++;
      }
      mineGrid[mineIdx(r,c)].adj = count;
    }
  }
}

function mineOpen(idx) {
  const cell = mineGrid[idx];
  if (cell.open || cell.flagged) return;

  if (mineFirst) {
    mineFirst = false;
    minePlaceMines(idx);
    mineState = 'playing';
    mineTimerI = setInterval(() => {
      mineTimerV++;
      mineUpdateUI();
    }, 1000);
  }

  if (mineState !== 'playing') return;

  cell.open = true;
  mineOpened++;

  if (cell.mine) {
    mineState = 'dead';
    clearInterval(mineTimerI);
    mineRevealAll();
    mineRender();
    const msg = document.getElementById('mineMsg');
    if (msg) { msg.textContent = '💥 BOOM! Bạn đã chạm mìn!'; msg.style.color = 'var(--red)'; }
    // shake the cell
    const el = document.querySelector(`[data-idx="${idx}"]`);
    if (el) el.classList.add('mine-explode');
    return;
  }

  // flood fill nếu adj = 0
  if (cell.adj === 0) {
    const r = Math.floor(idx / mineCols), c = idx % mineCols;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = r+dr, nc = c+dc;
      if (nr>=0 && nr<mineRows && nc>=0 && nc<mineCols) {
        const ni = mineIdx(nr, nc);
        if (!mineGrid[ni].open && !mineGrid[ni].flagged) mineOpen(ni);
      }
    }
  }

  mineCheckWin();
  mineUpdateUI();
  mineRender();
}

function mineFlag(idx) {
  const cell = mineGrid[idx];
  if (cell.open || mineState === 'won' || mineState === 'dead') return;
  if (mineState === 'idle') return;
  cell.flagged = !cell.flagged;
  mineFlags += cell.flagged ? 1 : -1;
  mineUpdateUI();
  mineRender();
}

function mineRevealAll() {
  mineGrid.forEach(cell => {
    if (cell.mine && !cell.flagged) cell.open = true;
  });
}

function mineCheckWin() {
  const safeTotal = mineRows * mineCols - mineTotal;
  if (mineOpened >= safeTotal) {
    mineState = 'won';
    clearInterval(mineTimerI);
    // save best
    const key = MINE_BEST_KEY[mineDiff];
    const prev = parseInt(localStorage.getItem(key) || '99999');
    if (mineTimerV < prev) localStorage.setItem(key, mineTimerV);
    mineLoadBests();
    if (typeof updateHubScores === 'function') updateHubScores();
    const msg = document.getElementById('mineMsg');
    if (msg) { msg.textContent = `🎉 Thắng rồi! Thời gian: ${mineTimerV}s`; msg.style.color = 'var(--green)'; }
    // mark all mine cells with flag
    mineGrid.forEach(cell => { if (cell.mine) cell.flagged = true; });
    mineRender();
  }
}

function mineUpdateUI() {
  const flagsLeft = mineTotal - mineFlags;
  document.getElementById('mineTimer').textContent      = mineTimerV;
  document.getElementById('mineFlagsLeft').textContent  = flagsLeft;
  document.getElementById('mineTimerBig').textContent   = mineTimerV + 's';
  document.getElementById('mineFlagsLeftBig').textContent = flagsLeft;
}

function mineLoadBests() {
  const ke = MINE_BEST_KEY;
  const be = localStorage.getItem(ke.easy);
  const bm = localStorage.getItem(ke.med);
  const bh = localStorage.getItem(ke.hard);
  const el = v => v ? v + 's' : '--';
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = el(v); };
  set('mineBestEasy', be);
  set('mineBestMed',  bm);
  set('mineBestHard', bh);
  // also update hub
  const hub = document.getElementById('hubMineBest');
  if (hub) hub.textContent = be ? be + 's' : '--';
}

function mineRender() {
  const board = document.getElementById('mineBoard');
  if (!board) return;
  board.style.gridTemplateColumns = `repeat(${mineCols}, 32px)`;

  board.innerHTML = mineGrid.map((cell, idx) => {
    let cls = 'mine-cell';
    let inner = '';
    if (cell.flagged && !cell.open) {
      cls += ' flagged';
      inner = '🚩';
    } else if (!cell.open) {
      // closed
    } else if (cell.mine) {
      cls += ' mine-explode';
      inner = '💣';
    } else {
      cls += ' open';
      if (mineState === 'won') cls += ' mine-win';
      if (cell.adj > 0) {
        inner = `<span class="${NUM_COLORS[cell.adj]}">${cell.adj}</span>`;
      }
    }
    return `<div class="${cls}" data-idx="${idx}"
      onclick="mineClickCell(${idx})"
      oncontextmenu="mineRightClick(event,${idx})">${inner}</div>`;
  }).join('');
}

function mineClickCell(idx) {
  if (mineState === 'won' || mineState === 'dead') return;
  if (mineGrid[idx].flagged) return;
  mineOpen(idx);
}

function mineRightClick(e, idx) {
  e.preventDefault();
  if (mineState === 'idle') {
    // start game state so flagging is allowed after first right-click
    mineState = 'playing';
    minePlaceMines(-1);
    mineFirst = false;
    mineTimerI = setInterval(() => { mineTimerV++; mineUpdateUI(); }, 1000);
  }
  mineFlag(idx);
}
