// ═══════════════════════════
//  SNAKE GAME
// ═══════════════════════════

const CELL  = 20;       // px mỗi ô
const COLS  = 20;       // số cột  (400 / 20)
const ROWS  = 20;       // số hàng (400 / 20)
const SNAKE_KEY = 'rblx_snake_best';

let snakeState = 'idle'; // idle | playing | paused | dead
let snakeLoop  = null;
let snake, dir, nextDir, food, bonus, score, level, frameCount;

// màu sắc theo theme
const C = {
  bg:      '#06061a',
  grid:    'rgba(120,60,255,0.05)',
  head:    '#a855f7',
  body1:   '#7c3aed',
  body2:   '#6d28d9',
  food:    '#22d3a0',
  foodGlow:'rgba(34,211,160,0.45)',
  bonus:   '#f59e0b',
  bonusGlow:'rgba(245,158,11,0.45)',
  dead:    '#ef4444',
  text:    '#e2d9f3',
};

function snakeBestScore() {
  return parseInt(localStorage.getItem(SNAKE_KEY) || '0');
}
function snakeSaveBest(s) {
  if (s > snakeBestScore()) localStorage.setItem(SNAKE_KEY, s);
}

// ── Khởi tạo ──
function snakeInit() {
  snake    = [{ x:10, y:10 }, { x:9, y:10 }, { x:8, y:10 }];
  dir      = { x:1, y:0 };
  nextDir  = { x:1, y:0 };
  food     = spawnFood();
  bonus    = null;
  score    = 0;
  level    = 1;
  frameCount = 0;
  updateSnakeUI();
}

function spawnFood() {
  let pos;
  do {
    pos = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) };
  } while (snake.some(s => s.x===pos.x && s.y===pos.y));
  return pos;
}

function spawnBonus() {
  if (bonus) return;
  if (Math.random() < 0.25) {
    let pos;
    do {
      pos = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) };
    } while (snake.some(s => s.x===pos.x && s.y===pos.y) || (food.x===pos.x && food.y===pos.y));
    bonus = { ...pos, ttl: 60 }; // biến mất sau 60 tick
  }
}

// ── Tốc độ theo level ──
function snakeInterval() {
  const speeds = [150,130,110,95,82,70,60,52,45,40];
  return speeds[Math.min(level-1, speeds.length-1)];
}

// ── Start / Reset ──
function snakeStart() {
  snakeInit();
  snakeState = 'playing';
  document.getElementById('snakeOverlay').classList.add('hide');
  if (snakeLoop) clearInterval(snakeLoop);
  snakeLoop = setInterval(snakeTick, snakeInterval());
  snakeDraw();
}

function snakeReset() {
  if (snakeLoop) clearInterval(snakeLoop);
  snakeInit();
  snakeState = 'idle';
  const ov = document.getElementById('snakeOverlay');
  ov.classList.remove('hide');
  document.getElementById('snakeOverTitle').textContent  = 'Rắn Săn Mồi';
  document.getElementById('snakeOverSub').textContent    = 'Dùng WASD hoặc phím mũi tên để điều khiển';
  document.getElementById('snakeStartBtn').textContent   = '▶ Bắt Đầu';
  snakeDraw();
}

function snakePause() {
  if (snakeState === 'playing') {
    snakeState = 'paused';
    clearInterval(snakeLoop);
    const ov = document.getElementById('snakeOverlay');
    ov.classList.remove('hide');
    document.getElementById('snakeOverTitle').textContent = '⏸ Tạm Dừng';
    document.getElementById('snakeOverSub').textContent   = 'Nhấn Space để tiếp tục';
    document.getElementById('snakeStartBtn').textContent  = '▶ Tiếp Tục';
  } else if (snakeState === 'paused') {
    snakeState = 'playing';
    document.getElementById('snakeOverlay').classList.add('hide');
    snakeLoop = setInterval(snakeTick, snakeInterval());
  }
}

// ── Tick ──
function snakeTick() {
  frameCount++;
  dir = { ...nextDir };

  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  // wrap around
  head.x = (head.x + COLS) % COLS;
  head.y = (head.y + ROWS) % ROWS;

  // self collision
  if (snake.some(s => s.x===head.x && s.y===head.y)) {
    snakeDie(); return;
  }

  snake.unshift(head);

  // mồi thường
  if (head.x===food.x && head.y===food.y) {
    score += level * 10;
    level  = Math.floor(score / 100) + 1;
    food   = spawnFood();
    spawnBonus();
    // đổi tốc độ khi lên level
    clearInterval(snakeLoop);
    snakeLoop = setInterval(snakeTick, snakeInterval());
  } else {
    snake.pop();
  }

  // mồi bonus
  if (bonus) {
    bonus.ttl--;
    if (head.x===bonus.x && head.y===bonus.y) {
      score += level * 25;
      bonus  = null;
    } else if (bonus.ttl <= 0) {
      bonus = null;
    }
  }

  updateSnakeUI();
  snakeDraw();
}

function snakeDie() {
  snakeState = 'dead';
  clearInterval(snakeLoop);
  snakeSaveBest(score);

  const ov = document.getElementById('snakeOverlay');
  ov.classList.remove('hide');
  document.getElementById('snakeOverTitle').textContent = '💀 Game Over!';
  document.getElementById('snakeOverSub').textContent  = `Điểm: ${score}  |  Kỷ lục: ${snakeBestScore()}`;
  document.getElementById('snakeStartBtn').textContent = '🔄 Chơi Lại';
  updateSnakeUI();
  snakeDrawDead();
}

