// ═══════════════════════════
//  GALAXY BACKGROUND
// ═══════════════════════════

const bgCanvas = document.getElementById('bgCanvas');
const bgx = bgCanvas.getContext('2d');
const fgCanvas = document.getElementById('fgCanvas');
const fgx = fgCanvas.getContext('2d');

let W, H;

function resize() {
  W = bgCanvas.width = fgCanvas.width = window.innerWidth;
  H = bgCanvas.height = fgCanvas.height = window.innerHeight;
  buildNebula();
}
window.addEventListener('resize', resize);

// Stars
const STARS = [];
function buildStars() {
  STARS.length = 0;
  const colors = ['#ffffff','#c084fc','#818cf8','#67e8f9','#f0abfc','#a5f3fc'];
  for (let i = 0; i < 240; i++) {
    STARS.push({
      x: Math.random() * (W || 1200),
      y: Math.random() * (H || 800),
      r: Math.random() * 1.7 + 0.2,
      baseA: Math.random() * 0.7 + 0.15,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.018 + 0.004,
      col: colors[Math.floor(Math.random() * colors.length)],
      ox: 0, oy: 0,
    });
  }
}

// Nebula clouds
const NEBULA = [];
function buildNebula() {
  NEBULA.length = 0;
  const defs = [
    { xp:.12, yp:.18, rx:320, ry:190, c:'90,30,200',   a:.065 },
    { xp:.78, yp:.62, rx:380, ry:230, c:'30,70,210',   a:.055 },
    { xp:.5,  yp:.88, rx:290, ry:170, c:'160,20,170',  a:.05  },
    { xp:.92, yp:.1,  rx:240, ry:150, c:'10,130,190',  a:.048 },
    { xp:.35, yp:.45, rx:260, ry:160, c:'80,0,160',    a:.04  },
  ];
  defs.forEach(d => NEBULA.push({ x: W*d.xp, y: H*d.yp, ...d }));
}

// Shooting stars
const SHOOTS = [];
function spawnShoot() {
  const a = (Math.random() * 25 + 8) * Math.PI / 180;
  SHOOTS.push({
    x: Math.random() * W * .85,
    y: Math.random() * H * .3,
    vx: Math.cos(a) * (9 + Math.random() * 7),
    vy: Math.sin(a) * (9 + Math.random() * 7),
    len: 70 + Math.random() * 100,
    alpha: 1,
    col: Math.random() > .5 ? '#d8b4fe' : '#e0e7ff',
  });
}
setInterval(() => { if (Math.random() > .35) spawnShoot(); }, 2000);

// Mouse & FX state
const mouse = { x:-999, y:-999, px:-999, py:-999 };
const trails = [];
const ripples = [];
let t = 0;

document.addEventListener('mousemove', e => {
  mouse.px = mouse.x; mouse.py = mouse.y;
  mouse.x = e.clientX; mouse.y = e.clientY;
  const cDot  = document.getElementById('cDot');
  const cRing = document.getElementById('cRing');
  if (cDot)  { cDot.style.left  = e.clientX + 'px'; cDot.style.top  = e.clientY + 'px'; }
  if (cRing) { cRing.style.left = e.clientX + 'px'; cRing.style.top = e.clientY + 'px'; }
  const spd = Math.hypot(mouse.x - mouse.px, mouse.y - mouse.py);
  if (spd > 2.5) trails.push({ x:mouse.x, y:mouse.y, r:2.5+spd*.1, alpha:.55, life:1 });
  if (trails.length > 80) trails.shift();
});

document.addEventListener('click', e => {
  for (let i = 0; i < 3; i++) {
    ripples.push({ x:e.clientX, y:e.clientY, r:0, maxR:70+i*40, alpha:.65-i*.15, spd:3+i*1.8, col: i===0 ? '#c084fc' : '#818cf8' });
  }
  for (let i = 0; i < 14; i++) {
    const ang = (i / 14) * Math.PI * 2;
    trails.push({ x:e.clientX, y:e.clientY, vx:Math.cos(ang)*(2+Math.random()*4), vy:Math.sin(ang)*(2+Math.random()*4), r:1.8+Math.random()*2.2, alpha:.9, life:1, burst:true });
  }
});

