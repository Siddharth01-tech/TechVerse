(async function () {
  const currentAuthUser = getUser();

  // Client-side quick check (server rigorously enforces requireAdmin for all /api/admin/* routes)
  if (!currentAuthUser || currentAuthUser.role !== 'admin') {
    if (window.showToast) {
      showToast('Access denied: Administrator privileges required', 'err');
    }
    setTimeout(() => {
      location.href = 'index.html';
    }, 300);
    return;
  }

  // Populate category filter in blogs section
  const filterCat = document.getElementById('filter-blog-cat');
  if (filterCat) {
    CATEGORIES.forEach(c => {
      filterCat.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`);
    });
  }

  // Tab switching
  const tabsWrap = document.getElementById('admin-tabs');
  const sectionBlogs = document.getElementById('section-blogs');
  const sectionUsers = document.getElementById('section-users');

  tabsWrap?.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    tabsWrap.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('on', b === btn));
    const view = btn.dataset.view;
    if (view === 'blogs') {
      sectionBlogs.style.display = 'block';
      sectionUsers.style.display = 'none';
      loadAdminBlogs();
    } else {
      sectionBlogs.style.display = 'none';
      sectionUsers.style.display = 'block';
      loadAdminUsers();
    }
  });

  // 1. Load Overview Metrics
  async function loadMetrics() {
    try {
      const stats = await api('/admin/stats');
      document.getElementById('stat-users').textContent = stats.totalUsers ?? 0;
      document.getElementById('stat-active-users').textContent = `${stats.activeUsers ?? 0} active accounts`;
      document.getElementById('stat-blogs').textContent = stats.totalBlogs ?? 0;
      document.getElementById('stat-pub-blogs').textContent = stats.publishedBlogs ?? 0;
      document.getElementById('stat-draft-blogs').textContent = stats.draftBlogs ?? 0;
    } catch (err) {
      showToast(err.message, 'err');
    }
  }

  // 2. Load and Manage Articles
  const searchBlogsInput = document.getElementById('search-blogs');
  const filterBlogStatus = document.getElementById('filter-blog-status');
  const blogsTableBody = document.getElementById('blogs-table-body');
  let blogSearchTimer;

  async function loadAdminBlogs() {
    try {
      blogsTableBody.innerHTML = `
        <tr><td colspan="6" class="empty">Loading platform articles...</td></tr>
      `;

      const q = encodeURIComponent(searchBlogsInput?.value.trim() || '');
      const status = encodeURIComponent(filterBlogStatus?.value || 'all');
      const cat = encodeURIComponent(filterCat?.value || 'All');

      const blogs = await api(`/admin/blogs?q=${q}&status=${status}&category=${cat}`);

      if (!blogs.length) {
        blogsTableBody.innerHTML = `
          <tr><td colspan="6" class="empty">No articles match the current filter criteria.</td></tr>
        `;
        return;
      }

      blogsTableBody.innerHTML = blogs.map(b => `
        <tr id="admin-blog-${b.id}">
          <td>
            <div style="display:flex;align-items:center;gap:12px;">
              <img src="${esc(b.cover || 'assets/covers/git.svg')}" style="width:48px;height:32px;border-radius:6px;object-fit:cover;background:#181820;" alt="">
              <div>
                <a href="blog.html?id=${b.id}" target="_blank" style="font-weight:700;color:#fff;">${esc(b.title)}</a>
                <div style="font-size:12px;color:var(--tx-muted);">${b.likes} likes</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight:600;color:#fff;">${esc(b.author)}</div>
            <div style="font-size:12px;color:var(--tx-muted);">${esc(b.author_email || '')}</div>
          </td>
          <td><span class="tag">${esc(b.category)}</span></td>
          <td>
            <span class="st ${b.status}">${b.status === 'draft' ? 'Draft' : 'Published'}</span>
          </td>
          <td style="color:var(--tx-muted);font-size:13.5px;">${fmt(b.createdAt)}</td>
          <td style="text-align:right;">
            <div style="display:inline-flex;gap:8px;">
              <a href="blog.html?id=${b.id}" class="btn line sm" target="_blank" title="Inspect Article">Inspect</a>
              <button type="button" class="btn danger sm" data-del-blog="${b.id}" data-title="${esc(b.title)}" title="Delete Article">Remove</button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      blogsTableBody.innerHTML = `<tr><td colspan="6" class="empty">${esc(err.message)}</td></tr>`;
      showToast(err.message, 'err');
    }
  }

  searchBlogsInput?.addEventListener('input', () => {
    clearTimeout(blogSearchTimer);
    blogSearchTimer = setTimeout(loadAdminBlogs, 300);
  });
  filterBlogStatus?.addEventListener('change', loadAdminBlogs);
  filterCat?.addEventListener('change', loadAdminBlogs);

  // Article Actions Handler (Delete)
  blogsTableBody?.addEventListener('click', async (e) => {
    const delBtn = e.target.closest('[data-del-blog]');
    if (!delBtn) return;

    const blogId = delBtn.dataset.delBlog;
    const title = delBtn.dataset.title;

    const confirmed = await confirmModal({
      title: 'Remove Article as Administrator?',
      message: `Are you sure you want to permanently remove "${title}"? This cannot be undone.`,
      confirmText: 'Remove Article',
      cancelText: 'Keep',
      danger: true
    });
    if (!confirmed) return;

    delBtn.disabled = true;
    try {
      const res = await api(`/admin/blogs/${blogId}`, { method: 'DELETE' });
      showToast(res.message || 'Article removed successfully', 'ok');
      document.getElementById('admin-blog-' + blogId)?.remove();
      loadMetrics();
    } catch (err) {
      showToast(err.message, 'err');
      delBtn.disabled = false;
    }
  });

  // 3. Load and Manage Users
  const searchUsersInput = document.getElementById('search-users');
  const filterUserRole = document.getElementById('filter-user-role');
  const filterUserStatus = document.getElementById('filter-user-status');
  const usersTableBody = document.getElementById('users-table-body');
  let userSearchTimer;

  async function loadAdminUsers() {
    try {
      usersTableBody.innerHTML = `
        <tr><td colspan="7" class="empty">Loading registered users...</td></tr>
      `;

      const q = encodeURIComponent(searchUsersInput?.value.trim() || '');
      const role = encodeURIComponent(filterUserRole?.value || 'all');
      const status = encodeURIComponent(filterUserStatus?.value || 'all');

      const users = await api(`/admin/users?q=${q}&role=${role}&status=${status}`);

      if (!users.length) {
        usersTableBody.innerHTML = `
          <tr><td colspan="7" class="empty">No users match the search criteria.</td></tr>
        `;
        return;
      }

      usersTableBody.innerHTML = users.map(u => {
        const isSelf = u.id === currentAuthUser.id;
        const statusBadge = u.isActive
          ? `<span class="st published">Active</span>`
          : `<span class="st draft" style="background:rgba(239,68,68,0.15);color:#FCA5A5;border-color:rgba(239,68,68,0.3)">Deactivated</span>`;

        const roleBadge = u.role === 'admin'
          ? `<span class="badge" style="border-color:rgba(255,90,34,0.45);background:rgba(255,69,13,0.18);color:#FF8A5C;padding:3px 10px;font-size:12px;">Admin</span>`
          : `<span style="font-size:13px;color:var(--tx-muted);font-weight:600;">Member</span>`;

        return `
          <tr id="admin-user-${u.id}">
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="prof-avatar-initials sm" style="width:36px;height:36px;font-size:13px;">${getInitials(u.name)}</div>
                <div>
                  <div style="font-weight:700;color:#fff;">${esc(u.name)} ${isSelf ? '<small style="color:var(--or)">(You)</small>' : ''}</div>
                  <div style="font-size:12px;color:var(--tx-muted);">@${esc(u.username || 'user')}</div>
                </div>
              </div>
            </td>
            <td style="color:#D4D4D8;font-size:14px;">${esc(u.email)}</td>
            <td>${roleBadge}</td>
            <td>${statusBadge}</td>
            <td>
              <span style="font-weight:700;color:#fff;">${u.totalBlogs}</span>
              <span style="color:var(--tx-muted);font-size:12px;">(${u.publishedBlogs} pub)</span>
            </td>
            <td style="color:var(--tx-muted);font-size:13px;">${fmt(u.createdAt)}</td>
            <td style="text-align:right;">
              <div style="display:inline-flex;gap:8px;">
                <button type="button" class="btn line sm" data-toggle-status="${u.id}" data-name="${esc(u.name)}" data-active="${u.isActive}" ${isSelf ? 'disabled title="Cannot deactivate yourself"' : ''}>
                  ${u.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button type="button" class="btn line sm" data-toggle-role="${u.id}" data-name="${esc(u.name)}" data-role="${u.role}" ${isSelf ? 'disabled title="Cannot change your own role"' : ''}>
                  ${u.role === 'admin' ? 'Demote' : 'Make Admin'}
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      usersTableBody.innerHTML = `<tr><td colspan="7" class="empty">${esc(err.message)}</td></tr>`;
      showToast(err.message, 'err');
    }
  }

  searchUsersInput?.addEventListener('input', () => {
    clearTimeout(userSearchTimer);
    userSearchTimer = setTimeout(loadAdminUsers, 300);
  });
  filterUserRole?.addEventListener('change', loadAdminUsers);
  filterUserStatus?.addEventListener('change', loadAdminUsers);

  // User Actions Handler (Status & Role Toggles)
  usersTableBody?.addEventListener('click', async (e) => {
    // 1. Status Toggle
    const statusBtn = e.target.closest('[data-toggle-status]');
    if (statusBtn && !statusBtn.disabled) {
      const userId = statusBtn.dataset.toggleStatus;
      const name = statusBtn.dataset.name;
      const isActive = statusBtn.dataset.active === 'true';

      const confirmed = await confirmModal({
        title: isActive ? `Deactivate Account for ${name}?` : `Activate Account for ${name}?`,
        message: isActive
          ? `Deactivating this user will prevent them from logging in and writing articles.`
          : `Re-activating this user will restore their account access.`,
        confirmText: isActive ? 'Deactivate Account' : 'Activate Account',
        danger: isActive
      });
      if (!confirmed) return;

      statusBtn.disabled = true;
      try {
        const res = await api(`/admin/users/${userId}/status`, { method: 'PATCH' });
        showToast(res.message, 'ok');
        loadAdminUsers();
        loadMetrics();
      } catch (err) {
        showToast(err.message, 'err');
        statusBtn.disabled = false;
      }
      return;
    }

    // 2. Role Toggle
    const roleBtn = e.target.closest('[data-toggle-role]');
    if (roleBtn && !roleBtn.disabled) {
      const userId = roleBtn.dataset.toggleRole;
      const name = roleBtn.dataset.name;
      const currentRole = roleBtn.dataset.role;
      const newRole = currentRole === 'admin' ? 'user' : 'admin';

      const confirmed = await confirmModal({
        title: newRole === 'admin' ? `Promote ${name} to Administrator?` : `Demote ${name} to Regular Member?`,
        message: newRole === 'admin'
          ? `Granting administrator privileges gives full access to platform metrics, article moderation, and user management.`
          : `Demoting this user will remove access to the Admin Dashboard.`,
        confirmText: newRole === 'admin' ? 'Promote to Admin' : 'Demote to User',
        danger: newRole !== 'admin'
      });
      if (!confirmed) return;

      roleBtn.disabled = true;
      try {
        const res = await api(`/admin/users/${userId}/role`, {
          method: 'PATCH',
          body: { role: newRole }
        });
        showToast(res.message, 'ok');
        loadAdminUsers();
      } catch (err) {
        showToast(err.message, 'err');
        roleBtn.disabled = false;
      }
    }
  });

  // Initial load
  loadMetrics();
  loadAdminBlogs();
})();
