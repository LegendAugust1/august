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
//  EXPORT
// ═══════════════════════════

function exportData() {
  const blob = new Blob([JSON.stringify(accs, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'roblox-accounts.json'; a.click();
  URL.revokeObjectURL(url);
  toast('📤 Đã xuất dữ liệu!', 'ok');
}