document.addEventListener('mouseover', e => {
  const ring = document.getElementById('cRing');
  if (!ring) return;
  if (e.target.closest('button,.nav-item,.acc-card,.cp-btn')) {
    ring.style.width = '44px'; ring.style.height = '44px';
    ring.style.borderColor = 'rgba(192,132,252,.9)';
  } else {
    ring.style.width = '30px'; ring.style.height = '30px';
    ring.style.borderColor = 'rgba(192,132,252,.55)';
  }
});

function drawBg() {
  t += .016;
  bgx.clearRect(0, 0, W, H);

  // deep space gradient
  const grd = bgx.createRadialGradient(W*.5, H*.5, 0, W*.5, H*.5, Math.max(W,H)*.8);
  grd.addColorStop(0,  '#0d0620');
  grd.addColorStop(.45,'#060510');
  grd.addColorStop(1,  '#010108');
  bgx.fillStyle = grd;
  bgx.fillRect(0, 0, W, H);

  // nebula clouds
  NEBULA.forEach(n => {
    bgx.save();
    const g = bgx.createRadialGradient(n.x, n.y*n.rx/n.ry, 0, n.x, n.y*n.rx/n.ry, n.rx);
    g.addColorStop(0,    `rgba(${n.c},${n.a})`);
    g.addColorStop(.55,  `rgba(${n.c},${n.a*.38})`);
    g.addColorStop(1,    `rgba(${n.c},0)`);
    bgx.scale(1, n.ry/n.rx);
    bgx.fillStyle = g;
    bgx.beginPath(); bgx.arc(n.x, n.y*n.rx/n.ry, n.rx, 0, Math.PI*2); bgx.fill();
    bgx.restore();
  });

  // mouse glow
  if (mouse.x > 0) {
    const mg = bgx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 200);
    mg.addColorStop(0, 'rgba(168,85,247,.07)');
    mg.addColorStop(1, 'rgba(168,85,247,0)');
    bgx.fillStyle = mg;
    bgx.fillRect(0, 0, W, H);
  }

  // stars
  STARS.forEach(s => {
    const dx = s.x - mouse.x, dy = s.y - mouse.y;
    const d = Math.sqrt(dx*dx + dy*dy);
    if (d < 130 && d > 0) { const f = (130-d)/130; s.ox += (dx/d)*f*1.5; s.oy += (dy/d)*f*1.5; }
    s.ox *= .88; s.oy *= .88;
    const rx = s.x + s.ox, ry = s.y + s.oy;
    const al = s.baseA * (.55 + .45 * Math.sin(t * s.speed * 62 + s.phase));
    const boost = d < 160 ? (1 - d/160) * 1.6 : 0;
    bgx.globalAlpha = Math.min(1, al + boost * .45);
    bgx.shadowBlur  = boost > 0.3 ? 10 : 0;
    bgx.shadowColor = s.col;
    bgx.fillStyle   = s.col;
    bgx.beginPath(); bgx.arc(rx, ry, s.r + boost*1.2, 0, Math.PI*2); bgx.fill();
    bgx.globalAlpha = 1; bgx.shadowBlur = 0;
  });

  // shooting stars
  for (let i = SHOOTS.length - 1; i >= 0; i--) {
    const ss = SHOOTS[i];
    ss.x += ss.vx; ss.y += ss.vy; ss.alpha -= .016;
    if (ss.alpha <= 0) { SHOOTS.splice(i, 1); continue; }
    const mag = Math.hypot(ss.vx, ss.vy);
    const tx = ss.x - (ss.vx/mag)*ss.len, ty = ss.y - (ss.vy/mag)*ss.len;
    const tg = bgx.createLinearGradient(tx, ty, ss.x, ss.y);
    tg.addColorStop(0, 'rgba(255,255,255,0)');
    tg.addColorStop(1, `rgba(255,255,255,${ss.alpha})`);
    bgx.strokeStyle = tg; bgx.lineWidth = 1.5;
    bgx.shadowBlur = 7; bgx.shadowColor = ss.col;
    bgx.beginPath(); bgx.moveTo(tx, ty); bgx.lineTo(ss.x, ss.y); bgx.stroke();
    bgx.shadowBlur = 0;
  }

  requestAnimationFrame(drawBg);
}

