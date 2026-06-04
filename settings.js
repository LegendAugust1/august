// ═══════════════════════════
//  SETTINGS
// ═══════════════════════════

const SETTINGS_KEY = 'rblx_settings';

const COLOR_THEMES = {
  purple: { accent:'#7c3aed', accent2:'#a855f7', accent3:'#c084fc', neon:'#d8b4fe' },
  blue:   { accent:'#1d4ed8', accent2:'#3b82f6', accent3:'#93c5fd', neon:'#bfdbfe' },
  cyan:   { accent:'#0891b2', accent2:'#06b6d4', accent3:'#67e8f9', neon:'#a5f3fc' },
  green:  { accent:'#059669', accent2:'#10b981', accent3:'#6ee7b7', neon:'#a7f3d0' },
  rose:   { accent:'#be123c', accent2:'#f43f5e', accent3:'#fda4af', neon:'#fecdd3' },
  orange: { accent:'#c2410c', accent2:'#f97316', accent3:'#fdba74', neon:'#fed7aa' },
  gold:   { accent:'#a16207', accent2:'#eab308', accent3:'#fde047', neon:'#fef08a' },
  pink:   { accent:'#9d174d', accent2:'#ec4899', accent3:'#f9a8d4', neon:'#fce7f3' },
};

const FONT_IMPORTS = {
  'Sora':    'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600&display=swap',
  'Inter':   'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap',
  'Rajdhani':'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap',
  'Exo 2':   'https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600&display=swap',
  'Ubuntu':  'https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap',
  'Nunito':  'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600&display=swap',
};

let currentSettings = {
  dashName:  'ROBLOX MANAGER',
  color:     'purple',
  font:      'Sora',
  galaxy:    true,
  cursor:    true,
  cardHover: true,
  fontSize:  'normal',
};

// ── Load / Save ──
function loadSettings() {
  try {
    const r = localStorage.getItem(SETTINGS_KEY);
    if (r) currentSettings = { ...currentSettings, ...JSON.parse(r) };
  } catch(e) {}
  applySettings(currentSettings);
}

function saveSettings() {
  // đọc giá trị từ UI
  currentSettings.dashName  = document.getElementById('setDashName').value.trim() || 'ROBLOX MANAGER';
  currentSettings.font      = document.getElementById('setFont').value;
  currentSettings.galaxy    = document.getElementById('setGalaxy').checked;
  currentSettings.cursor    = document.getElementById('setCursor').checked;
  currentSettings.cardHover = document.getElementById('setCardHover').checked;

  // color từ palette
  const active = document.querySelector('.color-dot.active');
  if (active) currentSettings.color = active.dataset.color;

  // font size
  const sizeActive = document.querySelector('.size-opt.active');
  if (sizeActive) currentSettings.fontSize = sizeActive.dataset.size;

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));
  applySettings(currentSettings);
  toast('✅ Đã lưu cài đặt!', 'ok');
}

// ── Apply ──
function applySettings(s) {
  const root = document.documentElement;

  // màu accent
  const theme = COLOR_THEMES[s.color] || COLOR_THEMES.purple;
  root.style.setProperty('--accent',  theme.accent);
  root.style.setProperty('--accent2', theme.accent2);
  root.style.setProperty('--accent3', theme.accent3);
  root.style.setProperty('--neon',    theme.neon);

  // font
  applyFont(s.font);

  // font size
  const sizeMap = { small:'12px', normal:'14px', large:'16px' };
  root.style.setProperty('font-size', sizeMap[s.fontSize] || '14px');

  // galaxy
  const bgCanvas = document.getElementById('bgCanvas');
  const fgCanvas = document.getElementById('fgCanvas');
  if (bgCanvas) bgCanvas.style.opacity = s.galaxy ? '1' : '0';
  if (fgCanvas) fgCanvas.style.opacity = s.galaxy ? '1' : '0';

  // cursor
  const dot  = document.getElementById('cDot');
  const ring = document.getElementById('cRing');
  if (dot)  dot.style.display  = s.cursor ? 'block' : 'none';
  if (ring) ring.style.display = s.cursor ? 'block' : 'none';
  document.body.style.cursor = s.cursor ? 'none' : 'default';

  // card hover
  const styleId = 'setting-card-hover';
  let el = document.getElementById(styleId);
  if (!el) { el = document.createElement('style'); el.id = styleId; document.head.appendChild(el); }
  el.textContent = s.cardHover ? '' : '.acc-card:hover { transform:none !important; box-shadow:none !important; }';

  // tên dashboard
  const logoH1 = document.querySelector('.sb-logo h1');
  if (logoH1) {
    const name = s.dashName || 'ROBLOX MANAGER';
    const parts = name.split(' ');
    logoH1.innerHTML = parts.length > 1 ? parts[0] + '<br>' + parts.slice(1).join(' ') : name;
  }
  const aboutName = document.getElementById('aboutName');
  if (aboutName) aboutName.textContent = s.dashName || 'ROBLOX MANAGER';
}

