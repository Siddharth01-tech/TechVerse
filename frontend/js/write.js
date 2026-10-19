(async function () {
  if (!requireLogin()) return;
  const id = qs('id');
  const msg = document.getElementById('msg');
  const $ = x => document.getElementById(x);

  // Populate category options
  CATEGORIES.forEach(c => $('category').insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`));

  let isDirty = false;
  let originalData = { title: '', category: '', cover: '', content: '' };

  ['title', 'category', 'cover', 'content'].forEach(field => {
    $(field)?.addEventListener('input', () => { isDirty = true; });
  });

  if (id) {
    $('heading').textContent = 'Edit Article';
    $('publish').textContent = 'Update & Publish';
    $('draft').textContent = 'Update Draft';
    try {
      const b = await api('/blogs/' + id);
      $('title').value = b.title || '';
      $('category').value = b.category || '';
      $('cover').value = b.cover || '';
      $('content').value = b.content || '';
      originalData = {
        title: b.title || '',
        category: b.category || '',
        cover: b.cover || '',
        content: b.content || ''
      };
      if (b.status === 'draft') {
        $('heading').textContent = 'Edit Draft';
      }
    } catch (e) {
      showMsg(msg, e.message);
      showToast(e.message, 'err');
    }
  }

  // Cancel button behavior
  const cancelBtn = document.getElementById('cancel') || document.querySelector('.acts-row a.btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (isDirty) {
        const confirmed = await confirmModal({
          title: 'Discard Changes?',
          message: 'You have unsaved edits in this article. Are you sure you want to cancel and exit?',
          confirmText: 'Discard & Exit',
          cancelText: 'Keep Editing',
          danger: true
        });
        if (!confirmed) return;
      }
      location.href = id ? 'my-blogs.html' : 'profile.html';
    });
  }

  async function save(status) {
    const title = $('title').value.trim();
    const category = $('category').value;
    const cover = $('cover').value.trim() || 'assets/covers/git.svg';
    const content = $('content').value.trim();

    if (!title) {
      showMsg(msg, 'Please enter an article title');
      $('title').focus();
      return;
    }

    if (!category) {
      showMsg(msg, 'Please choose a category');
      $('category').focus();
      return;
    }

    if (status === 'published' && !content) {
      showMsg(msg, 'Article content is required before publishing');
      $('content').focus();
      return;
    }

    const body = { title, category, cover, content, status };
    const buttons = document.querySelectorAll('.acts-row button, .acts-row a');
    buttons.forEach(b => { b.disabled = true; });

    const activeBtn = status === 'draft' ? $('draft') : $('publish');
    const origText = activeBtn.textContent;
    activeBtn.textContent = status === 'draft' ? 'Saving draft...' : 'Publishing...';

    try {
      const saved = await api(id ? '/blogs/' + id : '/blogs', {
        method: id ? 'PUT' : 'POST',
        body
      });

      isDirty = false;
      const successMessage = status === 'draft' ? 'Draft saved successfully!' : 'Article published successfully!';
      showToast(successMessage, 'ok');
      showMsg(msg, successMessage, 'ok');

      setTimeout(() => {
        if (status === 'draft') {
          location.href = 'my-blogs.html?tab=drafts';
        } else {
          location.href = 'blog.html?id=' + (saved.id || id);
        }
      }, 700);
    } catch (e) {
      showMsg(msg, e.message);
      showToast(e.message, 'err');
      buttons.forEach(b => { b.disabled = false; });
      activeBtn.textContent = origText;
    }
  }

  $('form').addEventListener('submit', e => {
    e.preventDefault();
    save('published');
  });

  $('draft')?.addEventListener('click', () => {
    save('draft');
  });
})();
