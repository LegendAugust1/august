// ═══════════════════════════
//  TETRIS
// ═══════════════════════════

const TET_KEY  = 'rblx_tetris_best';
const TET_COLS = 10;
const TET_ROWS = 20;
const TET_CELL = 24; // px

// Theme-matching piece colors
const TET_COLORS = {
  I: '#06b6d4', // cyan
  O: '#eab308', // yellow
  T: '#a855f7', // purple
  S: '#10b981', // green
  Z: '#ef4444', // red
  J: '#3b82f6', // blue
  L: '#f97316', // orange
};

const TET_SHAPES = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]],
};

let tetBoard, tetPiece, tetNext, tetScore, tetBestV, tetLevel, tetLines;
let tetState = 'idle'; // idle | playing | paused | dead
let tetLoopI = null;
let tetFrame = 0;

function tetInit() {
  tetLoadBest();
  tetBoardClear();
  tetScore  = 0;
  tetLevel  = 1;
  tetLines  = 0;
  tetState  = 'idle';
  tetPiece  = null;
  tetNext   = tetRandomPiece();
  tetUpdateUI();
  tetDrawBoard();
  tetDrawNext();
  const ov = document.getElementById('tetOverlay');
  if (ov) {
    ov.classList.remove('hide');
    document.getElementById('tetOverTitle').textContent = 'Tetris';
    document.getElementById('tetOverSub').textContent  = '← → Di chuyển · ↑ Xoay · Space Rơi thẳng';
    document.getElementById('tetStartBtn').textContent = '▶ Bắt Đầu';
  }
}

function tetBoardClear() {
  tetBoard = Array.from({length: TET_ROWS}, () => Array(TET_COLS).fill(null));
}

function tetRandomPiece() {
  const keys = Object.keys(TET_SHAPES);
  const type = keys[Math.floor(Math.random() * keys.length)];
  return {
    type,
    color: TET_COLORS[type],
    shape: TET_SHAPES[type].map(r => [...r]),
    x: Math.floor(TET_COLS / 2) - Math.floor(TET_SHAPES[type][0].length / 2),
    y: 0,
  };
}

function tetStart() {
  if (tetState === 'paused') { tetResume(); return; }
  tetBoardClear();
  tetScore = 0; tetLevel = 1; tetLines = 0;
  tetPiece  = tetRandomPiece();
  tetNext   = tetRandomPiece();
  tetState  = 'playing';
  tetFrame  = 0;
  document.getElementById('tetOverlay').classList.add('hide');
  if (tetLoopI) clearInterval(tetLoopI);
  tetLoopI = setInterval(tetTick, tetSpeed());
  tetUpdateUI();
  tetDrawBoard();
  tetDrawNext();
}

function tetReset() {
  if (tetLoopI) clearInterval(tetLoopI);
  tetInit();
}

function tetSpeed() {
  const speeds = [800,650,520,410,320,250,195,150,115,88,68];
  return speeds[Math.min(tetLevel - 1, speeds.length - 1)];
}

function tetTick() {
  if (tetState !== 'playing') return;
  if (!tetMovePiece(0, 1)) {
    tetLockPiece();
    const cleared = tetClearLines();
    tetScore  += [0, 100, 300, 500, 800][cleared] * tetLevel;
    tetLines  += cleared;
    tetLevel   = Math.floor(tetLines / 10) + 1;
    tetPiece   = tetNext;
    tetNext    = tetRandomPiece();
    clearInterval(tetLoopI);
    tetLoopI   = setInterval(tetTick, tetSpeed());

    if (tetCollides(tetPiece, tetPiece.x, tetPiece.y)) {
      tetDie();
      return;
    }
  }
  tetUpdateUI();
  tetDrawBoard();
  tetDrawNext();
}

function tetMovePiece(dx, dy) {
  if (tetCollides(tetPiece, tetPiece.x + dx, tetPiece.y + dy)) return false;
  tetPiece.x += dx;
  tetPiece.y += dy;
  tetDrawBoard();
  return true;
}

