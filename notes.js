// ═══════════════════════════
//  NOTES
// ═══════════════════════════

const NOTES_KEY = 'rblx_notes';
let notes = [];
let noteEditId = null;

function loadNotes() {
  try {
    const r = localStorage.getItem(NOTES_KEY);
    if (r) notes = JSON.parse(r);
  } catch { notes = []; }
}

function saveNotes() {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function noteUid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

// ── Màu nhãn ──
const NOTE_COLORS = [
  { id:'purple', label:'Tím',   bg:'rgba(124,58,237,.15)',  border:'rgba(168,85,247,.35)',  dot:'#a855f7' },
  { id:'blue',   label:'Xanh',  bg:'rgba(29,78,216,.15)',   border:'rgba(59,130,246,.35)',  dot:'#3b82f6' },
  { id:'green',  label:'Lá',    bg:'rgba(5,150,105,.15)',   border:'rgba(16,185,129,.35)',  dot:'#10b981' },
  { id:'yellow', label:'Vàng',  bg:'rgba(161,98,7,.18)',    border:'rgba(234,179,8,.35)',   dot:'#eab308' },
  { id:'red',    label:'Đỏ',    bg:'rgba(190,18,60,.15)',   border:'rgba(244,63,94,.35)',   dot:'#f43f5e' },
  { id:'cyan',   label:'Lam',   bg:'rgba(8,145,178,.15)',   border:'rgba(6,182,212,.35)',   dot:'#06b6d4' },
];

// ── Render danh sách notes ──
function renderNotes() {
  const grid    = document.getElementById('notesGrid');
  const empty   = document.getElementById('notesEmpty');
  const counter = document.getElementById('notesCount');
  if (!grid) return;

  const q      = (document.getElementById('notesSearch')?.value || '').toLowerCase();
  const filter = document.getElementById('notesFilter')?.value || 'all';

  let list = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

  if (q) list = list.filter(n =>
    n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
  );
  if (filter !== 'all') list = list.filter(n => n.color === filter);

  counter.textContent = notes.length;

  if (!list.length) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = list.map((n, i) => {
    const col   = NOTE_COLORS.find(c => c.id === n.color) || NOTE_COLORS[0];
    const date  = new Date(n.updatedAt).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });
    const time  = new Date(n.updatedAt).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
    const preview = esc(n.content).replace(/\n/g, '<br>');
    return `
    <div class="note-card" style="--nc-bg:${col.bg};--nc-border:${col.border};animation-delay:${i*0.04}s" onclick="openEditNote('${n.id}')">
      <div class="note-card-header">
        <span class="note-dot" style="background:${col.dot}"></span>
        <span class="note-title">${esc(n.title) || '<em style="opacity:.4">Không tiêu đề</em>'}</span>
        <button class="note-del-btn" onclick="event.stopPropagation();confirmDelNote('${n.id}')" title="Xóa">✕</button>
      </div>
      <div class="note-content-prev">${preview || '<span style="opacity:.35;font-style:italic">Trống...</span>'}</div>
      <div class="note-footer">
        <span class="note-date">${date} ${time}</span>
        <span class="note-chars">${n.content.length} ký tự</span>
      </div>
    </div>`;
  }).join('');
}

// ── Mở modal thêm ──
function openAddNote() {
  noteEditId = null;
  document.getElementById('noteModTitle').textContent = '📝 Ghi Chú Mới';
  document.getElementById('noteTitle').value   = '';
  document.getElementById('noteContent').value = '';
  setNoteColor('purple');
  document.getElementById('ovNote').classList.add('open');
  setTimeout(() => document.getElementById('noteTitle').focus(), 200);
}

// ── Mở modal sửa ──
function openEditNote(id) {
  const n = notes.find(x => x.id === id);
  if (!n) return;
  noteEditId = id;
  document.getElementById('noteModTitle').textContent = '✏️ Chỉnh Sửa Ghi Chú';
  document.getElementById('noteTitle').value   = n.title;
  document.getElementById('noteContent').value = n.content;
  setNoteColor(n.color || 'purple');
  document.getElementById('ovNote').classList.add('open');
  setTimeout(() => document.getElementById('noteContent').focus(), 200);
}

// ── Lưu ──
function saveNote() {
  const title   = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value;
  const color   = document.querySelector('.note-color-dot.active')?.dataset.color || 'purple';

  if (!title && !content) { toast('⚠️ Nhập tiêu đề hoặc nội dung!', 'err'); return; }

  const now = Date.now();
  if (noteEditId) {
    const idx = notes.findIndex(n => n.id === noteEditId);
    if (idx !== -1) {
      notes[idx] = { ...notes[idx], title, content, color, updatedAt: now };
      toast('✅ Đã cập nhật ghi chú!', 'ok');
    }
  } else {
    notes.unshift({ id: noteUid(), title, content, color, createdAt: now, updatedAt: now });
    toast('✅ Đã thêm ghi chú!', 'ok');
  }

  saveNotes();
  renderNotes();
  closeOv('ovNote');
}

// ── Xóa ──
let _delNoteId = null;
function confirmDelNote(id) {
  _delNoteId = id;
  const n = notes.find(x => x.id === id);
  document.getElementById('delNoteName').textContent = n?.title || 'ghi chú này';
  document.getElementById('ovDelNote').classList.add('open');
}
function doDelNote() {
  notes = notes.filter(n => n.id !== _delNoteId);
  saveNotes();
  renderNotes();
  closeOv('ovDelNote');
  toast('🗑️ Đã xóa ghi chú!', 'ok');
}

// ── Màu ──
function setNoteColor(colorId) {
  document.querySelectorAll('.note-color-dot').forEach(d => {
    d.classList.toggle('active', d.dataset.color === colorId);
  });
}

document.addEventListener('click', e => {
  const dot = e.target.closest('.note-color-dot');
  if (dot) setNoteColor(dot.dataset.color);
});

// ── Phím tắt Ctrl+S trong modal ──
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    if (document.getElementById('ovNote').classList.contains('open')) {
      e.preventDefault();
      saveNote();
    }
  }
});

// ── Init ──
loadNotes();