// ── UI ──
function updateSnakeUI() {
  const best = snakeBestScore();
  document.getElementById('snakeScore').textContent    = score;
  document.getElementById('snakeBest').textContent     = Math.max(best, score);
  document.getElementById('snakeLevel').textContent    = level;
  document.getElementById('snakeLen').textContent      = snake.length;
  document.getElementById('snakeScoreTop').textContent = score;
  document.getElementById('snakeBestTop').textContent  = Math.max(best, score);
}

// ── Draw ──
function snakeDraw() {
  const cv  = document.getElementById('snakeCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;

  // nền
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // lưới mờ
  ctx.strokeStyle = C.grid;
  ctx.lineWidth   = 0.5;
  for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x*CELL,0); ctx.lineTo(x*CELL,H); ctx.stroke(); }
  for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0,y*CELL); ctx.lineTo(W,y*CELL); ctx.stroke(); }

  // thức ăn bonus
  if (bonus) {
    const pulse = 0.7 + 0.3 * Math.sin(frameCount * 0.3);
    ctx.shadowBlur  = 18 * pulse;
    ctx.shadowColor = C.bonusGlow;
    ctx.fillStyle   = C.bonus;
    roundRect(ctx, bonus.x*CELL+2, bonus.y*CELL+2, CELL-4, CELL-4, 5);
    ctx.fill();
    // icon ⭐
    ctx.shadowBlur = 0;
    ctx.font       = '12px Sora';
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', bonus.x*CELL + CELL/2, bonus.y*CELL + CELL/2);
  }

  // thức ăn thường
  const pulse2 = 0.7 + 0.3 * Math.sin(frameCount * 0.25);
  ctx.shadowBlur  = 16 * pulse2;
  ctx.shadowColor = C.foodGlow;
  ctx.fillStyle   = C.food;
  roundRect(ctx, food.x*CELL+3, food.y*CELL+3, CELL-6, CELL-6, 5);
  ctx.fill();
  ctx.shadowBlur = 0;

  // thân rắn
  snake.forEach((seg, i) => {
    const isHead = i === 0;
    const t      = i / snake.length;
    if (isHead) {
      ctx.shadowBlur  = 14;
      ctx.shadowColor = C.head;
      ctx.fillStyle   = C.head;
    } else {
      ctx.shadowBlur  = 0;
      // gradient xanh tím dọc thân
      ctx.fillStyle   = i % 2 === 0 ? C.body1 : C.body2;
      ctx.globalAlpha = 1 - t * 0.35;
    }
    roundRect(ctx, seg.x*CELL+1, seg.y*CELL+1, CELL-2, CELL-2, isHead ? 7 : 5);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;

    // mắt rắn
    if (isHead) drawSnakeEyes(ctx, seg);
  });
}

function snakeDrawDead() {
  const cv  = document.getElementById('snakeCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  snakeDraw();
  // overlay đỏ
  ctx.fillStyle = 'rgba(239,68,68,0.15)';
  ctx.fillRect(0, 0, cv.width, cv.height);
  // tô đỏ rắn
  snake.forEach(seg => {
    ctx.fillStyle = C.dead;
    ctx.globalAlpha = 0.6;
    roundRect(ctx, seg.x*CELL+1, seg.y*CELL+1, CELL-2, CELL-2, 5);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function drawSnakeEyes(ctx, head) {
  // vị trí mắt phụ thuộc hướng
  const ex1 = { x:0, y:0 }, ex2 = { x:0, y:0 };
  if (dir.x === 1)       { ex1.x=13; ex1.y=4;  ex2.x=13; ex2.y=12; }
  else if (dir.x === -1) { ex1.x=3;  ex1.y=4;  ex2.x=3;  ex2.y=12; }
  else if (dir.y === -1) { ex1.x=4;  ex1.y=3;  ex2.x=12; ex2.y=3;  }
  else                   { ex1.x=4;  ex1.y=13; ex2.x=12; ex2.y=13; }

  ctx.fillStyle = '#fff';
  ctx.shadowBlur = 0;
  [ex1, ex2].forEach(e => {
    ctx.beginPath();
    ctx.arc(head.x*CELL + e.x, head.y*CELL + e.y, 2.5, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#1a0030';
    ctx.beginPath();
    ctx.arc(head.x*CELL + e.x, head.y*CELL + e.y, 1.2, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff';
  });
}

function roundRect(ctx, x, y, w, h, r) {
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

// ── Điều khiển bàn phím ──
document.addEventListener('keydown', e => {
  // Không bắt phím khi đang gõ vào input / textarea / select
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

  if (snakeState === 'idle' || snakeState === 'dead') {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d',' '].includes(e.key)) {
      snakeStart(); return;
    }
  }

  if (e.key === ' ') { e.preventDefault(); snakePause(); return; }

  if (snakeState !== 'playing') return;

  const map = {
    'ArrowUp':    { x:0, y:-1 }, 'w': { x:0, y:-1 },
    'ArrowDown':  { x:0, y:1  }, 's': { x:0, y:1  },
    'ArrowLeft':  { x:-1,y:0  }, 'a': { x:-1,y:0  },
    'ArrowRight': { x:1, y:0  }, 'd': { x:1, y:0  },
  };
  const nd = map[e.key];
  if (!nd) return;
  // không cho đi ngược
  if (nd.x !== -dir.x || nd.y !== -dir.y) nextDir = nd;
  e.preventDefault();
});

// ── Khởi tạo khi load xong ──
(function initSnake() {
  snakeInit();
  snakeDraw();
  updateSnakeUI();
})();