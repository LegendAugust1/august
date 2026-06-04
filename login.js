// ═══════════════════════════
//  LOGIN GATE
// ═══════════════════════════

const SESSION_KEY = 'rblx_session';
const SESSION_TTL = 1000 * 60 * 60 * 8; // 8 tiếng

async function hashPass(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

let _hash = '';
async function initHash() {
  _hash = await hashPass('1');
}

function isLoggedIn() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const { ts } = JSON.parse(raw);
    return Date.now() - ts < SESSION_TTL;
  } catch { return false; }
}

function setSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ts: Date.now() }));
}

function showLogin() {
  document.getElementById('loginGate').style.display = 'flex';
  document.querySelector('.app').style.display = 'none';
  setTimeout(() => document.getElementById('loginInput').focus(), 350);
}

function hideLogin() {
  const gate = document.getElementById('loginGate');
  gate.style.animation = 'loginFadeOut .55s ease forwards';
  setTimeout(() => {
    gate.style.display = 'none';
    document.querySelector('.app').style.display = 'flex';
  }, 550);
}

async function doLogin() {
  const inp = document.getElementById('loginInput');
  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('loginErr');
  const pw  = inp.value;

  if (!pw) { shakeBox(); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="login-spinner"></span> Đang kiểm tra...';

  await new Promise(r => setTimeout(r, 480));

  const h = await hashPass(pw);
  if (h === _hash) {
    setSession();
    btn.innerHTML = '✓ Thành công!';
    btn.style.background = 'linear-gradient(135deg,#059669,#10b981)';
    btn.style.boxShadow  = '0 0 28px rgba(16,185,129,.55)';
    document.getElementById('loginBox').style.borderColor = 'rgba(16,185,129,.45)';
    setTimeout(() => hideLogin(), 700);
  } else {
    btn.disabled = false;
    btn.innerHTML = '🔓 Vào Dashboard';
    inp.value = '';
    err.classList.add('show');
    shakeBox();
    setTimeout(() => err.classList.remove('show'), 2500);
  }
}

function shakeBox() {
  const box = document.getElementById('loginBox');
  box.classList.remove('shake');
  void box.offsetWidth;
  box.classList.add('shake');
}

function togglePw() {
  const inp  = document.getElementById('loginInput');
  const icon = document.getElementById('eyeIcon');
  inp.type   = inp.type === 'password' ? 'text' : 'password';
  icon.textContent = inp.type === 'password' ? '👁️' : '🙈';
}

document.addEventListener('keydown', e => {
  const gate = document.getElementById('loginGate');
  if (e.key === 'Enter' && gate && gate.style.display !== 'none') {
    doLogin();
  }
});

(async () => {
  await initHash();
  if (!isLoggedIn()) showLogin();
})();