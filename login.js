// ═══════════════════════════════════════════════════
//  AUTH SYSTEM  —  login.js
//  Gửi OTP qua EmailJS REST API (không cần SDK)
// ═══════════════════════════════════════════════════

const EMAILJS_SERVICE_ID  = 'service_k9pl3sl';
const EMAILJS_TEMPLATE_ID = 'template_22caiw1';
const EMAILJS_PUBLIC_KEY  = 'DkcC2Hzqw2huWBG2t';

const SESSION_KEY = 'rblx_session';
const USERS_KEY   = 'rblx_users';
const SESSION_TTL = 1000 * 60 * 60 * 8;

const PANEL = {
  login:    document.getElementById('authPanelLogin'),
  register: document.getElementById('authPanelRegister'),
  otp:      document.getElementById('authPanelOtp'),
  forgot:   document.getElementById('authPanelForgot'),
  resetPw:  document.getElementById('authPanelResetPw'),
};

let _otpFlow    = 'register';
let _otpCode    = '';
let _otpExpiry  = 0;
let _otpTarget  = '';
let _regPayload = null;
let _forgotEmail= '';

// ════════════════════════════════
//  UTILS
// ════════════════════════════════
async function hashPass(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}
function saveUsers(arr) { localStorage.setItem(USERS_KEY, JSON.stringify(arr)); }

function isLoggedIn() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const { ts } = JSON.parse(raw);
    return Date.now() - ts < SESSION_TTL;
  } catch { return false; }
}
function setSession(username) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ts: Date.now(), username }));
}

function authShowErr(panelId, msg) {
  const el = document.getElementById(panelId);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3500);
}
function authClearErr(panelId) {
  const el = document.getElementById(panelId);
  if (el) el.classList.remove('show');
}

function authShake() {
  const box = document.getElementById('loginBox');
  if (!box) return;
  box.classList.remove('shake');
  void box.offsetWidth;
  box.classList.add('shake');
}

function switchPanel(name) {
  Object.values(PANEL).forEach(p => { if (p) p.style.display = 'none'; });
  if (PANEL[name]) {
    PANEL[name].style.display = 'block';
    PANEL[name].style.animation = 'authPanelIn .32s cubic-bezier(.34,1.2,.64,1) both';
  }
  const subtitles = {
    login:    'Đăng nhập để tiếp tục',
    register: 'Tạo tài khoản mới',
    otp:      'Xác minh email của bạn',
    forgot:   'Khôi phục mật khẩu',
    resetPw:  'Đặt mật khẩu mới',
  };
  const sub = document.getElementById('authSub');
  if (sub) sub.textContent = subtitles[name] || '';
}

function toggleAuthPw(inputId, iconId) {
  const inp  = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  if (icon) icon.textContent = inp.type === 'password' ? '👁️' : '🙈';
}

// ════════════════════════════════
//  ĐĂNG NHẬP
// ════════════════════════════════
async function doLogin() {
  const ident = document.getElementById('loginIdent')?.value.trim();
  const pw    = document.getElementById('loginPw')?.value;
  const btn   = document.getElementById('loginBtn');

  if (!ident || !pw) { authShowErr('loginErr', '⚠️ Vui lòng điền đầy đủ thông tin.'); authShake(); return; }

  btn.disabled  = true;
  btn.innerHTML = '<span class="login-spinner"></span> Đang kiểm tra...';
  await new Promise(r => setTimeout(r, 420));

  const users = loadUsers();
  const hash  = await hashPass(pw);
  const user  = users.find(u =>
    (u.username.toLowerCase() === ident.toLowerCase() || u.email.toLowerCase() === ident.toLowerCase())
    && u.passwordHash === hash
  );

  if (user) {
    setSession(user.username);
    btn.innerHTML            = '✓ Thành công!';
    btn.style.background     = 'linear-gradient(135deg,#059669,#10b981)';
    btn.style.boxShadow      = '0 0 28px rgba(16,185,129,.55)';
    document.getElementById('loginBox').style.borderColor = 'rgba(16,185,129,.45)';
    setTimeout(() => hideLogin(), 700);
  } else {
    btn.disabled         = false;
    btn.innerHTML        = '🔓 Đăng Nhập';
    btn.style.background = '';
    btn.style.boxShadow  = '';
    authShowErr('loginErr', '🔒 Tên đăng nhập / email hoặc mật khẩu không đúng.');
    document.getElementById('loginPw').value = '';
    authShake();
  }
}

