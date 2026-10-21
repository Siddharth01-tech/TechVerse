(async function () {
  if (!requireLogin()) return;

  const profCard = document.getElementById('profile-card');
  const recentList = document.getElementById('recent-list');
  const statTotal = document.getElementById('stat-total');
  const statPub = document.getElementById('stat-pub');
  const statDraft = document.getElementById('stat-draft');

  const editModal = document.getElementById('edit-modal');
  const editForm = document.getElementById('edit-profile-form');
  const editMsg = document.getElementById('edit-msg');
  const closeModalBtn = document.getElementById('close-modal');
  const cancelEditBtn = document.getElementById('cancel-edit');

  let currentUserData = null;

  async function loadProfile() {
    try {
      const data = await api('/auth/me');
      currentUserData = data.user;

      // Update localStorage with fresh data from DB
      localStorage.setItem('tv_user', JSON.stringify(data.user));
      localStorage.setItem('tkg_user', JSON.stringify(data.user));

      renderProfileCard(data.user);
      renderStats(data.stats);
      renderRecentBlogs(data.recentBlogs);
    } catch (err) {
      showToast(err.message, 'err');
      profCard.innerHTML = `<p class="empty" style="padding:40px;">${esc(err.message)}</p>`;
    }
  }

  function renderProfileCard(user) {
    const avatarHtml = user.avatar
      ? `<img src="${esc(user.avatar)}" class="prof-avatar" alt="${esc(user.name)}" onerror="this.outerHTML='<div class=\\'prof-avatar-initials\\'>${getInitials(user.name)}</div>'">`
      : `<div class="prof-avatar-initials">${getInitials(user.name)}</div>`;

    const roleBadgeHtml = user.role === 'admin'
      ? `<span class="badge" style="border-color:rgba(255,90,34,0.45);background:rgba(255,69,13,0.18);color:#FF8A5C">Administrator</span>`
      : `<span class="badge" style="border-color:rgba(255,255,255,0.15)">Member</span>`;

    profCard.innerHTML = `
      <div class="prof-inner">
        <div class="prof-left">
          ${avatarHtml}
          <div class="prof-meta">
            <div class="prof-name-row">
              <h1 class="prof-title">${esc(user.name)}</h1>
              ${roleBadgeHtml}
            </div>
            <div class="prof-sub-row">
              <span class="prof-uname">@${esc(user.username || 'user')}</span>
              <span class="prof-bullet">•</span>
              <span class="prof-email">${esc(user.email)}</span>
              <span class="prof-bullet">•</span>
              <span class="prof-date">Joined ${fmt(user.createdAt)}</span>
            </div>
            <p class="prof-bio">${esc(user.bio || 'Tech Verse enthusiast and developer. Click Edit Profile to add a custom bio.')}</p>
          </div>
        </div>
        <div class="prof-actions">
          <button type="button" class="btn line sm" id="edit-profile-btn">
            <span>✏️</span> Edit Profile
          </button>
          ${user.role === 'admin' ? `
            <a href="admin.html" class="btn ghost sm" style="border-color:rgba(255,69,13,0.4);color:#FF8A5C">
              <span>🛡️</span> Admin Panel
            </a>
          ` : ''}
        </div>
      </div>
    `;

    document.getElementById('edit-profile-btn')?.addEventListener('click', openEditModal);
  }

  function renderStats(stats = {}) {
    if (statTotal) statTotal.textContent = stats.totalBlogs ?? 0;
    if (statPub) statPub.textContent = stats.publishedBlogs ?? 0;
    if (statDraft) statDraft.textContent = stats.draftBlogs ?? 0;
  }

  function renderRecentBlogs(blogs = []) {
    if (!blogs.length) {
      recentList.innerHTML = `
        <div class="empty-box" style="padding:40px 20px;">
          <div class="empty-icon">🚀</div>
          <h3 style="font-size:18px;margin-bottom:6px;">Welcome to your Tech Verse Dashboard!</h3>
          <p style="color:var(--tx-muted);font-size:14.5px;max-width:500px;margin:0 auto 18px;">
            You haven't written any articles yet. Share your knowledge in programming, AI, web development or cybersecurity with fellow engineers!
          </p>
          <a class="btn sm" href="write.html">Write your first blog →</a>
        </div>
      `;
      return;
    }

    recentList.innerHTML = blogs.map(b => `
      <div class="item" id="rb-${b.id}">
        <img src="${esc(typeof getMediaUrl === 'function' ? getMediaUrl(b.cover) : (b.cover || 'assets/covers/git.svg'))}" alt="" loading="lazy">
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
          <a class="btn line sm" href="blog.html?id=${b.id}">View</a>
          <a class="btn line sm" href="write.html?id=${b.id}">Edit</a>
        </div>
      </div>
    `).join('');
  }

  function openEditModal() {
    if (!currentUserData) return;
    document.getElementById('edit-name').value = currentUserData.name || '';
    document.getElementById('edit-username').value = currentUserData.username || '';
    document.getElementById('edit-bio').value = currentUserData.bio || '';
    document.getElementById('edit-avatar').value = currentUserData.avatar || '';
    editMsg.className = 'msg';
    editModal.style.display = 'flex';
  }

  function closeEditModal() {
    editModal.classList.add('closing');
    setTimeout(() => {
      editModal.style.display = 'none';
      editModal.classList.remove('closing');
    }, 200);
  }

  closeModalBtn?.addEventListener('click', closeEditModal);
  cancelEditBtn?.addEventListener('click', closeEditModal);
  editModal?.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
  });

  editForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('edit-name').value.trim();
    const username = document.getElementById('edit-username').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();
    const avatar = document.getElementById('edit-avatar').value.trim();

    if (!name) {
      showMsg(editMsg, 'Please enter your full name');
      return;
    }

    if (username && !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      showMsg(editMsg, 'Username must be 3-30 characters (letters, numbers, underscores)');
      return;
    }

    const saveBtn = document.getElementById('save-edit');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const res = await api('/auth/profile', {
        method: 'PUT',
        body: { name, username, bio, avatar }
      });

      currentUserData = res.user;
      localStorage.setItem('tv_user', JSON.stringify(res.user));
      localStorage.setItem('tkg_user', JSON.stringify(res.user));

      renderProfileCard(res.user);
      renderChrome(); // Re-render nav if name changed
      closeEditModal();
      showToast('Profile updated successfully!', 'ok');
    } catch (err) {
      showMsg(editMsg, err.message);
      showToast(err.message, 'err');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
    }
  });

  loadProfile();
})();
