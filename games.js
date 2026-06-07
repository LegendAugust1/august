// ═══════════════════════════
//  GAMES HUB (cập nhật — thêm Chess)
// ═══════════════════════════

function launchGame(name) {
  const navEls = document.querySelectorAll('.nav-item');
  let gameNav = null;
  navEls.forEach(el => { if (el.getAttribute('onclick')?.includes('games')) gameNav = el; });

  // Chess mở trang riêng
  if (name === 'chess') {
    window.open('chess.html', '_blank');
    return;
  }

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const view = document.getElementById('view-' + name);
  if (view) view.classList.add('active');
  if (gameNav) gameNav.classList.add('active');

  if (name === 'mine')   mineInit();
  if (name === 'memory') memInit();
  if (name === 'tetris') tetInit();
  if (name === 'snake')  { snakeInit(); snakeDraw(); updateSnakeUI(); }
}

function updateHubScores() {
  const sb = document.getElementById('hubSnakeBest');
  if (sb) sb.textContent = localStorage.getItem('rblx_snake_best') || '0';
  const me = document.getElementById('hubMineBest');
  const mb = localStorage.getItem('rblx_mine_best_easy');
  if (me) me.textContent = mb ? mb + 's' : '--';
  const mm = document.getElementById('hubMemoryBest');
  const memb = localStorage.getItem('rblx_memory_best');
  if (mm) mm.textContent = memb ? memb + ' lượt' : '--';
  const tb = document.getElementById('hubTetrisBest');
  if (tb) tb.textContent = localStorage.getItem('rblx_tetris_best') || '0';
}

const _origGotoViewGames = window.gotoView;
window.gotoView = function(name, el) {
  _origGotoViewGames(name, el);
  if (name === 'games') updateHubScores();
};

document.addEventListener('DOMContentLoaded', updateHubScores);
setTimeout(updateHubScores, 300);