// ════════════════════════════════
//  ĐĂNG KÝ
// ════════════════════════════════
async function doRegister() {
  const email    = document.getElementById('regEmail')?.value.trim().toLowerCase();
  const username = document.getElementById('regUsername')?.value.trim();
  const pw       = document.getElementById('regPw')?.value;
  const pw2      = document.getElementById('regPw2')?.value;
  const btn      = document.getElementById('regBtn');

  if (!email || !username || !pw || !pw2) {
    authShowErr('regErr', '⚠️ Vui lòng điền đầy đủ thông tin.'); authShake(); return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    authShowErr('regErr', '⚠️ Email không hợp lệ.'); authShake(); return;
  }
  if (username.length < 3) {
    authShowErr('regErr', '⚠️ Tên đăng nhập tối thiểu 3 ký tự.'); authShake(); return;
  }
  if (pw.length < 6) {
    authShowErr('regErr', '⚠️ Mật khẩu tối thiểu 6 ký tự.'); authShake(); return;
  }
  if (pw !== pw2) {
    authShowErr('regErr', '⚠️ Mật khẩu xác nhận không khớp.'); authShake(); return;
  }

  const users = loadUsers();
  if (users.some(u => u.email === email)) {
    authShowErr('regErr', '⚠️ Email này đã được sử dụng.'); authShake(); return;
  }
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    authShowErr('regErr', '⚠️ Tên đăng nhập đã tồn tại.'); authShake(); return;
  }

  btn.disabled  = true;
  btn.innerHTML = '<span class="login-spinner"></span> Đang gửi OTP...';

  const hash = await hashPass(pw);
  _regPayload = { email, username, passwordHash: hash };

  const ok = await sendOtp(email, username, 'register');
  btn.disabled  = false;
  btn.innerHTML = '📧 Gửi Mã Xác Nhận';
}

// ════════════════════════════════
//  GỬI OTP QUA EMAILJS REST API
//  (không cần SDK — tránh bị Edge chặn)
// ════════════════════════════════
async function sendOtp(email, name, flow) {
  _otpFlow   = flow;
  _otpTarget = email;
  _otpCode   = String(Math.floor(100000 + Math.random() * 900000));
  _otpExpiry = Date.now() + 5 * 60 * 1000;

  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id:  EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id:     EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: email,
          to_name:  name || email,
          otp_code: _otpCode,
          name:     name || email,
          email:    email,
          title:    "Mã OTP - August's Web",
          message:  "Mã OTP của bạn là: " + _otpCode,
          time:     new Date().toLocaleString('vi-VN'),
        },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Status ' + res.status + ': ' + txt);
    }

    // Chuyển sang panel OTP
    const emailHint = document.getElementById('otpEmailHint');
    if (emailHint) emailHint.textContent = email;
    document.getElementById('otpInput').value = '';
    authClearErr('otpErr');
    switchPanel('otp');
    startOtpCountdown();
    setTimeout(() => document.getElementById('otpInput')?.focus(), 300);
    return true;

  } catch (err) {
    console.error('[EmailJS Error]', err);
    authShowErr(
      flow === 'register' ? 'regErr' : 'forgotErr',
      '❌ Gửi email thất bại: ' + err.message
    );
    authShake();
    return false;
  }
}

// ── Đếm ngược 5 phút ──
let _otpTimerI = null;
function startOtpCountdown() {
  if (_otpTimerI) clearInterval(_otpTimerI);
  const el = document.getElementById('otpCountdown');
  _otpTimerI = setInterval(() => {
    const left = Math.max(0, _otpExpiry - Date.now());
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    if (el) el.textContent = `${m}:${String(s).padStart(2,'0')}`;
    if (left <= 0) { clearInterval(_otpTimerI); if (el) el.textContent = '0:00'; }
  }, 1000);
}

// ── Gửi lại OTP ──
async function resendOtp() {
  const btn = document.getElementById('resendOtpBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Đang gửi...'; }
  const name = _regPayload?.username || _otpTarget;
  await sendOtp(_otpTarget, name, _otpFlow);
  if (btn) { btn.disabled = false; btn.textContent = 'Gửi lại mã'; }
}

// ════════════════════════════════
//  XÁC NHẬN OTP
// ════════════════════════════════
async function verifyOtp() {
  const code = document.getElementById('otpInput')?.value.trim();
  const btn  = document.getElementById('otpBtn');

  if (!code) { authShowErr('otpErr', '⚠️ Nhập mã OTP.'); return; }
  if (Date.now() > _otpExpiry) { authShowErr('otpErr', '⏰ Mã OTP đã hết hạn. Hãy gửi lại mã.'); return; }
  if (code !== _otpCode) {
    authShowErr('otpErr', '❌ Mã OTP không đúng.');
    authShake(); return;
  }

  btn.disabled  = true;
  btn.innerHTML = '<span class="login-spinner"></span> Xác nhận...';
  await new Promise(r => setTimeout(r, 380));
  clearInterval(_otpTimerI);

  if (_otpFlow === 'register') {
    const users = loadUsers();
    users.push({ ..._regPayload, createdAt: Date.now() });
    saveUsers(users);
    setSession(_regPayload.username);
    btn.innerHTML = '✓ Thành công!';
    setTimeout(() => hideLogin(), 700);

  } else if (_otpFlow === 'forgot') {
    btn.disabled  = false;
    btn.innerHTML = '✅ Xác Nhận';
    switchPanel('resetPw');
    setTimeout(() => document.getElementById('resetPwInput')?.focus(), 300);
  }
}

