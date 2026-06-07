// ═══════════════════════════
//  DATA & STORAGE
// ═══════════════════════════

const KEY = 'rblx_v2';
let accs = [];
let editId = null;
let delId  = null;
const EMOJI = ['🔵','🟣','🟠','🟡','🟢','🔴','⚪','🟤','🩵','🩷'];

function load() {
  try {
    const r = localStorage.getItem(KEY);
    if (r) accs = JSON.parse(r);
  } catch(e) { accs = []; }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(accs));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ═══════════════════════════
//  TOTP ENGINE (RFC 6238)
// ═══════════════════════════

function b32decode(s) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = s.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  let bits = 0, val = 0;
  const out = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = A.indexOf(clean[i]);
    if (idx < 0) continue;
    val = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return new Uint8Array(out);
}

function i2b(n) {
  const b = new Uint8Array(8);
  let x = n;
  for (let i = 7; i >= 0; i--) { b[i] = x & 0xff; x = Math.floor(x / 256); }
  return b;
}

async function genTotp(secret) {
  try {
    const kb = b32decode(secret);
    if (!kb.length) return null;
    const ctr = Math.floor(Date.now() / 1000 / 30);
    const key = await crypto.subtle.importKey('raw', kb, { name:'HMAC', hash:'SHA-1' }, false, ['sign']);
    const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, i2b(ctr)));
    const off = sig[sig.length - 1] & 0x0f;
    const code = (
      ((sig[off]   & 0x7f) << 24) |
      ((sig[off+1] & 0xff) << 16) |
      ((sig[off+2] & 0xff) << 8)  |
       (sig[off+3] & 0xff)
    ) % 1000000;
    return String(code).padStart(6, '0');
  } catch(e) { return null; }
}

// ═══════════════════════════
//  EXPORT / IMPORT (AES-256-GCM)
// ═══════════════════════════

// Mở modal nhập mật khẩu để xuất
function exportData() {
  _cryptoModalOpen({
    mode:    'export',
    title:   '🔐 Mã Hóa & Xuất Dữ Liệu',
    sub:     'Nhập mật khẩu để mã hóa file. Cần mật khẩu này khi import lại.',
    btnText: '📤 Xuất & Mã Hóa',
    btnCls:  '',
    onConfirm: async pw => {
      try {
        const enc    = new TextEncoder();
        const pwKey  = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
        const salt   = crypto.getRandomValues(new Uint8Array(16));
        const key    = await crypto.subtle.deriveKey(
          { name:'PBKDF2', salt, iterations:100000, hash:'SHA-256' },
          pwKey, { name:'AES-GCM', length:256 }, false, ['encrypt']
        );
        const iv        = crypto.getRandomValues(new Uint8Array(12));
        const cipherBuf = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, enc.encode(JSON.stringify(accs)));
        const combined  = new Uint8Array(16 + 12 + cipherBuf.byteLength);
        combined.set(salt, 0); combined.set(iv, 16);
        combined.set(new Uint8Array(cipherBuf), 28);
        const payload = JSON.stringify({ v:1, enc:'AES-GCM', data: btoa(String.fromCharCode(...combined)) });
        const a = Object.assign(document.createElement('a'), {
          href: URL.createObjectURL(new Blob([payload], { type:'application/json' })),
          download: 'back-up.json'
        });
        a.click(); URL.revokeObjectURL(a.href);
        toast('🔐 Xuất & mã hóa thành công!', 'ok');
      } catch(e) { toast('❌ Lỗi mã hóa: ' + e.message, 'err'); }
    }
  });
}

// Mở modal nhập mật khẩu để import
let _pendingImportData = null;

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      // File cũ (JSON thuần không mã hóa)
      if (Array.isArray(parsed)) {
        accs = parsed; save(); renderCards();
        toast(`✅ Đã import ${parsed.length} tài khoản!`, 'ok');
        event.target.value = '';
        return;
      }
      // File mã hóa mới
      if (parsed.v === 1 && parsed.enc === 'AES-GCM') {
        _pendingImportData = parsed;
        _cryptoModalOpen({
          mode:    'import',
          title:   '🔓 Giải Mã & Import',
          sub:     'Nhập mật khẩu bạn đã dùng khi xuất file này.',
          btnText: '📥 Giải Mã & Import',
          btnCls:  'import',
          onConfirm: async pw => {
            try {
              const combined = Uint8Array.from(atob(_pendingImportData.data), c => c.charCodeAt(0));
              const salt = combined.slice(0, 16), iv = combined.slice(16, 28), cipher = combined.slice(28);
              const enc   = new TextEncoder();
              const pwKey = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
              const key   = await crypto.subtle.deriveKey(
                { name:'PBKDF2', salt, iterations:100000, hash:'SHA-256' },
                pwKey, { name:'AES-GCM', length:256 }, false, ['decrypt']
              );
              let plain;
              try {
                plain = new TextDecoder().decode(await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, cipher));
              } catch {
                _cryptoModalShakeError('Sai mật khẩu hoặc file bị hỏng!');
                return false; // giữ modal mở
              }
              const data = JSON.parse(plain);
              accs = data; save(); renderCards();
              toast(`✅ Giải mã & import ${data.length} tài khoản!`, 'ok');
            } catch(e) { toast('❌ Lỗi: ' + e.message, 'err'); }
          }
        });
      } else {
        toast('❌ Định dạng file không hỗ trợ!', 'err');
      }
    } catch { toast('❌ File không hợp lệ!', 'err'); }
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ── Crypto Modal Engine ──
let _cryptoOnConfirm = null;