function tetRotatePiece() {
  const orig = tetPiece.shape;
  const n    = orig.length;
  const rotated = Array.from({length: n}, (_, r) =>
    Array.from({length: n}, (_, c) => orig[n - 1 - c][r])
  );
  const backup = tetPiece.shape;
  tetPiece.shape = rotated;
  // wall kick
  const kicks = [0, 1, -1, 2, -2];
  for (const k of kicks) {
    if (!tetCollides(tetPiece, tetPiece.x + k, tetPiece.y)) {
      tetPiece.x += k;
      tetDrawBoard();
      return;
    }
  }
  tetPiece.shape = backup;
}

function tetHardDrop() {
  while (!tetCollides(tetPiece, tetPiece.x, tetPiece.y + 1)) {
    tetPiece.y++;
    tetScore += 2;
  }
  tetTick();
}

function tetCollides(piece, px, py) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const nx = px + c, ny = py + r;
      if (nx < 0 || nx >= TET_COLS || ny >= TET_ROWS) return true;
      if (ny >= 0 && tetBoard[ny][nx]) return true;
    }
  }
  return false;
}

function tetLockPiece() {
  for (let r = 0; r < tetPiece.shape.length; r++) {
    for (let c = 0; c < tetPiece.shape[r].length; c++) {
      if (!tetPiece.shape[r][c]) continue;
      const ny = tetPiece.y + r, nx = tetPiece.x + c;
      if (ny >= 0) tetBoard[ny][nx] = tetPiece.color;
    }
  }
}

function tetClearLines() {
  let cleared = 0;
  for (let r = TET_ROWS - 1; r >= 0; r--) {
    if (tetBoard[r].every(c => c !== null)) {
      tetBoard.splice(r, 1);
      tetBoard.unshift(Array(TET_COLS).fill(null));
      cleared++;
      r++; // re-check same row
    }
  }
  return cleared;
}

function tetDie() {
  tetState = 'dead';
  clearInterval(tetLoopI);
  // save best
  if (tetScore > tetBestV) {
    tetBestV = tetScore;
    localStorage.setItem(TET_KEY, tetScore);
    if (typeof updateHubScores === 'function') updateHubScores();
  }
  const ov = document.getElementById('tetOverlay');
  ov.classList.remove('hide');
  document.getElementById('tetOverTitle').textContent = '💀 Game Over!';
  document.getElementById('tetOverSub').textContent  = `Điểm: ${tetScore}  |  Kỷ lục: ${tetBestV}`;
  document.getElementById('tetStartBtn').textContent = '🔄 Chơi Lại';
  tetUpdateUI();
}

function tetPause() {
  if (tetState === 'playing') {
    tetState = 'paused';
    clearInterval(tetLoopI);
    const ov = document.getElementById('tetOverlay');
    ov.classList.remove('hide');
    document.getElementById('tetOverTitle').textContent = '⏸ Tạm Dừng';
    document.getElementById('tetOverSub').textContent  = 'Nhấn P hoặc nút để tiếp tục';
    document.getElementById('tetStartBtn').textContent = '▶ Tiếp Tục';
  }
}

function tetResume() {
  if (tetState !== 'paused') return;
  tetState = 'playing';
  document.getElementById('tetOverlay').classList.add('hide');
  tetLoopI = setInterval(tetTick, tetSpeed());
}

// ── Ghost piece (shadow) ──
function tetGhostY() {
  let gy = tetPiece.y;
  while (!tetCollides(tetPiece, tetPiece.x, gy + 1)) gy++;
  return gy;
}