// ════════════════════════════════
//  QUÊN MẬT KHẨU
// ════════════════════════════════
async function doForgot() {
  const email = document.getElementById('forgotEmail')?.value.trim().toLowerCase();
  const btn   = document.getElementById('forgotBtn');

  if (!email) { authShowErr('forgotErr', '⚠️ Nhập email của bạn.'); authShake(); return; }

  const users = loadUsers();
  const user  = users.find(u => u.email === email);
  if (!user) { authShowErr('forgotErr', '⚠️ Email này chưa được đăng ký.'); authShake(); return; }

  _forgotEmail = email;
  btn.disabled  = true;
  btn.innerHTML = '<span class="login-spinner"></span> Đang gửi...';

  const ok = await sendOtp(email, user.username, 'forgot');
  btn.disabled  = false;
  btn.innerHTML = '📧 Gửi Mã Khôi Phục';
}

// ════════════════════════════════
//  ĐẶT LẠI MẬT KHẨU
// ════════════════════════════════
async function doResetPw() {
  const pw  = document.getElementById('resetPwInput')?.value;
  const pw2 = document.getElementById('resetPwInput2')?.value;
  const btn = document.getElementById('resetPwBtn');

  if (!pw || !pw2) { authShowErr('resetPwErr', '⚠️ Nhập đầy đủ mật khẩu.'); authShake(); return; }
  if (pw.length < 6) { authShowErr('resetPwErr', '⚠️ Mật khẩu tối thiểu 6 ký tự.'); authShake(); return; }
  if (pw !== pw2) { authShowErr('resetPwErr', '⚠️ Mật khẩu xác nhận không khớp.'); authShake(); return; }

  btn.disabled  = true;
  btn.innerHTML = '<span class="login-spinner"></span> Đang cập nhật...';
  await new Promise(r => setTimeout(r, 380));

  const users = loadUsers();
  const hash  = await hashPass(pw);
  const idx   = users.findIndex(u => u.email === _forgotEmail);
  if (idx !== -1) { users[idx].passwordHash = hash; saveUsers(users); }

  btn.innerHTML        = '✓ Đã đặt lại mật khẩu!';
  btn.style.background = 'linear-gradient(135deg,#059669,#10b981)';
  setTimeout(() => {
    btn.style.background = '';
    btn.innerHTML        = '🔑 Đặt Lại Mật Khẩu';
    btn.disabled         = false;
    switchPanel('login');
    if (typeof toast === 'function') toast('✅ Đặt lại mật khẩu thành công! Hãy đăng nhập.', 'ok');
  }, 1200);
}

// ════════════════════════════════
//  SHOW / HIDE LOGIN GATE
// ════════════════════════════════
function showLogin() {
  document.getElementById('loginGate').style.display = 'flex';
  document.querySelector('.app').style.display = 'none';
  switchPanel('login');
  setTimeout(() => document.getElementById('loginIdent')?.focus(), 400);
}

function hideLogin() {
  const gate = document.getElementById('loginGate');
  gate.style.animation = 'loginFadeOut .55s ease forwards';
  setTimeout(() => {
    gate.style.display = 'none';
    document.querySelector('.app').style.display = 'flex';
  }, 550);
}

// ════════════════════════════════
//  ENTER KEY
// ════════════════════════════════
document.addEventListener('keydown', e => {
  const gate = document.getElementById('loginGate');
  if (!gate || gate.style.display === 'none') return;
  if (e.key !== 'Enter') return;
  if (PANEL.login    && PANEL.login.style.display    !== 'none') doLogin();
  if (PANEL.register && PANEL.register.style.display !== 'none') doRegister();
  if (PANEL.otp      && PANEL.otp.style.display      !== 'none') verifyOtp();
  if (PANEL.forgot   && PANEL.forgot.style.display   !== 'none') doForgot();
  if (PANEL.resetPw  && PANEL.resetPw.style.display  !== 'none') doResetPw();
});

// ════════════════════════════════
//  KHỞI ĐỘNG
// ════════════════════════════════
(function () {
  if (!isLoggedIn()) showLogin();
})();

// ════════════════════════════════
//  ĐĂNG XUẤT
// ════════════════════════════════
function doLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  const app  = document.querySelector('.app');
  const gate = document.getElementById('loginGate');
  if (!app || !gate) return;

  // Mờ dần app
  app.style.transition = 'opacity .4s ease';
  app.style.opacity    = '0';

  setTimeout(() => {
    // Ẩn app, reset style
    app.style.display    = 'none';
    app.style.opacity    = '';
    app.style.transition = '';

    // Reset & hiện loginGate
    gate.style.animation = '';
    gate.style.display   = 'flex';
    void gate.offsetWidth; // reflow để animation chạy lại
    gate.style.animation = 'loginFadeIn .5s ease';

    // Reset về panel login
    switchPanel('login');
    setTimeout(() => document.getElementById('loginIdent')?.focus(), 400);

    if (typeof toast === 'function') toast('👋 Đã đăng xuất!', 'ok');
  }, 400);
}