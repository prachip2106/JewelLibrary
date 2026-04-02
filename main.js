const API_BASE = 'http://localhost:8000';
const LIMIT = 15;

let currentPage = 1;
let currentSearch = '';
let currentCat = '';       // exact folder name, sent as ?category=
let totalPages = 1;
let searchTimer = null;
let isListView = false;

// ── DOM REFS ──
const gallery      = document.getElementById('gallery');
const pagination   = document.getElementById('pagination');
const statsCount   = document.getElementById('statsCount');
const searchInput  = document.getElementById('searchInput');
const clearBtn     = document.getElementById('clearBtn');
const catsWrap     = document.getElementById('catsWrap');
const lightbox     = document.getElementById('lightbox');
const lightboxImg  = document.getElementById('lightboxImg');
const lightboxName = document.getElementById('lightboxName');
const lightboxType = document.getElementById('lightboxType');
const lightboxClose= document.getElementById('lightboxClose');
const gridViewBtn  = document.getElementById('gridViewBtn');
const listViewBtn  = document.getElementById('listViewBtn');
const loader       = document.getElementById('loader');
const toast        = document.getElementById('toast');

// ── INIT ──
async function init() {
  await loadCategories();
  await fetchJewelry();
  setTimeout(() => loader.classList.add('hidden'), 400);
}

// ── CATEGORIES ──
async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/api/categories`);
    const data = await res.json();
    data.categories.sort().forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'cat-pill';
      btn.dataset.cat = cat;
      btn.textContent = cat.replace(/_/g, ' ');
      btn.addEventListener('click', () => selectCat(cat, btn));
      catsWrap.appendChild(btn);
    });
  } catch (e) {
    showToast('Could not load categories');
  }
}

function selectCat(cat, btn) {
  currentCat = cat;          // exact folder name
  currentSearch = '';
  currentPage = 1;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  searchInput.value = '';
  clearBtn.classList.remove('visible');
  fetchJewelry();
}

// ── FETCH ──
// Uses ?category= for pill selection (exact match on backend)
// Uses ?search=  for typed text (filename search on backend)
async function fetchJewelry() {
  renderSkeletons();

  const params = new URLSearchParams({
    page: currentPage,
    limit: LIMIT,
  });
  if (currentCat)    params.set('category', currentCat);
  if (currentSearch) params.set('search', currentSearch);

  const url = `${API_BASE}/api/jewelry?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    totalPages = data.totalPages || 1;
    renderGallery(data.data || []);
    renderStats(data.total || 0, data.page || 1, totalPages);
    renderPagination(totalPages, currentPage);
  } catch (e) {
    gallery.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">&#9888;</div>
        <h3>Connection Error</h3>
        <p>Cannot reach the backend. Please ensure the server is running on port 8000.</p>
      </div>`;
    statsCount.textContent = 'Server unavailable';
    pagination.innerHTML = '';
  }
}

// ── SKELETONS ──
function renderSkeletons() {
  gallery.innerHTML = '';
  for (let i = 0; i < 15; i++) {
    const sk = document.createElement('div');
    sk.className = 'skeleton';
    gallery.appendChild(sk);
  }
}

// ── GALLERY ──
function renderGallery(items) {
  gallery.innerHTML = '';
  if (!items.length) {
    gallery.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">&#9674;</div>
        <h3>No Pieces Found</h3>
        <p>Try a different search term or category.</p>
      </div>`;
    return;
  }

  const fallbackSVG = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect fill='%231a1710' width='400' height='400'/><text fill='%237a7265' font-size='40' x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'>?</text></svg>`;

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    const namePretty = item.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    const typePretty = item.type.replace(/[-_]/g, ' ');

    const img = document.createElement('img');
    img.src = `${API_BASE}${item.image_url}`;
    img.alt = namePretty;
    img.loading = 'lazy';
    img.onerror = () => { img.src = fallbackSVG; };

    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    overlay.innerHTML = `
      <div class="card-name">${namePretty}</div>
      <div class="card-type">${typePretty}</div>`;

    const corner = document.createElement('div');
    corner.className = 'card-corner';

    card.appendChild(img);
    card.appendChild(overlay);
    card.appendChild(corner);
    card.addEventListener('click', () => openLightbox(item, namePretty, typePretty));
    gallery.appendChild(card);
  });
}

// ── STATS ──
function renderStats(total, page, pages) {
  const start = (page - 1) * LIMIT + 1;
  const end   = Math.min(page * LIMIT, total);
  statsCount.innerHTML = total
    ? `Showing <strong>${start}&ndash;${end}</strong> of <strong>${total}</strong> pieces`
    : 'No pieces found';
}

// ── PAGINATION ──
function renderPagination(total, current) {
  pagination.innerHTML = '';
  if (total <= 1) return;

  const addBtn = (label, page, cls = '') => {
    const btn = document.createElement('button');
    btn.className = `page-btn ${cls}`;
    btn.innerHTML = label;
    if (page === null || cls === 'active') {
      btn.disabled = true;
    } else {
      btn.addEventListener('click', () => {
        currentPage = page;
        fetchJewelry();
        scrollToGallery();
      });
    }
    pagination.appendChild(btn);
  };

  const addEllipsis = () => {
    const sp = document.createElement('span');
    sp.className = 'page-ellipsis';
    sp.textContent = '...';
    pagination.appendChild(sp);
  };

  addBtn('&larr;', current > 1 ? current - 1 : null, 'arrow');

  const pages = [1];
  if (current > 3) pages.push('ellipsis');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('ellipsis');
  if (total > 1) pages.push(total);

  pages.forEach(p => {
    if (p === 'ellipsis') addEllipsis();
    else addBtn(p, p, p === current ? 'active' : '');
  });

  addBtn('&rarr;', current < total ? current + 1 : null, 'arrow');
}

function scrollToGallery() {
  document.querySelector('.gallery-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── LIGHTBOX ──
function openLightbox(item, name, type) {
  lightboxImg.src = `${API_BASE}${item.image_url}`;
  lightboxName.textContent = name;
  lightboxType.textContent = type;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// ── SEARCH ──
searchInput.addEventListener('input', () => {
  const val = searchInput.value.trim();
  clearBtn.classList.toggle('visible', val.length > 0);
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentSearch = val;
    currentCat = '';          // clear category when typing
    currentPage = 1;
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    document.querySelector('.cat-pill[data-cat=""]').classList.add('active');
    fetchJewelry();
  }, 380);
});

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  currentSearch = '';
  clearBtn.classList.remove('visible');
  currentPage = 1;
  fetchJewelry();
  searchInput.focus();
});

// ── VIEW TOGGLE ──
gridViewBtn.addEventListener('click', () => {
  isListView = false;
  gallery.classList.remove('list-view');
  gridViewBtn.classList.add('active');
  listViewBtn.classList.remove('active');
});

listViewBtn.addEventListener('click', () => {
  isListView = true;
  gallery.classList.add('list-view');
  listViewBtn.classList.add('active');
  gridViewBtn.classList.remove('active');
});

// ── TOAST ──
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── RUN ──
init();