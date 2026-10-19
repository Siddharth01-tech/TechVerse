(async function () {
  if (!requireLogin()) return;

  const list = document.getElementById('list');
  const msg = document.getElementById('msg');
  const countEl = document.getElementById('count');
  const countAll = document.getElementById('count-all');
  const countPub = document.getElementById('count-pub');
  const countDraft = document.getElementById('count-draft');
  const tabsWrap = document.getElementById('tabs');

  let allBlogs = [];
  let currentFilter = qs('tab') || 'all';

  // Set active tab button based on URL or default
  if (tabsWrap) {
    tabsWrap.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('on', btn.dataset.filter === currentFilter);
    });
  }

  const row = b => `
    <div class="item" id="b-${b.id}">
      <img src="${esc(b.cover || 'assets/covers/git.svg')}" alt="" loading="lazy">
      <div class="info">
        <h3><a href="blog.html?id=${b.id}">${esc(b.title)}</a></h3>
        <div class="meta">
          <span>${esc(b.category)}</span>
          <span>${fmt(b.createdAt)}</span>
          <span>${b.likes} likes</span>
        </div>
      </div>
      <span class="st ${b.status}">${b.status === 'draft' ? 'Draft' : 'Published'}</span>
      <div class="ibtns">
        <a class="btn line sm" href="blog.html?id=${b.id}" title="View article">View</a>
        <a class="btn line sm" href="write.html?id=${b.id}" title="Edit article">Edit</a>
        <button class="btn line sm" type="button" data-toggle="${b.id}" title="${b.status === 'draft' ? 'Publish article' : 'Unpublish to draft'}">
          ${b.status === 'draft' ? 'Publish' : 'Unpublish'}
        </button>
        <button class="btn danger sm" type="button" data-del="${b.id}" title="Delete article">Delete</button>
      </div>
    </div>
  `;

  function renderList() {
    const filtered = allBlogs.filter(b => {
      if (currentFilter === 'published') return b.status === 'published';
      if (currentFilter === 'draft') return b.status === 'draft';
      return true;
    });

    const pubCount = allBlogs.filter(b => b.status === 'published').length;
    const draftCount = allBlogs.filter(b => b.status === 'draft').length;

    if (countEl) countEl.textContent = allBlogs.length;
    if (countAll) countAll.textContent = allBlogs.length;
    if (countPub) countPub.textContent = pubCount;
    if (countDraft) countDraft.textContent = draftCount;

    if (!filtered.length) {
      let emptyMsg = 'You have not written any articles yet.';
      let subMsg = 'Share your technical knowledge and inspire other developers!';
      if (currentFilter === 'published') {
        emptyMsg = 'No published articles yet.';
        subMsg = 'You can publish your saved drafts anytime.';
      } else if (currentFilter === 'draft') {
        emptyMsg = 'No saved drafts.';
        subMsg = 'All your written articles are currently published.';
      }

      list.innerHTML = `
        <div class="empty-box">
          <div class="empty-icon">📝</div>
          <h3>${esc(emptyMsg)}</h3>
          <p>${esc(subMsg)}</p>
          <div style="margin-top:16px;">
            <a class="btn sm" href="write.html">Write a blog</a>
          </div>
        </div>
      `;
      return;
    }

    list.innerHTML = filtered.map(row).join('');
  }

  async function loadMyBlogs() {
    try {
      list.innerHTML = `
        <div class="skeleton-item"></div>
        <div class="skeleton-item"></div>
        <div class="skeleton-item"></div>
      `;
      allBlogs = await api('/blogs/mine');
      renderList();
    } catch (e) {
      showMsg(msg, e.message);
      showToast(e.message, 'err');
      list.innerHTML = `<p class="empty">${esc(e.message)}</p>`;
    }
  }

  // Tab switching
  if (tabsWrap) {
    tabsWrap.addEventListener('click', e => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      currentFilter = btn.dataset.filter;
      tabsWrap.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('on', b === btn));
      window.history.replaceState({}, '', currentFilter === 'all' ? 'my-blogs.html' : `my-blogs.html?tab=${currentFilter}`);
      renderList();
    });
  }

  // Click handler for Delete & Toggle Status
  list.addEventListener('click', async e => {
    // 1. Delete blog
    const delId = e.target.closest('[data-del]')?.dataset.del;
    if (delId) {
      const blog = allBlogs.find(b => b.id === delId);
      const confirmed = await confirmModal({
        title: 'Delete Article?',
        message: `Are you sure you want to delete "${blog?.title || 'this article'}"? This action is permanent and cannot be undone.`,
        confirmText: 'Delete Permanently',
        cancelText: 'Keep Article',
        danger: true
      });
      if (!confirmed) return;

      try {
        await api('/blogs/' + delId, { method: 'DELETE' });
        allBlogs = allBlogs.filter(b => b.id !== delId);
        showToast('Article deleted successfully', 'ok');
        renderList();
      } catch (err) {
        showMsg(msg, err.message);
        showToast(err.message, 'err');
      }
      return;
    }

    // 2. Publish / Unpublish toggle
    const toggleId = e.target.closest('[data-toggle]')?.dataset.toggle;
    if (toggleId) {
      const btn = e.target.closest('[data-toggle]');
      btn.disabled = true;
      try {
        const res = await api(`/blogs/${toggleId}/status`, { method: 'PATCH' });
        const target = allBlogs.find(b => b.id === toggleId);
        if (target) {
          target.status = res.status;
        }
        showToast(res.message || 'Status updated', 'ok');
        renderList();
      } catch (err) {
        showMsg(msg, err.message);
        showToast(err.message, 'err');
        btn.disabled = false;
      }
    }
  });

  loadMyBlogs();
})();
