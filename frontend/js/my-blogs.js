(async function () {
  if (!requireLogin()) return;
  const list = document.getElementById('list'), msg = document.getElementById('msg'), count = document.getElementById('count');
  const row = b => `<div class="item" id="b-${b.id}"><img src="${esc(b.cover || 'assets/covers/git.svg')}" alt="">
    <div class="info"><h3><a href="blog.html?id=${b.id}">${esc(b.title)}</a></h3>
    <div class="meta"><span>${esc(b.category)}</span><span>${fmt(b.createdAt)}</span><span>${b.likes} likes</span></div></div>
    <span class="st ${b.status}">${b.status === 'draft' ? 'Draft' : 'Published'}</span>
    <div class="ibtns"><a class="btn line sm" href="write.html?id=${b.id}">Edit</a><button class="btn danger sm" type="button" data-del="${b.id}">Delete</button></div></div>`;
  const empty = '<p class="empty">You have not written anything yet. <a href="write.html" style="color:#B93009;font-weight:700">Write your first blog</a></p>';

  try {
    const blogs = await api('/blogs/mine');
    count.textContent = blogs.length;
    list.innerHTML = blogs.map(row).join('') || empty;
  } catch (e) { showMsg(msg, e.message); }

  list.addEventListener('click', async e => {
    const id = e.target.dataset.del;
    if (!id || !confirm('Delete this article? This cannot be undone.')) return;
    try {
      await api('/blogs/' + id, { method: 'DELETE' });
      document.getElementById('b-' + id).remove();
      if (!list.children.length) list.innerHTML = empty;
      showMsg(msg, 'Article deleted', 'ok');
    } catch (err) { showMsg(msg, err.message); }
  });
})();
