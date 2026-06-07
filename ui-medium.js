// ═══════════════════════════════════════════════════════════
//  UI NÂNG CẤP TRUNG BÌNH — ui-medium.js
//  Thêm <script src="ui-medium.js"> vào cuối <body>,
//  SAU ui-easy.js
// ═══════════════════════════════════════════════════════════

(function () {

  // ══════════════════════════════════════════
  //  1. STATS CARDS — SPARKLINE + DONUT
  // ══════════════════════════════════════════

  // Lưu lịch sử số liệu (tối đa 10 điểm) để vẽ sparkline
  const SPARK_KEY = 'rblx_spark_history';
  let sparkHistory = [];

  function loadSparkHistory() {
    try {
      const r = localStorage.getItem(SPARK_KEY);
      if (r) sparkHistory = JSON.parse(r);
    } catch { sparkHistory = []; }
  }

  function saveSparkHistory(snap) {
    sparkHistory.push(snap);
    if (sparkHistory.length > 10) sparkHistory = sparkHistory.slice(-10);
    localStorage.setItem(SPARK_KEY, JSON.stringify(sparkHistory));
  }

  // Tính stats từ accs
  function calcStats() {
    const total  = typeof accs !== 'undefined' ? accs.length : 0;
    const online = typeof accs !== 'undefined' ? accs.filter(a => a.status === 'online').length : 0;
    const banned = typeof accs !== 'undefined' ? accs.filter(a => a.status === 'banned').length : 0;
    const robux  = typeof accs !== 'undefined' ? accs.reduce((s, a) => s + (Number(a.robux) || 0), 0) : 0;
    return { total, online, banned, robux };
  }

  // Vẽ sparkline trên canvas
  function drawSparkline(canvas, data, color) {
    if (!canvas || !data || data.length < 2) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const pts = data.map((v, i) => ({
      x: (i / (data.length - 1)) * (W - 4) + 2,
      y: H - 4 - ((v - min) / range) * (H - 8),
    }));

    // Fill gradient bên dưới
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, color.replace(')', ', 0.25)').replace('rgb', 'rgba'));
    grad.addColorStop(1, color.replace(')', ', 0)').replace('rgb', 'rgba'));

    ctx.beginPath();
    ctx.moveTo(pts[0].x, H);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Đường line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i - 1].x + pts[i].x) / 2;
      ctx.bezierCurveTo(cx, pts[i - 1].y, cx, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.shadowBlur = 6;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Chấm cuối
    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 2.8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Vẽ donut chart
  function drawDonut(canvas, segments) {
    // segments: [{value, color, label}]
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 3;
    ctx.clearRect(0, 0, W, H);

    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) {
      // Vẽ vòng tròn rỗng khi chưa có dữ liệu
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(120,60,255,0.15)';
      ctx.lineWidth = 8;
      ctx.stroke();
      return;
    }

    let startAngle = -Math.PI / 2;
    segments.forEach(seg => {
      const slice = (seg.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = seg.color;
      ctx.fill();
      ctx.shadowBlur = 0;
      startAngle += slice;
    });

    // Lỗ giữa (donut hole)
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.58, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--panel').trim() || '#0f0f24';
    ctx.fill();

    // Số giữa donut
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e2d9f3';
    ctx.font = `bold ${Math.floor(r * 0.38)}px Orbitron, sans-serif`;
    ctx.fillText(total, cx, cy);
  }

  // Rebuild stat cards với charts
  function buildStatCards() {
    const stats = calcStats();
    const snap = { t: stats.total, o: stats.online, b: stats.banned, r: stats.robux, ts: Date.now() };
    loadSparkHistory();
    saveSparkHistory(snap);

    // Lấy lịch sử cho sparkline
    const hist = sparkHistory;
    const totalHist  = hist.map(h => h.t);
    const onlineHist = hist.map(h => h.o);
    const bannedHist = hist.map(h => h.b);
    const robuxHist  = hist.map(h => h.r);

    // Trend: so sánh 2 điểm cuối
    function trend(arr) {
      if (arr.length < 2) return 'neu';
      const d = arr[arr.length - 1] - arr[arr.length - 2];
      return d > 0 ? 'up' : d < 0 ? 'down' : 'neu';
    }
    function trendLabel(arr, unit) {
      if (arr.length < 2) return '—';
      const d = arr[arr.length - 1] - arr[arr.length - 2];
      if (d === 0) return 'Không đổi';
      const sign = d > 0 ? '+' : '';
      return sign + (unit === 'robux' ? d.toLocaleString('vi-VN') : d) + (unit === 'robux' ? ' R$' : '');
    }

    const cards = [
      {
        id: 'cardStatTotal',
        ico: '🗂️', label: 'Tổng tài khoản',
        val: stats.total, valColor: 'var(--accent3)',
        sparkData: totalHist, sparkColor: 'rgb(168,85,247)',
        trendCls: trend(totalHist), trendTxt: trendLabel(totalHist),
        type: 'spark',
      },
      {
        id: 'cardStatOnline',
        ico: '🟢', label: 'Trạng thái',
        val: stats.online, valColor: 'var(--green)',
        type: 'donut',
        donutSegments: [
          { value: stats.online,                                   color: '#22d3a0', label: 'Online' },
          { value: stats.total - stats.online - stats.banned,     color: 'rgba(107,114,128,.5)', label: 'Offline' },
          { value: stats.banned,                                   color: '#ef4444', label: 'Bị ban' },
        ],
        trendCls: trend(onlineHist), trendTxt: trendLabel(onlineHist),
      },
      {
        id: 'cardStatRobux',
        ico: '💰', label: 'Tổng Robux',
        val: stats.robux.toLocaleString('vi-VN'), valColor: 'var(--yellow)',
        sparkData: robuxHist, sparkColor: 'rgb(245,158,11)',
        trendCls: trend(robuxHist), trendTxt: trendLabel(robuxHist, 'robux'),
        type: 'spark',
      },
      {
        id: 'cardStatBanned',
        ico: '🚫', label: 'Bị ban',
        val: stats.banned, valColor: 'var(--red)',
        sparkData: bannedHist, sparkColor: 'rgb(239,68,68)',
        trendCls: trend(bannedHist), trendTxt: trendLabel(bannedHist),
        type: 'spark',
      },
    ];

    const statsRow = document.querySelector('.stats-row');
    if (!statsRow) return;

    statsRow.innerHTML = cards.map((c, i) => {
      const chartHtml = c.type === 'spark'
        ? `<canvas class="stat-spark" id="${c.id}_spark" width="160" height="36" style="width:100%;height:36px"></canvas>`
        : `<div class="stat-donut-wrap">
            <canvas id="${c.id}_donut" width="56" height="56" style="width:56px;height:56px;flex-shrink:0"></canvas>
            <div class="stat-donut-legend">
              ${c.donutSegments.map(s => `
                <div class="sdl-row">
                  <div class="sdl-dot" style="background:${s.color}"></div>
                  <span>${s.label}: <b style="color:var(--text)">${s.value}</b></span>
                </div>`).join('')}
            </div>
          </div>`;

      return `<div class="stat-card" style="animation-delay:${i * 0.05}s">
        <div class="stat-header">
          <div class="stat-lbl">${c.label}</div>
          <span class="stat-ico" style="position:static;font-size:18px;opacity:.4">${c.ico}</span>
        </div>
        <div class="stat-body">
          <div class="stat-left">
            <div class="stat-val" style="color:${c.valColor}">${c.val}</div>
            <div class="stat-sub">
              <span class="stat-trend ${c.trendCls}">${c.trendTxt}</span>
            </div>
          </div>
        </div>
        ${chartHtml}
      </div>`;
    }).join('');

    // Vẽ charts sau khi DOM render
    requestAnimationFrame(() => {
      cards.forEach(c => {
        if (c.type === 'spark') {
          drawSparkline(document.getElementById(c.id + '_spark'), c.sparkData, c.sparkColor);
        } else if (c.type === 'donut') {
          drawDonut(document.getElementById(c.id + '_donut'), c.donutSegments);
        }
      });
    });
  }

  // Patch updateStats để gọi buildStatCards
  const _origUpdateStats = window.updateStats;
  window.updateStats = function () {
    if (_origUpdateStats) _origUpdateStats();
    buildStatCards();
  };


  // ══════════════════════════════════════════
  //  2. NHÓM TÀI KHOẢN THEO TAG
  // ══════════════════════════════════════════

  let viewMode    = 'grid';    // 'grid' | 'grouped'
  let activeTag   = 'all';     // tag đang lọc

  // Inject view toggle + tag filter bar vào toolbar
  function injectTagUI() {
    if (document.getElementById('viewToggle')) return;
    const toolbar = document.querySelector('#view-accounts .toolbar');
    if (!toolbar) return;

    // View toggle buttons
    const toggleDiv = document.createElement('div');
    toggleDiv.className = 'view-toggle';
    toggleDiv.id = 'viewToggle';
    toggleDiv.innerHTML = `
      <button class="vt-btn active" id="vtGrid"    onclick="setViewMode('grid')">≡ Lưới</button>
      <button class="vt-btn"        id="vtGrouped" onclick="setViewMode('grouped')">⊞ Theo Tag</button>
    `;
    toolbar.appendChild(toggleDiv);

    // Tag filter bar (chỉ hiện khi ở chế độ lưới bình thường)
    const tagBar = document.createElement('div');
    tagBar.className = 'tag-filter-bar';
    tagBar.id = 'tagFilterBar';
    toolbar.after(tagBar);
  }

  // Cập nhật tag filter chips dựa vào dữ liệu accs hiện tại
  function refreshTagBar() {
    const bar = document.getElementById('tagFilterBar');
    if (!bar) return;

    const accsData = typeof accs !== 'undefined' ? accs : [];

    // Thu thập tất cả tags
    const tagMap = {};
    accsData.forEach(a => {
      (a.tags || []).forEach(t => {
        if (t) tagMap[t] = (tagMap[t] || 0) + 1;
      });
    });

    const tags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]);

    if (tags.length === 0) {
      bar.innerHTML = '';
      return;
    }

    bar.innerHTML = `
      <span style="font-size:11px;color:var(--muted);font-weight:600;flex-shrink:0">🏷️ Tag:</span>
      <button class="tag-chip ${activeTag === 'all' ? 'active' : ''}" onclick="filterByTag('all')">
        Tất cả <span class="tag-chip-count">${accsData.length}</span>
      </button>
      ${tags.map(([t, count]) => `
        <button class="tag-chip ${activeTag === t ? 'active' : ''}" onclick="filterByTag('${esc(t)}')">
          ${esc(t)} <span class="tag-chip-count">${count}</span>
        </button>
      `).join('')}
    `;
  }

  // Render grouped view
  function renderGrouped() {
    const grid = document.getElementById('cardGrid');
    if (!grid) return;

    const accsData = typeof accs !== 'undefined' ? accs : [];
    const slabels  = { online:'Online', offline:'Offline', banned:'Bị ban' };
    const sclasses = { online:'s-on',   offline:'s-off',   banned:'s-ban'  };

    // Nhóm tài khoản theo tag
    const groupMap = {};
    const noTag    = [];

    accsData.forEach(a => {
      const tags = (a.tags || []).filter(Boolean);
      if (tags.length === 0) {
        noTag.push(a);
      } else {
        tags.forEach(t => {
          if (!groupMap[t]) groupMap[t] = [];
          groupMap[t].push(a);
        });
      }
    });

    if (accsData.length === 0) {
      grid.innerHTML = `<div class="empty">
        <div class="empty-ico">🎮</div>
        <p>Chưa có tài khoản. Nhấn "Thêm Tài Khoản" để bắt đầu!</p>
        <button class="btn btn-primary" style="margin-top:14px" onclick="openAdd()">＋ Thêm Tài Khoản</button>
      </div>`;
      return;
    }

    const groups = Object.entries(groupMap).sort((a, b) => b[1].length - a[1].length);
    if (noTag.length > 0) groups.push(['(Không có tag)', noTag]);

    function cardHtml(a, i) {
      const em        = a.emoji || EMOJI[i % EMOJI.length];
      const avatarCls = a.status === 'online' ? 'on' : 'off';
      const delay     = (i * .04).toFixed(2);
      const tags      = (a.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');

      const copyRows = `
        <div class="copy-row">
          <span class="cr-lbl">Username</span>
          <span class="cr-val">${esc(a.username)}</span>
          <button class="cp-btn" onclick="doCopy(this,'${esc(a.username)}')">Copy</button>
        </div>
        ${a.password ? `<div class="copy-row">
          <span class="cr-lbl">Password</span>
          <span class="cr-val masked" id="pw-${a.id}">••••••••</span>
          <button class="cp-btn" id="eye-${a.id}" onclick="togglePw('${a.id}','${esc(a.password)}')">👁</button>
          <button class="cp-btn" onclick="doCopy(this,'${esc(a.password)}')">Copy</button>
        </div>` : ''}
      `;

      const totpBlock = a.totp ? `
        <div class="totp-block">
          <div>
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">🔐 TOTP</div>
            <div class="totp-code" id="tc-${a.id}">--- ---</div>
          </div>
          <div class="totp-right">
            <div class="totp-bar-bg"><div class="totp-bar" id="tb-${a.id}" style="width:100%"></div></div>
            <div class="totp-secs-row">
              <span class="totp-secs">làm mới sau</span>
              <span class="totp-secs" id="ts-${a.id}">30s</span>
            </div>
          </div>
          <button class="cp-btn" onclick="copyTotp('${a.id}')">Copy</button>
        </div>` : '';

      return `<div class="acc-card" style="animation-delay:${delay}s">
        <div class="card-head">
          <div class="avatar ${avatarCls}">${em}</div>
          <div class="card-info">
            <div class="card-user">${esc(a.username)}</div>
            <div class="card-disp">${a.display ? esc(a.display) : '<span style="color:var(--muted)">—</span>'}</div>
          </div>
          <span class="sbadge ${sclasses[a.status] || 's-off'}">${slabels[a.status] || a.status}</span>
        </div>
        ${copyRows}
        ${totpBlock}
        ${tags ? `<div class="card-tags">${tags}</div>` : ''}
        ${a.note ? `<div class="card-note">${esc(a.note)}</div>` : ''}
        <div class="card-actions">
          <button class="btn btn-ghost btn-sm" onclick="openEdit('${a.id}')">✏️ Sửa</button>
          <button class="btn btn-danger btn-sm" onclick="openDel('${a.id}')">🗑️</button>
        </div>
      </div>`;
    }

    grid.innerHTML = groups.map(([groupName, groupAccs]) => `
      <div class="tag-group">
        <div class="tag-group-header">
          <span class="tag-group-name">🏷️ ${esc(groupName)}</span>
          <span class="tag-group-count">${groupAccs.length} tài khoản</span>
          <div class="tag-group-line"></div>
        </div>
        <div class="grid">
          ${groupAccs.map((a, i) => cardHtml(a, i)).join('')}
        </div>
      </div>
    `).join('');

    // Restart TOTP tick cho grouped view
    if (typeof startTotpTick === 'function') startTotpTick();
  }

  // Đặt chế độ xem
  window.setViewMode = function (mode) {
    viewMode = mode;
    activeTag = 'all';

    document.getElementById('vtGrid')?.classList.toggle('active', mode === 'grid');
    document.getElementById('vtGrouped')?.classList.toggle('active', mode === 'grouped');

    const tagBar = document.getElementById('tagFilterBar');

    if (mode === 'grouped') {
      if (tagBar) { tagBar.style.maxHeight = '0'; tagBar.style.marginBottom = '0'; }
      // Reset search/filter
      const sq = document.getElementById('searchQ');
      if (sq) sq.value = '';
      // Render grouped
      renderGrouped();
    } else {
      if (tagBar) { tagBar.style.maxHeight = ''; tagBar.style.marginBottom = ''; }
      refreshTagBar();
      if (typeof renderCards === 'function') renderCards();
    }
  };

  // Lọc theo tag
  window.filterByTag = function (tag) {
    activeTag = tag;
    refreshTagBar();

    const sq = document.getElementById('searchQ');
    const fs = document.getElementById('filterSt');

    if (tag === 'all') {
      if (sq) sq.value = '';
      if (fs) fs.value = 'all';
      if (typeof renderCards === 'function') renderCards();
    } else {
      // Set search về tag đó
      if (sq) {
        sq.value = tag;
        sq.dispatchEvent(new Event('input'));
      }
      if (typeof renderCards === 'function') renderCards();
    }
  };

  // Patch renderCards để refresh tag bar và re-render nếu grouped
  const _origRenderCardsMed = window.renderCards;
  window.renderCards = function () {
    if (viewMode === 'grouped') {
      // Vẫn cập nhật stats
      if (typeof updateStats === 'function') updateStats();
      renderGrouped();
      refreshTagBar();
    } else {
      if (_origRenderCardsMed) _origRenderCardsMed();
      refreshTagBar();
    }
  };


  // ══════════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════════

  function init() {
    loadSparkHistory();
    injectTagUI();
    refreshTagBar();
    // Build stats ngay lần đầu
    setTimeout(buildStatCards, 80);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 180);
  }

})();
