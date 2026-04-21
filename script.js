// ══════════════════════════════════════════════════════
//  WILTED — script.js
// ══════════════════════════════════════════════════════

// ── Auto-moderation word list ─────────────────────────
const BLOCKED_WORDS = [
  'fuck','shit','bitch','asshole','bastard','cunt','dick','pussy','cock',
  'nigger','nigga','faggot','retard','whore','slut','motherfucker','bullshit',
  'damn','piss','ass','crap','twat','wanker','prick','idiot','moron','stupid',
  'kill yourself','kys','die'
];

function containsBlockedWord(text) {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some(w => {
    const re = new RegExp(`\\b${w.replace(/\s+/g,'\\s+')}\\b`,'i');
    return re.test(lower);
  });
}

// ── Utility ───────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeAgo(ts) {
  const d = Date.now() - ts;
  const m = Math.floor(d/60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h}h ago`;
  const dy = Math.floor(h/24);
  if (dy < 7) return `${dy}d ago`;
  return new Date(ts).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
}

// ── Storage ───────────────────────────────────────────
function getThreads() {
  try { return JSON.parse(localStorage.getItem('wilted_threads')||'[]'); }
  catch { return []; }
}
function saveThreads(t) { localStorage.setItem('wilted_threads',JSON.stringify(t)); }

// ══════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════
const navLinks = document.querySelectorAll('.nav-link');
const views    = document.querySelectorAll('.view');

function showView(id) {
  views.forEach(v => v.classList.remove('active'));
  navLinks.forEach(l => l.classList.remove('active'));
  const target = document.getElementById('view-'+id);
  if (target) target.classList.add('active');
  const link = document.querySelector(`[data-view="${id}"]`);
  if (link) link.classList.add('active');
  if (id==='home')     renderHomeThreads();
  if (id==='questions')renderQuestionsThreads();
  if (id==='library')  renderLibrary();
  if (id==='social')   renderStats();
}

navLinks.forEach(l => l.addEventListener('click', e => { e.preventDefault(); showView(l.dataset.view); }));

// ══════════════════════════════════════════════════════
//  THREAD MODAL
// ══════════════════════════════════════════════════════
const threadModal   = document.getElementById('thread-modal');
const modalOverlay  = document.getElementById('modal-overlay');
const modalClose    = document.getElementById('modal-close');
const threadModalInner = document.getElementById('thread-modal-inner');

function openModal(thread) {
  const allTags = [...(thread.tags||[]), ...(thread.grades||[])];
  const tagsHTML = allTags.map(t => {
    const isGrade = t.startsWith('Grade');
    return `<span class="tag ${isGrade?'grade-tag':''}">${escHtml(t)}</span>`;
  }).join('');
  const attachHTML = thread.fileName
    ? `<div class="modal-attachment">⊕ ${escHtml(thread.fileName)}</div>`
    : '';

  threadModalInner.innerHTML = `
    <div class="post-meta">${escHtml(thread.author||'Anonymous')} · ${timeAgo(thread.ts)}</div>
    <div class="modal-title">${escHtml(thread.title)}</div>
    <div class="post-divider"></div>
    <div class="modal-body">${escHtml(thread.body)}</div>
    <div class="post-divider"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
      <div class="post-tags">${tagsHTML}</div>
      ${attachHTML}
    </div>
  `;
  threadModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  threadModal.style.display = 'none';
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key==='Escape') closeModal(); });

// ══════════════════════════════════════════════════════
//  THREAD RENDERING
// ══════════════════════════════════════════════════════
function buildThreadRow(thread) {
  const row = document.createElement('div');
  row.className = 'thread-row';

  const subjectTags = (thread.tags||[]).map(t => `<span class="thread-tag">${escHtml(t)}</span>`).join('');
  const gradeTags   = (thread.grades||[]).map(g => `<span class="thread-tag grade">${escHtml(g)}</span>`).join('');
  const attachHTML  = thread.fileName ? `<div class="thread-attachment">⊕ ${escHtml(thread.fileName)}</div>` : '';

  row.innerHTML = `
    <div>
      <div class="thread-title">${escHtml(thread.title)}</div>
      <div class="post-meta" style="margin-top:4px">${escHtml(thread.author||'Anonymous')}</div>
      <div class="thread-tags">${subjectTags}${gradeTags}</div>
      ${attachHTML}
    </div>
    <div class="thread-info">${timeAgo(thread.ts)}<br>${(thread.tags||[])[0]||'General'}</div>
  `;
  row.addEventListener('click', () => openModal(thread));
  return row;
}

function buildLibraryCard(thread) {
  const card = document.createElement('div');
  card.className = 'library-card';

  const subjectTags = (thread.tags||[]).map(t=>`<span class="thread-tag">${escHtml(t)}</span>`).join('');
  const gradeTags   = (thread.grades||[]).map(g=>`<span class="thread-tag grade">${escHtml(g)}</span>`).join('');
  const attachHTML  = thread.fileName ? `<div class="thread-attachment">⊕ ${escHtml(thread.fileName)}</div>` : '';

  card.innerHTML = `
    <div class="library-card-title">${escHtml(thread.title)}</div>
    <div class="library-card-body">${escHtml(thread.body)}</div>
    <div class="library-card-footer">
      <div class="post-tags" style="margin-bottom:4px">${subjectTags}${gradeTags}</div>
      ${attachHTML}
      <div class="library-card-meta">${escHtml(thread.author||'Anonymous')} · ${timeAgo(thread.ts)}</div>
    </div>
  `;
  card.addEventListener('click', () => openModal(thread));
  return card;
}

function renderHomeThreads() {
  const list = document.getElementById('home-thread-list');
  list.innerHTML = '';
  const threads = getThreads().slice().reverse().slice(0,8);
  if (!threads.length) { list.innerHTML = '<div class="empty-state">No threads yet. Be the first to post.</div>'; return; }
  threads.forEach(t => list.appendChild(buildThreadRow(t)));
}

function renderQuestionsThreads() {
  const list  = document.getElementById('questions-thread-list');
  const empty = document.getElementById('questions-empty');
  list.innerHTML = '';
  const threads = getThreads().slice().reverse();
  if (!threads.length) { empty.style.display='block'; return; }
  empty.style.display = 'none';
  threads.forEach(t => list.appendChild(buildThreadRow(t)));
}

// ── Library search + filter ───────────────────────────
let librarySearch = '';
let libraryFilter = 'all';

function renderLibrary() {
  const grid  = document.getElementById('library-grid');
  const empty = document.getElementById('library-empty');
  grid.innerHTML = '';
  let threads = getThreads().slice().reverse();

  if (libraryFilter !== 'all') {
    threads = threads.filter(t =>
      (t.tags||[]).includes(libraryFilter) || (t.grades||[]).includes(libraryFilter)
    );
  }
  if (librarySearch.trim()) {
    const q = librarySearch.toLowerCase();
    threads = threads.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.body||'').toLowerCase().includes(q) ||
      (t.author||'').toLowerCase().includes(q) ||
      (t.tags||[]).some(tag => tag.toLowerCase().includes(q)) ||
      (t.grades||[]).some(g => g.toLowerCase().includes(q))
    );
  }
  if (!threads.length) { empty.style.display='block'; return; }
  empty.style.display = 'none';
  threads.forEach(t => grid.appendChild(buildLibraryCard(t)));
}

document.getElementById('library-search').addEventListener('input', function() {
  librarySearch = this.value; renderLibrary();
});
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    libraryFilter = btn.dataset.filter;
    renderLibrary();
  });
});

// ── Stats ─────────────────────────────────────────────
function renderStats() {
  const threads = getThreads();
  const tags = {};
  threads.forEach(t=>(t.tags||[]).forEach(tag=>{ tags[tag]=(tags[tag]||0)+1; }));
  const topTag = Object.entries(tags).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('more-stats').innerHTML = `
    <div class="stat-item"><div class="stat-num">${threads.length}</div><div class="stat-label">Threads Posted</div></div>
    <div class="stat-item"><div class="stat-num">${Object.keys(tags).length}</div><div class="stat-label">Subjects Covered</div></div>
    ${topTag?`<div class="stat-item"><div class="stat-num" style="font-size:1rem;padding-top:.6rem">${topTag[0]}</div><div class="stat-label">Top Subject</div></div>`:''}
  `;
}

// ══════════════════════════════════════════════════════
//  UPLOAD
// ══════════════════════════════════════════════════════
let selectedTags   = [];
let selectedGrades = [];
let selectedFile   = null;

document.querySelectorAll('.tag-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tag = btn.dataset.tag;
    if (selectedTags.includes(tag)) { selectedTags=selectedTags.filter(t=>t!==tag); btn.classList.remove('selected'); }
    else { selectedTags.push(tag); btn.classList.add('selected'); }
  });
});

document.querySelectorAll('.grade-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Only one grade at a time
    document.querySelectorAll('.grade-btn').forEach(b=>b.classList.remove('selected'));
    const grade = btn.dataset.grade;
    if (selectedGrades[0]===grade) { selectedGrades=[]; }
    else { selectedGrades=[grade]; btn.classList.add('selected'); }
  });
});

// File drop
const fileDrop      = document.getElementById('file-drop');
const fileInput     = document.getElementById('file-input');
const filePreview   = document.getElementById('file-preview');
const fileDropInner = document.getElementById('file-drop-inner');

fileDrop.addEventListener('click', () => fileInput.click());
fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.style.borderColor='rgba(200,191,207,.6)'; });
fileDrop.addEventListener('dragleave', () => { fileDrop.style.borderColor=''; });
fileDrop.addEventListener('drop', e => { e.preventDefault(); fileDrop.style.borderColor=''; handleFile(e.dataTransfer.files[0]); });
fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

function handleFile(file) {
  if (!file) return;
  selectedFile = file;
  fileDropInner.style.display = 'none';
  filePreview.style.display   = 'block';
  filePreview.textContent     = `⊕  ${file.name}  (${(file.size/1024).toFixed(1)} KB) — click to change`;
}

document.getElementById('upload-submit').addEventListener('click', () => {
  const title  = document.getElementById('upload-title').value.trim();
  const body   = document.getElementById('upload-body').value.trim();
  const author = document.getElementById('upload-author').value.trim();

  if (!title) { showFeedback('Please enter a title.', false); return; }
  if (!body)  { showFeedback('Please enter a body.', false); return; }

  // ── Auto-moderation ──
  if (containsBlockedWord(title) || containsBlockedWord(body) || containsBlockedWord(author)) {
    showFeedback('Your post contains language that is not permitted. Please revise and resubmit.', false);
    return;
  }

  const thread = {
    id: Date.now(), ts: Date.now(),
    title, body,
    author:   author || 'Anonymous',
    tags:     [...selectedTags],
    grades:   [...selectedGrades],
    fileName: selectedFile ? selectedFile.name : null,
  };
  const threads = getThreads();
  threads.push(thread);
  saveThreads(threads);
  showFeedback('Thread posted successfully.', true);
  clearUploadForm();
  setTimeout(() => showView('home'), 1200);
});

document.getElementById('upload-clear').addEventListener('click', clearUploadForm);

function clearUploadForm() {
  document.getElementById('upload-title').value  = '';
  document.getElementById('upload-body').value   = '';
  document.getElementById('upload-author').value = '';
  selectedTags = []; selectedGrades = []; selectedFile = null;
  document.querySelectorAll('.tag-btn,.grade-btn').forEach(b=>b.classList.remove('selected'));
  filePreview.style.display   = 'none';
  fileDropInner.style.display = 'block';
  fileInput.value = '';
}

function showFeedback(msg, ok) {
  const fb = document.getElementById('upload-feedback');
  fb.textContent = msg;
  fb.className   = 'upload-feedback '+(ok?'success':'error');
  fb.style.display = 'block';
  setTimeout(() => { fb.style.display='none'; }, 3500);
}

// ══════════════════════════════════════════════════════
//  TILT CARD
// ══════════════════════════════════════════════════════
const card    = document.getElementById('tilt-card');
const shimmer = document.getElementById('shimmer');
const MAX_TILT = 14;
document.addEventListener('mousemove', e => {
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const dx = (e.clientX-(rect.left+rect.width/2))/(window.innerWidth/2);
  const dy = (e.clientY-(rect.top+rect.height/2))/(window.innerHeight/2);
  card.style.transform = `rotateX(${-dy*MAX_TILT}deg) rotateY(${dx*MAX_TILT}deg) translateZ(10px)`;
  card.style.boxShadow = `${-dx*MAX_TILT*1.5}px ${dy*MAX_TILT*1.5}px 40px rgba(0,0,0,.8),0 0 60px rgba(139,26,26,.08)`;
  const px = ((e.clientX-rect.left)/rect.width*100).toFixed(1);
  const py = ((e.clientY-rect.top)/rect.height*100).toFixed(1);
  if (shimmer) shimmer.style.background=`radial-gradient(ellipse 50% 45% at ${px}% ${py}%,rgba(200,191,207,.09) 0%,transparent 70%)`;
});
card && card.addEventListener('mouseleave', () => {
  card.style.transform='rotateX(0) rotateY(0) translateZ(0)';
  card.style.boxShadow='0 0 60px rgba(0,0,0,.6)';
});

// ══════════════════════════════════════════════════════
//  CURSOR
// ══════════════════════════════════════════════════════
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');
document.addEventListener('mousemove', e => {
  cursor.style.left     = e.clientX+'px'; cursor.style.top     = e.clientY+'px';
  cursorRing.style.left = e.clientX+'px'; cursorRing.style.top = e.clientY+'px';
});



// ══════════════════════════════════════════════════════
//  PARTICLES
// ══════════════════════════════════════════════════════
const pContainer = document.getElementById('particles');
for (let i=0; i<28; i++) {
  const p=document.createElement('div'); p.className='particle';
  const big=Math.random()>.7?2:1;
  p.style.cssText=`left:${Math.random()*100}%;bottom:-10px;animation-duration:${15+Math.random()*20}s;animation-delay:-${Math.random()*20}s;--dx:${(Math.random()-.5)*80}px;width:${big}px;height:${big}px;opacity:${.3+Math.random()*.5};`;
  pContainer.appendChild(p);
}

// ══════════════════════════════════════════════════════
//  DRIPS
// ══════════════════════════════════════════════════════
const dripContainer = document.getElementById('drips');
for (let i=0; i<12; i++) {
  const d=document.createElement('div'); d.className='drip';
  d.style.cssText=`left:${Math.random()*100}%;height:${60+Math.random()*200}px;animation-duration:${6+Math.random()*10}s;animation-delay:-${Math.random()*8}s;opacity:${.1+Math.random()*.2};`;
  dripContainer.appendChild(d);
}

// ══════════════════════════════════════════════════════
//  CORNER MIRRORS
// ══════════════════════════════════════════════════════
const tlHTML = document.querySelector('.corner-tl').innerHTML;
['.corner-tr','.corner-bl','.corner-br'].forEach(s=>{ document.querySelector(s).innerHTML=tlHTML; });

// ══════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════
renderHomeThreads();