function drawFg() {
  fgx.clearRect(0, 0, W, H);

  // cursor trails & burst particles
  for (let i = trails.length - 1; i >= 0; i--) {
    const w = trails[i];
    if (w.burst) { w.x += w.vx; w.y += w.vy; w.vx *= .93; w.vy *= .93; }
    w.alpha -= w.burst ? .028 : .038;
    w.r *= .96;
    if (w.alpha <= 0) { trails.splice(i, 1); continue; }
    fgx.globalAlpha = w.alpha;
    fgx.fillStyle   = '#c084fc';
    fgx.shadowBlur  = 7; fgx.shadowColor = '#a855f7';
    fgx.beginPath(); fgx.arc(w.x, w.y, Math.max(.1, w.r), 0, Math.PI*2); fgx.fill();
    fgx.globalAlpha = 1; fgx.shadowBlur = 0;
  }

  // click ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.r += rp.spd; rp.alpha -= .016;
    if (rp.alpha <= 0) { ripples.splice(i, 1); continue; }
    fgx.globalAlpha  = rp.alpha;
    fgx.strokeStyle  = rp.col;
    fgx.lineWidth    = 1.5;
    fgx.shadowBlur   = 14; fgx.shadowColor = rp.col;
    fgx.beginPath(); fgx.arc(rp.x, rp.y, rp.r, 0, Math.PI*2); fgx.stroke();
    fgx.globalAlpha  = 1; fgx.shadowBlur = 0;
  }

  // constellation lines to nearby stars
  if (mouse.x > 0) {
    STARS.forEach(s => {
      const rx = s.x + s.ox, ry = s.y + s.oy;
      const dx = rx - mouse.x, dy = ry - mouse.y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < 120) {
        fgx.globalAlpha = (1 - d/120) * .32;
        fgx.strokeStyle = '#c084fc';
        fgx.lineWidth   = .7;
        fgx.beginPath(); fgx.moveTo(mouse.x, mouse.y); fgx.lineTo(rx, ry); fgx.stroke();
        fgx.globalAlpha = 1;
      }
    });
  }

  requestAnimationFrame(drawFg);
}

// ═══════════════════════════
//  NAVIGATION
// ═══════════════════════════

function gotoView(name, el) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const v = document.getElementById('view-' + name);
  if (v) v.classList.add('active');
  if (el) el.classList.add('active');
}

// ═══════════════════════════
//  STATS
// ═══════════════════════════

function updateStats() {
  const total  = accs.length;
  const online = accs.filter(a => a.status === 'online').length;
  const banned = accs.filter(a => a.status === 'banned').length;
  const robux  = accs.reduce((s, a) => s + (Number(a.robux) || 0), 0);
  document.getElementById('sTotal').textContent  = total;
  document.getElementById('sOnline').textContent = online;
  document.getElementById('sBanned').textContent = banned;
  document.getElementById('sRobux').textContent  = robux.toLocaleString('vi-VN');
  document.getElementById('badgeTotal').textContent = total;
}

// ═══════════════════════════
//  RENDER CARDS
// ═══════════════════════════

