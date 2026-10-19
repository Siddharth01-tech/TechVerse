const CATEGORIES = [
  'JavaScript & Programming',
  'Web Development',
  'Artificial Intelligence',
  'Cybersecurity',
  'Data Science',
  'Cloud & DevOps'
];

const getUser = () => JSON.parse(localStorage.getItem('tv_user') || localStorage.getItem('tkg_user') || 'null');
const getToken = () => localStorage.getItem('tv_token') || localStorage.getItem('tkg_token');
const qs = k => new URLSearchParams(location.search).get(k);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = d => new Date(String(d).replace(' ', 'T') + 'Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'TV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}

function showMsg(el, text, type = 'err') {
  if (!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}

// Global Toast Notification System
function showToast(text, type = 'ok', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-dot"></span><span class="toast-text">${esc(text)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Global Custom Confirmation Modal
function confirmModal({ title = 'Confirm Action', message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    const existing = document.getElementById('custom-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'custom-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card">
        <h3 class="modal-title">${esc(title)}</h3>
        <p class="modal-desc">${esc(message)}</p>
        <div class="modal-actions">
          <button type="button" class="btn line sm" id="modal-cancel">${esc(cancelText)}</button>
          <button type="button" class="btn sm ${danger ? 'danger' : ''}" id="modal-confirm">${esc(confirmText)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cleanup = (val) => {
      overlay.classList.add('closing');
      setTimeout(() => overlay.remove(), 200);
      resolve(val);
    };

    overlay.querySelector('#modal-cancel').onclick = () => cleanup(false);
    overlay.querySelector('#modal-confirm').onclick = () => cleanup(true);
    overlay.onclick = (e) => {
      if (e.target === overlay) cleanup(false);
    };
  });
}

function requireLogin() {
  if (getUser()) return true;
  location.href = 'auth.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search);
  return false;
}

function renderBackground() {
  if (document.getElementById('ambient-bg')) return;
  const bg = document.createElement('div');
  bg.id = 'ambient-bg';
  bg.className = 'ambient-bg';
  bg.setAttribute('aria-hidden', 'true');
  bg.innerHTML = `
    <div class="hero-grid-bg"></div>
    <div class="ambient-flare"></div>
    <div class="center-glow"></div>
  `;
  document.body.prepend(bg);
}

function renderChrome() {
  renderBackground();
  const page = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
  const u = getUser();
  const on = f => (page === f.replace(/\.html$/, '') ? ' on' : '');
  const nav = document.getElementById('nav');
  if (nav) {
    nav.innerHTML =
      `<a class="brand" href="index.html"><i>&lt;/&gt;</i><b>Tech Verse</b></a>
       <a class="l${on('index')}" href="index.html">Home</a>
       <a class="l${on('blogs')}" href="blogs.html">Read Blogs</a>
       <a class="l${on('write')}" href="write.html">Write Blog</a>
       ${u ? `
         <a class="l${on('profile')}" href="profile.html">Profile</a>
         ${u.role === 'admin' ? `<a class="l${on('admin')} admin-pill" href="admin.html">Admin</a>` : ''}
         <button class="cta" id="logout" type="button">Log out</button>
       ` : `
         <a class="cta" href="auth.html">Login</a>
       `}`;
  }
  const foot = document.getElementById('foot');
  if (foot) {
    foot.innerHTML = `<span>Tech Verse. Articles by students, for students.</span>`;
  }
  document.getElementById('logout')?.addEventListener('click', () => {
    localStorage.removeItem('tv_token');
    localStorage.removeItem('tv_user');
    localStorage.removeItem('tkg_token');
    localStorage.removeItem('tkg_user');
    showToast('You have been logged out', 'info');
    setTimeout(() => {
      location.href = 'index.html';
    }, 400);
  });
}

function card(b, linkId = b.id) {
  const url = 'blog.html?id=' + linkId;
  const readTime = Math.max(2, Math.ceil((b.excerpt || '').length / 45)) + ' min read';
  return `<article class="card"><a href="${url}"><img src="${esc(b.cover || 'assets/covers/git.svg')}" alt="" loading="lazy"></a>
    <div class="cbody"><span class="tag">${esc(b.category)}</span>
    <h3><a href="${url}">${esc(b.title)}</a></h3><p>${esc(b.excerpt)}</p>
    <div class="meta"><span>${esc(b.author)}</span><span>${fmt(b.createdAt)}</span><span>${readTime}</span><span>${b.likes} likes</span></div>
    <a class="more" href="${url}">Read more →</a></div></article>`;
}

document.addEventListener('DOMContentLoaded', () => {
  renderChrome();

  // 1. Dedicated Read Blogs page logic (blogs.html)
  const blogsGrid = document.getElementById('blogs-grid');
  if (blogsGrid) {
    let category = qs('category') || 'All';
    let timer;
    const search = document.getElementById('search');
    const chips = document.getElementById('chips');
    const sform = document.getElementById('sform');
    const countEl = document.getElementById('results-count');

    if (chips) {
      chips.innerHTML = ['All', ...CATEGORIES].map(c => `<button type="button" class="chip${c.toLowerCase() === category.toLowerCase() ? ' on' : ''}" data-c="${c}">${c}</button>`).join('');
      chips.addEventListener('click', e => {
        if (!e.target.dataset.c) return;
        category = e.target.dataset.c;
        chips.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === e.target));
        const newUrl = category === 'All' ? 'blogs.html' : `blogs.html?category=${encodeURIComponent(category)}`;
        window.history.replaceState({}, '', newUrl);
        loadBlogs();
      });
    }

    async function loadBlogs() {
      try {
        blogsGrid.innerHTML = `
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        `;
        const qVal = search ? search.value : '';
        const list = await api(`/blogs?q=${encodeURIComponent(qVal)}&category=${encodeURIComponent(category)}`);
        if (countEl) countEl.textContent = `${list.length} article${list.length === 1 ? '' : 's'}`;
        blogsGrid.innerHTML = list.length
          ? list.map(b => card(b, b.id)).join('')
          : `<div class="empty" style="grid-column: 1 / -1; padding: 60px 20px;">
              <p style="font-size: 18px; margin-bottom: 8px;">No articles found in <b>${esc(category)}</b>.</p>
              <p style="color: var(--tx-muted); font-size: 14.5px;">Try searching for another topic or check back soon!</p>
              <div style="margin-top: 20px;"><a class="btn sm ghost" href="blogs.html">View all articles</a></div>
            </div>`;
      } catch (e) {
        blogsGrid.innerHTML = `<p class="empty" style="grid-column: 1 / -1;">${esc(e.message)}</p>`;
      }
    }

    if (search) {
      search.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(loadBlogs, 250);
      });
    }

    if (sform) {
      sform.addEventListener('submit', e => {
        e.preventDefault();
        loadBlogs();
      });
    }

    loadBlogs();
  }

  // 2. Home page exploration (index.html)
  const grid = document.getElementById('grid');
  if (grid) {
    let all = [], shown = [], category = qs('category') || 'All', timer;
    const feat = document.getElementById('featured');
    const search = document.getElementById('search');
    const chips = document.getElementById('chips');
    const sform = document.getElementById('sform');

    if (chips) {
      chips.innerHTML = ['All', ...CATEGORIES].map(c => `<button type="button" class="chip${c.toLowerCase() === category.toLowerCase() ? ' on' : ''}" data-c="${c}">${c}</button>`).join('');
      chips.addEventListener('click', e => {
        if (!e.target.dataset.c) return;
        category = e.target.dataset.c;
        chips.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === e.target));
        load();
      });
    }

    async function load(initial) {
      try {
        const qVal = search ? search.value : '';
        shown = await api(`/blogs?q=${encodeURIComponent(qVal)}&category=${encodeURIComponent(category)}`);
        if (initial) all = shown;
        render();
      } catch (e) {
        grid.innerHTML = `<p class="empty">${esc(e.message)}</p>`;
      }
    }

    function render() {
      if (all.length && feat) {
        const top = all.reduce((a, b) => (b.likes > a.likes ? b : a), all[0]);
        const url = 'blog.html?id=' + top.id;
        feat.innerHTML = `<section class="feat"><div class="t"><span class="tag">Featured in ${esc(top.category)}</span>
          <h3>${esc(top.title)}</h3><p>${esc(top.excerpt)}</p>
          <div class="meta"><span>${esc(top.author)}</span><span>${fmt(top.createdAt)}</span><span>${top.likes} likes</span></div>
          <a class="btn" href="${url}">Read more →</a></div>
          <img src="${esc(top.cover || 'assets/covers/jwt.svg')}" alt=""></section>`;
      }
      grid.innerHTML = shown.length
        ? shown.map((b, i) => card(b, all[i] ? all[i].id : b.id)).join('')
        : '<p class="empty">No articles match your search.</p>';
    }

    if (search) {
      search.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(load, 250);
      });
    }

    if (sform) {
      sform.addEventListener('submit', e => {
        e.preventDefault();
        load();
      });
    }

    load(true);
  }
});