function _cryptoModalOpen({ mode, title, sub, btnText, btnCls, onConfirm }) {
  _cryptoOnConfirm = onConfirm;
  document.getElementById('cryptoModTitle').textContent  = title;
  document.getElementById('cryptoModSub').textContent    = sub;
  document.getElementById('cryptoModBtn').textContent    = btnText;
  document.getElementById('cryptoModBtn').className      = 'btn btn-primary crypto-confirm-btn' + (btnCls ? ' ' + btnCls : '');
  document.getElementById('cryptoPwInput').value         = '';
  document.getElementById('cryptoModErr').style.display  = 'none';
  document.getElementById('cryptoModErr').textContent    = '';
  document.getElementById('cryptoEyeIcon').textContent   = '👁️';
  document.getElementById('cryptoPwInput').type          = 'password';
  // reset star particles
  _cryptoSpawnStars();
  document.getElementById('ovCrypto').classList.add('open');
  setTimeout(() => document.getElementById('cryptoPwInput').focus(), 280);
}

function _cryptoModalShakeError(msg) {
  const box = document.getElementById('cryptoModalBox');
  const err = document.getElementById('cryptoModErr');
  err.textContent    = '⚠️ ' + msg;
  err.style.display  = 'flex';
  box.classList.remove('crypto-shake');
  void box.offsetWidth;
  box.classList.add('crypto-shake');
  document.getElementById('cryptoPwInput').value = '';
  document.getElementById('cryptoPwInput').focus();
}

async function _cryptoModalConfirm() {
  const pw  = document.getElementById('cryptoPwInput').value;
  const btn = document.getElementById('cryptoModBtn');
  if (!pw) { _cryptoModalShakeError('Mật khẩu không được để trống!'); return; }
  const origHTML = btn.innerHTML;
  btn.disabled   = true;
  btn.innerHTML  = '<span class="login-spinner"></span> Đang xử lý...';
  const result   = await _cryptoOnConfirm(pw);
  btn.disabled   = false;
  btn.innerHTML  = origHTML;
  if (result !== false) {
    document.getElementById('ovCrypto').classList.remove('open');
  }
}

function _cryptoTogglePw() {
  const inp  = document.getElementById('cryptoPwInput');
  const icon = document.getElementById('cryptoEyeIcon');
  inp.type   = inp.type === 'password' ? 'text' : 'password';
  icon.textContent = inp.type === 'password' ? '👁️' : '🙈';
}

// Particle stars inside modal
function _cryptoSpawnStars() {
  const c = document.getElementById('cryptoStarCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width = c.offsetWidth || 400;
  const H = c.height = c.offsetHeight || 260;
  ctx.clearRect(0, 0, W, H);
  const stars = Array.from({length: 38}, () => ({
    x: Math.random()*W, y: Math.random()*H,
    r: Math.random()*1.4+0.3,
    a: Math.random()*0.7+0.15,
    sp: Math.random()*0.012+0.004,
    ph: Math.random()*Math.PI*2,
    col: ['#c084fc','#818cf8','#67e8f9','#fff'][Math.floor(Math.random()*4)]
  }));
  let raf;
  let t = 0;
  function draw() {
    if (!document.getElementById('ovCrypto').classList.contains('open')) { cancelAnimationFrame(raf); return; }
    t += 1;
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      const al = s.a * (0.5 + 0.5 * Math.sin(t * s.sp * 60 + s.ph));
      ctx.globalAlpha = al;
      ctx.fillStyle   = s.col;
      ctx.shadowBlur  = 6; ctx.shadowColor = s.col;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    });
    raf = requestAnimationFrame(draw);
  }
  draw();
}