function renderCards() {
  const q  = (document.getElementById('searchQ').value || '').toLowerCase();
  const fs = document.getElementById('filterSt').value;
  const so = document.getElementById('sortBy').value;

  let list = [...accs];
  if (q) list = list.filter(a =>
    a.username.toLowerCase().includes(q) ||
    (a.display || '').toLowerCase().includes(q) ||
    (a.tags || []).some(t => t.toLowerCase().includes(q)) ||
    (a.note  || '').toLowerCase().includes(q)
  );
  if (fs !== 'all') list = list.filter(a => a.status === fs);
  if (so === 'name')  list.sort((a, b) => a.username.localeCompare(b.username));
  else if (so === 'robux') list.sort((a, b) => (b.robux||0) - (a.robux||0));
  else list.sort((a, b) => (b.createdAt||0) - (a.createdAt||0));

  const grid = document.getElementById('cardGrid');

  if (!list.length) {
    grid.innerHTML = `<div class="empty">
      <div class="empty-ico">🎮</div>
      <p>${accs.length === 0 ? 'Chưa có tài khoản. Nhấn "Thêm Tài Khoản" để bắt đầu!' : 'Không tìm thấy kết quả.'}</p>
      ${accs.length === 0 ? '<button class="btn btn-primary" style="margin-top:14px" onclick="openAdd()">＋ Thêm Tài Khoản</button>' : ''}
    </div>`;
    updateStats(); return;
  }

  const slabels  = { online:'Online', offline:'Offline', banned:'Bị ban' };
  const sclasses = { online:'s-on',   offline:'s-off',   banned:'s-ban'  };

  grid.innerHTML = list.map((a, i) => {
    const em         = a.emoji || EMOJI[i % EMOJI.length];
    const avatarCls  = a.status === 'online' ? 'on' : 'off';
    const delay      = (i * .04).toFixed(2);
    const tags       = (a.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');

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
  }).join('');

  updateStats();
  startTotpTick();
}

// ═══════════════════════════
//  MODAL HELPERS
// ═══════════════════════════

function openAdd() {
  editId = null;
  document.getElementById('modTitle').textContent = '➕ Thêm Tài Khoản';
  clearForm();
  document.getElementById('ovMain').classList.add('open');
}

function openEdit(id) {
  const a = accs.find(x => x.id === id);
  if (!a) return;
  editId = id;
  document.getElementById('modTitle').textContent = '✏️ Chỉnh Sửa Tài Khoản';
  document.getElementById('fUser').value   = a.username || '';
  document.getElementById('fDisp').value   = a.display  || '';
  document.getElementById('fPass').value   = a.password || '';
  document.getElementById('fEmail').value  = a.email    || '';
  document.getElementById('fRobux').value  = a.robux    || '';
  document.getElementById('fStatus').value = a.status   || 'offline';
  document.getElementById('fTags').value   = (a.tags || []).join(', ');
  document.getElementById('fNote').value   = a.note     || '';
  document.getElementById('fTotp').value   = a.totp     || '';
  document.getElementById('totpPrev').classList.remove('show');
  document.getElementById('ovMain').classList.add('open');
}

function clearForm() {
  ['fUser','fDisp','fPass','fEmail','fRobux','fTags','fNote','fTotp'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('fStatus').value = 'offline';
  document.getElementById('totpPrev').classList.remove('show');
}

function saveAcc() {
  const username = document.getElementById('fUser').value.trim();
  if (!username) { toast('Vui lòng nhập username!', 'err'); return; }

  const tags = document.getElementById('fTags').value.split(',').map(t => t.trim()).filter(Boolean);
  const totp = document.getElementById('fTotp').value.trim().replace(/\s/g, '').toUpperCase();

  const data = {
    username,
    display:  document.getElementById('fDisp').value.trim(),
    password: document.getElementById('fPass').value,
    email:    document.getElementById('fEmail').value.trim(),
    robux:    Number(document.getElementById('fRobux').value) || 0,
    status:   document.getElementById('fStatus').value,
    tags, note: document.getElementById('fNote').value.trim(),
    totp,
  };

  if (editId) {
    const i = accs.findIndex(a => a.id === editId);
    if (i !== -1) accs[i] = { ...accs[i], ...data };
    toast('✅ Đã cập nhật!', 'ok');
  } else {
    accs.push({ id: uid(), emoji: EMOJI[accs.length % EMOJI.length], createdAt: Date.now(), ...data });
    toast('✅ Đã thêm tài khoản!', 'ok');
  }
  save(); renderCards();
  closeOv('ovMain');
}

function ovClick(e, id) {
  if (e.target === document.getElementById(id)) closeOv(id);
}

function closeOv(id) {
  document.getElementById(id).classList.remove('open');
}

function openDel(id) {
  delId = id;
  const a = accs.find(x => x.id === id);
  document.getElementById('delName').textContent = a?.username || '?';
  document.getElementById('ovDel').classList.add('open');
}

function doDelete() {
  accs = accs.filter(a => a.id !== delId);
  save(); renderCards();
  closeOv('ovDel');
  toast('🗑️ Đã xóa.', 'ok');
}

// ═══════════════════════════
//  COPY HELPERS
// ═══════════════════════════

function doCopy(btn, val) {
  navigator.clipboard.writeText(val).then(() => {
    btn.textContent = '✓'; btn.classList.add('ok');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('ok'); }, 1800);
  }).catch(() => toast('Không thể copy!', 'err'));
}

