// ═══════════════════════════
//  GAMES HUB
// ═══════════════════════════

// map game id → nav index (sidebar nav-items)
// Sidebar order: 0=Tài Khoản, 1=Thống Kê, 2=Robux, (sep), 3=Game, 4=Thông Báo, 5=Ghi Chú, 6=Cài Đặt
// We use gotoView with the matching nav-item
function getGameNavEl() {
  return document.querySelector('.nav-item[onclick*="games"]');
}

function launchGame(name) {
  const navEls = document.querySelectorAll('.nav-item');
  // find the game nav item
  let gameNav = null;
  navEls.forEach(el => { if (el.getAttribute('onclick')?.includes('games')) gameNav = el; });

  // deactivate all views & nav
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const view = document.getElementById('view-' + name);
  if (view) view.classList.add('active');
  if (gameNav) gameNav.classList.add('active');

  // init game if needed
  if (name === 'mine')   mineInit();
  if (name === 'memory') memInit();
  if (name === 'tetris') tetInit();
  if (name === 'snake')  { snakeInit(); snakeDraw(); updateSnakeUI(); }
}

function updateHubScores() {
  // snake
  const sb = document.getElementById('hubSnakeBest');
  if (sb) sb.textContent = localStorage.getItem('rblx_snake_best') || '0';
  // mine
  const me = document.getElementById('hubMineBest');
  const mb = localStorage.getItem('rblx_mine_best_easy');
  if (me) me.textContent = mb ? mb + 's' : '--';
  // memory
  const mm = document.getElementById('hubMemoryBest');
  const memb = localStorage.getItem('rblx_memory_best');
  if (mm) mm.textContent = memb ? memb + ' lượt' : '--';
  // tetris
  const tb = document.getElementById('hubTetrisBest');
  if (tb) tb.textContent = localStorage.getItem('rblx_tetris_best') || '0';
}

// Hook into gotoView for games
const _origGotoViewGames = window.gotoView;
window.gotoView = function(name, el) {
  _origGotoViewGames(name, el);
  if (name === 'games') updateHubScores();
};

// Init hub scores on load
document.addEventListener('DOMContentLoaded', updateHubScores);
setTimeout(updateHubScores, 300);