function applyFont(font) {
  // inject link nếu chưa có
  const linkId = 'setting-font-link';
  let link = document.getElementById(linkId);
  if (!link) {
    link = document.createElement('link');
    link.id  = linkId;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (FONT_IMPORTS[font]) link.href = FONT_IMPORTS[font];
  document.body.style.fontFamily = `'${font}', sans-serif`;
}

// ── Sync UI với settings hiện tại ──
function syncSettingsUI() {
  const s = currentSettings;
  const nameEl = document.getElementById('setDashName');
  if (nameEl) nameEl.value = s.dashName || '';

  const fontEl = document.getElementById('setFont');
  if (fontEl) fontEl.value = s.font || 'Sora';

  const galaxyEl = document.getElementById('setGalaxy');
  if (galaxyEl) galaxyEl.checked = s.galaxy !== false;

  const cursorEl = document.getElementById('setCursor');
  if (cursorEl) cursorEl.checked = s.cursor !== false;

  const hoverEl = document.getElementById('setCardHover');
  if (hoverEl) hoverEl.checked = s.cardHover !== false;

  // color dots
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.color === s.color);
  });

  // size opts
  document.querySelectorAll('.size-opt').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.size === (s.fontSize || 'normal'));
  });

  // storage info
  updateStorageInfo();
}

function updateStorageInfo() {
  const el = document.getElementById('storageInfo');
  if (!el) return;
  let total = 0;
  for (const k in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, k)) {
      total += (localStorage[k].length + k.length) * 2;
    }
  }
  el.textContent = (total / 1024).toFixed(1) + ' KB';
}

// ── Event: color dots ──
document.addEventListener('click', e => {
  const dot = e.target.closest('.color-dot');
  if (dot) {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
  }
  const sizeOpt = e.target.closest('.size-opt');
  if (sizeOpt) {
    document.querySelectorAll('.size-opt').forEach(o => o.classList.remove('active'));
    sizeOpt.classList.add('active');
  }
});

// ── Gotoview hook: sync UI khi vào settings ──
const _origGotoViewSettings = window.gotoView || gotoView;
window.gotoView = function(name, el) {
  _origGotoViewSettings(name, el);
  if (name === 'settings') syncSettingsUI();
};

// ── Xóa toàn bộ ──
function confirmClearAll() {
  document.getElementById('ovClear').classList.add('open');
}

function doClearAll() {
  accs = [];
  save();
  renderCards();
  closeOv('ovClear');
  toast('🗑️ Đã xóa toàn bộ tài khoản!', 'ok');
}

// ── Reset kỷ lục snake ──
function resetSnakeBest() {
  localStorage.removeItem('rblx_snake_best');
  const b = document.getElementById('snakeBest');
  const bt = document.getElementById('snakeBestTop');
  if (b)  b.textContent  = '0';
  if (bt) bt.textContent = '0';
  if (typeof updateHubScores === 'function') updateHubScores();
  toast('🔄 Đã reset kỷ lục rắn!', 'ok');
}

// ── Import JSON ──
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error('Invalid');
      accs = data;
      save();
      renderCards();
      toast(`✅ Đã import ${data.length} tài khoản!`, 'ok');
    } catch {
      toast('❌ File không hợp lệ!', 'err');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ── Init ──
loadSettings();
