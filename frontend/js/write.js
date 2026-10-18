(async function () {
  if (!requireLogin()) return;
  const id = qs('id'), msg = document.getElementById('msg');
  const $ = x => document.getElementById(x);
  CATEGORIES.forEach(c => $('category').insertAdjacentHTML('beforeend', `<option>${c}</option>`));

  if (id) {
    $('heading').textContent = 'Edit blog';
    $('publish').textContent = 'Save and publish';
    try {
      const b = await api('/blogs/' + id);
      $('title').value = b.title; $('category').value = b.category; $('cover').value = b.cover; $('content').value = b.content;
    } catch (e) { showMsg(msg, e.message); }
  }

  async function save(status) {
    const body = { title: $('title').value, category: $('category').value, cover: $('cover').value, content: $('content').value, status };
    if (!body.title) return showMsg(msg, 'Enter a title');
    if (!body.category) return showMsg(msg, 'Choose a category');
    document.querySelectorAll('.btn').forEach(b => (b.disabled = true));
    try {
      const saved = await api(id ? '/blogs/' + id : '/blogs', { method: id ? 'PUT' : 'POST', body });
      showMsg(msg, status === 'draft' ? 'Draft saved' : 'Published', 'ok');
      setTimeout(() => (location.href = status === 'draft' ? 'my-blogs.html' : 'blog.html?id=' + saved.id), 700);
    } catch (e) { showMsg(msg, e.message); document.querySelectorAll('.btn').forEach(b => (b.disabled = false)); }
  }
  $('form').addEventListener('submit', e => { e.preventDefault(); save('published'); });
  $('draft').addEventListener('click', () => save('draft'));
})();