function togglePw(id, pw) {
  const el  = document.getElementById('pw-' + id);
  const btn = document.getElementById('eye-' + id);
  if (!el) return;
  if (el.classList.contains('masked')) {
    el.textContent = pw; el.classList.remove('masked'); btn.textContent = '🙈';
  } else {
    el.textContent = '••••••••'; el.classList.add('masked'); btn.textContent = '👁';
  }
}

async function copyTotp(id) {
  const a = accs.find(x => x.id === id);
  if (!a?.totp) return;
  const code = await genTotp(a.totp);
  if (!code) { toast('Lỗi mã TOTP!', 'err'); return; }
  navigator.clipboard.writeText(code).then(() => toast('📋 Đã copy TOTP!', 'ok'));
}

// ═══════════════════════════
//  TOTP LIVE TICK
// ═══════════════════════════

let totpTick = null;

function startTotpTick() {
  if (totpTick) clearInterval(totpTick);
  tickTotp();
  totpTick = setInterval(tickTotp, 1000);
}

async function tickTotp() {
  const now  = Math.floor(Date.now() / 1000);
  const left = 30 - (now % 30);
  const pct  = (left / 30) * 100;
  for (const a of accs) {
    if (!a.totp) continue;
    const ce = document.getElementById('tc-' + a.id);
    const be = document.getElementById('tb-' + a.id);
    const se = document.getElementById('ts-' + a.id);
    if (!ce) continue;
    if (left === 30 || ce.textContent === '--- ---') {
      const code = await genTotp(a.totp);
      if (code) {
        ce.style.opacity = '0';
        setTimeout(() => { ce.textContent = code.slice(0,3) + ' ' + code.slice(3); ce.style.opacity = '1'; }, 120);
      } else { ce.textContent = 'ERR'; }
    }
    if (be) { be.style.width = pct + '%'; be.className = 'totp-bar' + (left <= 5 ? ' danger' : left <= 10 ? ' warn' : ''); }
    if (se) se.textContent = left + 's';
  }
}

// ═══════════════════════════
//  TOTP PREVIEW (modal)
// ═══════════════════════════

async function previewTotp() {
  const s = document.getElementById('fTotp').value.trim();
  if (!s) { toast('Nhập secret key trước!', 'err'); return; }
  const code = await genTotp(s);
  const box  = document.getElementById('totpPrev');
  if (code) {
    document.getElementById('totpPrevCode').textContent = code.slice(0,3) + ' ' + code.slice(3);
    box.classList.add('show');
    toast('✅ Secret hợp lệ!', 'ok');
  } else {
    box.classList.remove('show');
    toast('❌ Secret không hợp lệ!', 'err');
  }
}

// ═══════════════════════════
//  TOAST
// ═══════════════════════════

function toast(msg, type = 'ok') {
  const w  = document.getElementById('toastWrap');
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  w.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'slideOut .28s ease forwards';
    setTimeout(() => el.remove(), 280);
  }, 2800);
}

// ═══════════════════════════
//  INIT
// ═══════════════════════════

resize();
buildStars();
drawBg();
drawFg();
load();
renderCards();