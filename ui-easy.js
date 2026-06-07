// ═══════════════════════════════════════════════════════════
//  UI NÂNG CẤP DỄ — ui-easy.js
//  Thêm <script src="ui-easy.js"> vào cuối <body>,
//  SAU tất cả script khác (kể cả mobile.js)
// ═══════════════════════════════════════════════════════════

(function () {

  // ══════════════════════════════════════════
  //  1. VIEW TRANSITIONS MƯỢT HƠN
  //     Patch gotoView để thêm fade/slide animation
  // ══════════════════════════════════════════

  const _origGotoViewEasy = window.gotoView;

  window.gotoView = function (name, el) {
    // Tìm view hiện tại đang active
    const currentView = document.querySelector('.view.active');

    if (currentView) {
      // Fade out view cũ
      currentView.classList.add('view-exit-active');
      setTimeout(() => {
        currentView.classList.remove('view-exit-active');
        // Gọi gotoView gốc để chuyển view
        _origGotoViewEasy(name, el);

        // Fade in view mới
        const newView = document.querySelector('.view.active');
        if (newView) {
          newView.classList.add('view-enter', 'view-enter-active');
          // Cleanup sau animation
          setTimeout(() => {
            newView.classList.remove('view-enter', 'view-enter-active');
          }, 350);
        }
      }, 160);
    } else {
      _origGotoViewEasy(name, el);
    }
  };

  // Cũng patch mobile gotoView nếu có
  const _origMobileGotoEasy = window.mobileGoto;
  if (_origMobileGotoEasy) {
    window.mobileGoto = function (viewName, el) {
      const currentView = document.querySelector('.view.active');
      if (currentView) {
        currentView.classList.add('view-exit-active');
        setTimeout(() => {
          currentView.classList.remove('view-exit-active');
          _origMobileGotoEasy(viewName, el);
          const newView = document.querySelector('.view.active');
          if (newView) {
            newView.classList.add('view-enter', 'view-enter-active');
            setTimeout(() => newView.classList.remove('view-enter', 'view-enter-active'), 350);
          }
          // sync bottom nav
          document.querySelectorAll('.mobile-nav-item').forEach(i => i.classList.remove('active'));
          if (el) el.classList.add('active');
        }, 160);
      } else {
        _origMobileGotoEasy(viewName, el);
      }
    };
  }


  // ══════════════════════════════════════════
  //  2. HIGHLIGHT TỪ KHÓA TRONG CARD
  //     Tự động highlight khi gõ vào ô tìm kiếm
  // ══════════════════════════════════════════

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightText(el, query) {
    if (!el || !query) return;
    // Chỉ highlight text nodes trực tiếp, không đụng vào HTML tags
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        // Bỏ qua text trong button và script
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (['button', 'script', 'style'].includes(tag)) return NodeFilter.FILTER_REJECT;
        if (parent.classList.contains('hl')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);

    const re = new RegExp(`(${escapeRegex(query)})`, 'gi');
    nodes.forEach(node => {
      if (!re.test(node.textContent)) return;
      re.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let last = 0;
      node.textContent.replace(re, (match, p1, offset) => {
        if (offset > last) frag.appendChild(document.createTextNode(node.textContent.slice(last, offset)));
        const span = document.createElement('span');
        span.className = 'hl';
        span.textContent = match;
        frag.appendChild(span);
        last = offset + match.length;
      });
      if (last < node.textContent.length) frag.appendChild(document.createTextNode(node.textContent.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function applyHighlight(query) {
    // Highlight tất cả acc-card và note-card
    document.querySelectorAll('.acc-card, .note-card').forEach(card => {
      highlightText(card, query);
    });
  }

  // Thêm nút clear + đếm kết quả vào search box
  function enhanceSearchBox() {
    const searchBox = document.querySelector('.search-box');
    if (!searchBox || searchBox.dataset.enhanced) return;
    searchBox.dataset.enhanced = '1';

    const input = searchBox.querySelector('input');
    if (!input) return;

    // Thêm nút clear
    const clearBtn = document.createElement('button');
    clearBtn.className = 'search-clear';
    clearBtn.innerHTML = '✕';
    clearBtn.title = 'Xóa tìm kiếm';
    searchBox.appendChild(clearBtn);

    // Thêm đếm kết quả
    const countSpan = document.createElement('span');
    countSpan.className = 'search-count';
    searchBox.appendChild(countSpan);

    clearBtn.addEventListener('click', () => {
      input.value = '';
      input.dispatchEvent(new Event('input'));
      input.focus();
    });

    input.addEventListener('input', () => {
      const q = input.value.trim();
      clearBtn.classList.toggle('show', q.length > 0);
      searchBox.classList.remove('no-result');

      // Highlight sau khi renderCards xong (dùng setTimeout để chờ DOM update)
      setTimeout(() => {
        if (q.length >= 1) {
          applyHighlight(q);
          const count = document.querySelectorAll('.acc-card, .note-card').length;
          countSpan.textContent = count > 0 ? `${count} kết quả` : '';
          if (count === 0) {
            searchBox.classList.add('no-result');
            setTimeout(() => searchBox.classList.remove('no-result'), 400);
          }
        } else {
          countSpan.textContent = '';
        }
      }, 50);
    });
  }

  // Patch renderCards để highlight lại sau mỗi lần render
  const _origRenderCards = window.renderCards;
  if (_origRenderCards) {
    window.renderCards = function () {
      _origRenderCards();
      const input = document.querySelector('.search-box input');
      const q = input?.value?.trim() || '';
      if (q.length >= 1) {
        setTimeout(() => applyHighlight(q), 30);
      }
    };
  }

  // Patch renderNotes tương tự
  const _origRenderNotes = window.renderNotes;
  if (_origRenderNotes) {
    window.renderNotes = function () {
      _origRenderNotes();
      const input = document.querySelector('#view-notes .search-box input, #notesSearch');
      const q = input?.value?.trim() || '';
      if (q.length >= 1) setTimeout(() => applyHighlight(q), 30);
    };
  }


  // ══════════════════════════════════════════
  //  3. SHIMMER CARD — không cần JS thêm
  //     Đã xử lý hoàn toàn bằng CSS
  //     JS chỉ thêm class để bật/tắt nếu cần
  // ══════════════════════════════════════════

  // Tùy chọn: bật shimmer ngay khi card được thêm mới
  // (renderCards đã có animation-delay, phần này bổ sung thêm)

  function markNewCards() {
    document.querySelectorAll('.acc-card:not([data-shimmer])').forEach((card, i) => {
      card.dataset.shimmer = '1';
      // flash nhẹ border khi mới render
      card.style.transition = 'border-color .4s ease';
      card.style.borderColor = 'rgba(168,85,247,0.4)';
      setTimeout(() => { card.style.borderColor = ''; }, 600 + i * 80);
    });
  }

  // Patch renderCards thêm lần nữa để gọi markNewCards
  const _origRenderCards2 = window.renderCards;
  if (_origRenderCards2) {
    window.renderCards = function () {
      _origRenderCards2();
      setTimeout(markNewCards, 50);
    };
  }


  // ══════════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════════

  function init() {
    enhanceSearchBox();
    // Thêm class view-enter-active cho view đầu tiên khi load
    const firstActive = document.querySelector('.view.active');
    if (firstActive) {
      firstActive.classList.add('view-enter-active');
      setTimeout(() => firstActive.classList.remove('view-enter-active'), 400);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 120);
  }

})();
