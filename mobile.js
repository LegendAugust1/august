// ═══════════════════════════════════════════════════
//  MOBILE PATCH  — thêm <script src="mobile.js"> vào
//  cuối <body>, SAU tất cả script khác
// ═══════════════════════════════════════════════════

(function () {
  const isMobile = () => window.innerWidth <= 640;

  // ══════════════════════════════════════════
  //  1. INJECT BOTTOM NAV vào DOM
  // ══════════════════════════════════════════
  function injectBottomNav() {
    if (document.getElementById('mobileNav')) return;

    const nav = document.createElement('nav');
    nav.className = 'mobile-nav';
    nav.id = 'mobileNav';
    nav.innerHTML = `
      <div class="mobile-nav-inner">
        <button class="mobile-nav-item active" data-view="accounts" onclick="mobileGoto('accounts',this)">
          <span class="mn-ico">👤</span><span>Tài Khoản</span>
          <span class="mn-dot" id="mnDotAccounts"></span>
        </button>
        <button class="mobile-nav-item" data-view="stats" onclick="mobileGoto('stats',this)">
          <span class="mn-ico">📊</span><span>Thống Kê</span>
        </button>
        <button class="mobile-nav-item" data-view="games" onclick="mobileGoto('games',this)">
          <span class="mn-ico">🕹️</span><span>Game</span>
        </button>
        <button class="mobile-nav-item" data-view="notes" onclick="mobileGoto('notes',this)">
          <span class="mn-ico">📝</span><span>Ghi Chú</span>
          <span class="mn-dot" id="mnDotNotes"></span>
        </button>
        <button class="mobile-nav-item" data-view="settings" onclick="mobileGoto('settings',this)">
          <span class="mn-ico">⚙️</span><span>Cài Đặt</span>
        </button>
      </div>
    `;
    document.body.appendChild(nav);
  }

  window.mobileGoto = function (viewName, el) {
    // sync desktop nav
    const desktopNavItem = document.querySelector(`.nav-item[onclick*="'${viewName}'"]`);
    if (desktopNavItem) {
      gotoView(viewName, desktopNavItem);
    } else {
      // fallback
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      const v = document.getElementById('view-' + viewName);
      if (v) v.classList.add('active');
    }

    // update bottom nav highlight
    document.querySelectorAll('.mobile-nav-item').forEach(i => i.classList.remove('active'));
    if (el) el.classList.add('active');
  };

  // ══════════════════════════════════════════
  //  2. INJECT D-PAD CHO SNAKE
  // ══════════════════════════════════════════
  function injectSnakeDpad() {
    if (document.getElementById('snakeDpad')) return;
    const snakeWrap = document.querySelector('#view-snake .snake-wrap');
    if (!snakeWrap) return;

    // D-pad
    const dpadDiv = document.createElement('div');
    dpadDiv.className = 'touch-dpad';
    dpadDiv.id = 'snakeDpad';
    dpadDiv.innerHTML = `
      <button class="dpad-up"    ontouchstart="snakeTouchDir(0,-1)">▲</button>
      <button class="dpad-left"  ontouchstart="snakeTouchDir(-1,0)">◀</button>
      <button class="dpad-center" ontouchstart="snakePause()">⏸</button>
      <button class="dpad-right" ontouchstart="snakeTouchDir(1,0)">▶</button>
      <button class="dpad-down"  ontouchstart="snakeTouchDir(0,1)">▼</button>
    `;

    // Action buttons (start/reset)
    const actDiv = document.createElement('div');
    actDiv.className = 'touch-actions';
    actDiv.id = 'snakeTouchActions';
    actDiv.innerHTML = `
      <button ontouchstart="snakeStart()">▶ Bắt đầu</button>
      <button ontouchstart="snakeReset()">🔄 Lại</button>
    `;

    // Chèn dưới canvas
    const snakePanel = snakeWrap.querySelector('.snake-panel');
    if (snakePanel) {
      snakePanel.after(dpadDiv);
      dpadDiv.after(actDiv);
    } else {
      snakeWrap.appendChild(dpadDiv);
      snakeWrap.appendChild(actDiv);
    }
  }

  window.snakeTouchDir = function (dx, dy) {
    // Không gọi event, tác động trực tiếp lên nextDir
    if (typeof nextDir === 'undefined' || typeof dir === 'undefined') return;
    if (dx !== -dir.x || dy !== -dir.y) {
      nextDir = { x: dx, y: dy };
    }
    if (typeof snakeState !== 'undefined' && (snakeState === 'idle' || snakeState === 'dead')) {
      snakeStart();
    }
  };

  // ══════════════════════════════════════════
  //  3. INJECT CONTROLS CHO TETRIS
  // ══════════════════════════════════════════
  function injectTetrisControls() {
    if (document.getElementById('tetTouchActions')) return;
    const tetWrap = document.querySelector('#view-tetris .snake-wrap');
    if (!tetWrap) return;

    // D-pad di chuyển
    const dpadDiv = document.createElement('div');
    dpadDiv.className = 'touch-dpad';
    dpadDiv.id = 'tetDpad';
    dpadDiv.innerHTML = `
      <button class="dpad-up"    ontouchstart="tetTouchRotate()">🔄</button>
      <button class="dpad-left"  ontouchstart="tetTouchMove(-1)">◀</button>
      <button class="dpad-center" ontouchstart="tetTouchPause()">⏸</button>
      <button class="dpad-right" ontouchstart="tetTouchMove(1)">▶</button>
      <button class="dpad-down"  ontouchstart="tetTouchDown()">▼</button>
    `;

    // Nút hard drop + reset
    const actDiv = document.createElement('div');
    actDiv.className = 'touch-actions';
    actDiv.id = 'tetTouchActions';
    actDiv.innerHTML = `
      <button ontouchstart="tetTouchHardDrop()" style="flex:2;font-size:13px">⬇️ Rơi thẳng</button>
      <button ontouchstart="tetStart()" style="flex:1;font-size:13px">▶</button>
      <button ontouchstart="tetReset()" style="flex:1;font-size:13px">🔄</button>
    `;

    const tetPanel = tetWrap.querySelector('.snake-panel');
    if (tetPanel) {
      tetPanel.after(dpadDiv);
      dpadDiv.after(actDiv);
    } else {
      tetWrap.appendChild(dpadDiv);
      tetWrap.appendChild(actDiv);
    }
  }

  window.tetTouchMove    = function (dx) { if (typeof tetMovePiece  !== 'undefined') { tetMovePiece(dx, 0); } };
  window.tetTouchRotate  = function ()   { if (typeof tetRotatePiece!== 'undefined') { tetRotatePiece(); } };
  window.tetTouchDown    = function ()   { if (typeof tetMovePiece  !== 'undefined') { tetMovePiece(0, 1); } };
  window.tetTouchHardDrop= function ()   { if (typeof tetHardDrop   !== 'undefined') { tetHardDrop(); } };
  window.tetTouchPause   = function ()   {
    if (typeof tetState === 'undefined') return;
    if (tetState === 'playing')       tetPause();
    else if (tetState === 'paused')   tetResume();
  };

  // ══════════════════════════════════════════
  //  4. FLAG TOGGLE CHO MINESWEEPER
  // ══════════════════════════════════════════
  let mineIsFlagMode = false;

  function injectMineFlagToggle() {
    if (document.getElementById('mineFlagToggle')) return;
    const mineLeft = document.querySelector('#view-mine .mine-left');
    if (!mineLeft) return;

    const btn = document.createElement('div');
    btn.className = 'mine-flag-toggle';
    btn.id = 'mineFlagToggle';
    btn.innerHTML = `
      <div class="flag-indicator">⛏️</div>
      <div class="flag-label">Chế độ: <b>Mở ô</b> — Chạm để chuyển sang cắm cờ 🚩</div>
    `;
    btn.onclick = toggleMineFlag;

    // Chèn trước mine-diff-row
    const diffRow = mineLeft.querySelector('.mine-diff-row');
    if (diffRow) mineLeft.insertBefore(btn, diffRow);
    else mineLeft.prepend(btn);
  }

  window.toggleMineFlag = function () {
    mineIsFlagMode = !mineIsFlagMode;
    const btn = document.getElementById('mineFlagToggle');
    if (!btn) return;
    const ind = btn.querySelector('.flag-indicator');
    const lbl = btn.querySelector('.flag-label b');
    if (mineIsFlagMode) {
      btn.classList.add('flag-mode');
      ind.textContent = '🚩';
      lbl.textContent = 'Cắm cờ';
      btn.querySelector('.flag-label').innerHTML = 'Chế độ: <b>Cắm cờ</b> 🚩 — Chạm ô để đặt/gỡ cờ';
    } else {
      btn.classList.remove('flag-mode');
      ind.textContent = '⛏️';
      btn.querySelector('.flag-label').innerHTML = 'Chế độ: <b>Mở ô</b> — Chạm để chuyển sang cắm cờ 🚩';
    }
  };

  // Patch mineClickCell — nếu flag mode thì cắm cờ thay vì mở
  const _origMineClickCell = window.mineClickCell;
  window.mineClickCell = function (idx) {
    if (isMobile() && mineIsFlagMode) {
      // cắm cờ
      if (typeof mineState !== 'undefined' && mineState === 'idle') {
        // khởi động game nếu chưa bắt đầu
        mineState = 'playing';
        minePlaceMines(-1);
        mineFirst = false;
        if (typeof mineTimerI !== 'undefined') clearInterval(mineTimerI);
        mineTimerI = setInterval(() => { mineTimerV++; mineUpdateUI(); }, 1000);
      }
      if (typeof mineFlag === 'function') mineFlag(idx);
    } else {
      if (_origMineClickCell) _origMineClickCell(idx);
    }
  };

  // ══════════════════════════════════════════
  //  5. SWIPE TO CONTROL SNAKE (bonus)
  // ══════════════════════════════════════════
  let swipeStartX = 0, swipeStartY = 0;

  function initSwipe() {
    const cv = document.getElementById('snakeCanvas');
    if (!cv) return;
    cv.addEventListener('touchstart', e => {
      swipeStartX = e.touches[0].clientX;
      swipeStartY = e.touches[0].clientY;
    }, { passive: true });
    cv.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - swipeStartX;
      const dy = e.changedTouches[0].clientY - swipeStartY;
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return; // tap
      if (Math.abs(dx) > Math.abs(dy)) {
        snakeTouchDir(dx > 0 ? 1 : -1, 0);
      } else {
        snakeTouchDir(0, dy > 0 ? 1 : -1);
      }
    }, { passive: true });
  }

  // ══════════════════════════════════════════
  //  6. KHỞI TẠO KHI DOM READY
  // ══════════════════════════════════════════
  function init() {
    injectBottomNav();
    injectSnakeDpad();
    injectTetrisControls();
    injectMineFlagToggle();
    initSwipe();

    // Ngăn context menu (chuột phải) gây popup trên mobile
    document.addEventListener('contextmenu', e => {
      if (isMobile()) e.preventDefault();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM đã ready, gọi sau 1 tick để đảm bảo các game script chạy xong
    setTimeout(init, 100);
  }

  // Re-inject nếu view game được mở (vì view dùng display:block/none)
  const _origGotoView = window.gotoView;
  window.gotoView = function (name, el) {
    if (_origGotoView) _origGotoView(name, el);
    if (isMobile()) {
      if (name === 'snake')  setTimeout(injectSnakeDpad, 50);
      if (name === 'tetris') setTimeout(injectTetrisControls, 50);
      if (name === 'mine')   setTimeout(injectMineFlagToggle, 50);
    }
  };

})();