// ── Draw ──
function tetDrawBoard() {
  const cv  = document.getElementById('tetCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;

  // background
  ctx.fillStyle = '#04040e';
  ctx.fillRect(0, 0, W, H);

  // grid lines
  ctx.strokeStyle = 'rgba(120,60,255,0.07)';
  ctx.lineWidth   = 0.5;
  for (let c = 0; c <= TET_COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c*TET_CELL, 0); ctx.lineTo(c*TET_CELL, H); ctx.stroke();
  }
  for (let r = 0; r <= TET_ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r*TET_CELL); ctx.lineTo(W, r*TET_CELL); ctx.stroke();
  }

  // board cells
  for (let r = 0; r < TET_ROWS; r++) {
    for (let c = 0; c < TET_COLS; c++) {
      if (tetBoard[r][c]) tetDrawCell(ctx, c, r, tetBoard[r][c], 1);
    }
  }

  // ghost piece
  if (tetPiece && tetState === 'playing') {
    const gy = tetGhostY();
    if (gy !== tetPiece.y) {
      tetPiece.shape.forEach((row, r) => row.forEach((v, c) => {
        if (!v) return;
        tetDrawCell(ctx, tetPiece.x+c, gy+r, tetPiece.color, 0.2);
      }));
    }
    // active piece
    tetPiece.shape.forEach((row, r) => row.forEach((v, c) => {
      if (!v) return;
      tetDrawCell(ctx, tetPiece.x+c, tetPiece.y+r, tetPiece.color, 1);
    }));
  }
}

function tetDrawCell(ctx, c, r, color, alpha) {
  if (r < 0) return;
  const x = c * TET_CELL + 1, y = r * TET_CELL + 1;
  const s = TET_CELL - 2;
  ctx.globalAlpha = alpha;
  // fill
  ctx.fillStyle = color;
  ctx.shadowBlur  = alpha === 1 ? 10 : 0;
  ctx.shadowColor = color;
  tetRoundRect(ctx, x, y, s, s, 4);
  ctx.fill();
  // highlight
  ctx.shadowBlur = 0;
  ctx.fillStyle  = 'rgba(255,255,255,0.18)';
  tetRoundRect(ctx, x, y, s, 5, 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function tetRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

function tetDrawNext() {
  const cv  = document.getElementById('tetNextCanvas');
  if (!cv || !tetNext) return;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, 80, 80);
  ctx.fillStyle = 'rgba(4,4,14,.7)';
  ctx.fillRect(0, 0, 80, 80);
  const cs   = 16;
  const sh   = tetNext.shape;
  const offX = Math.floor((4 - sh[0].length) / 2);
  const offY = Math.floor((4 - sh.length) / 2);
  sh.forEach((row, r) => row.forEach((v, c) => {
    if (!v) return;
    ctx.fillStyle   = tetNext.color;
    ctx.shadowBlur  = 8; ctx.shadowColor = tetNext.color;
    tetRoundRect(ctx, (offX+c)*cs+2, (offY+r)*cs+2, cs-3, cs-3, 3);
    ctx.fill(); ctx.shadowBlur = 0;
  }));
}

function tetUpdateUI() {
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('tetScore',    tetScore);
  set('tetBest',     Math.max(tetBestV, tetScore));
  set('tetLevel',    tetLevel);
  set('tetLines',    tetLines);
  set('tetScoreTop', tetScore);
  set('tetBestTop',  Math.max(tetBestV, tetScore));
}

function tetLoadBest() {
  tetBestV = parseInt(localStorage.getItem(TET_KEY) || '0');
  const hub = document.getElementById('hubTetrisBest');
  if (hub) hub.textContent = tetBestV;
}

// ── Keyboard ──
document.addEventListener('keydown', e => {
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  const v = document.getElementById('view-tetris');
  if (!v || !v.classList.contains('active')) return;

  if (tetState === 'idle' || tetState === 'dead') {
    if ([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      e.preventDefault(); tetStart(); return;
    }
  }

  if (e.key === 'p' || e.key === 'P') { e.preventDefault(); tetState === 'paused' ? tetResume() : tetPause(); return; }
  if (tetState !== 'playing') return;

  switch (e.key) {
    case 'ArrowLeft':  e.preventDefault(); tetMovePiece(-1, 0); break;
    case 'ArrowRight': e.preventDefault(); tetMovePiece(1,  0); break;
    case 'ArrowDown':  e.preventDefault(); tetMovePiece(0,  1); break;
    case 'ArrowUp':    e.preventDefault(); tetRotatePiece();    break;
    case ' ':          e.preventDefault(); tetHardDrop();       break;
  }
});
