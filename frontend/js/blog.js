(async function () {
  const id = qs('id'), box = document.getElementById('article');
  let b;
  try { b = await api('/blogs/' + id); }
  catch (e) { box.innerHTML = `<p class="empty">${esc(e.message)}. <a href="index.html" style="color:#FF8A5C">Back to home</a></p>`; return; }
  document.title = b.title + ' | TeachVerse';

  const paras = b.content.split(/\n\s*\n/).map(p => `<p>${esc(p.trim())}</p>`).join('');
  const comments = await api('/comments/blog/' + id).catch(() => []);
  const row = c => `<div class="cm"><b>${esc(c.author)}</b><small>${fmt(c.createdAt)}</small><p style="color:#D4D4D8">${esc(c.text)}</p></div>`;

  box.innerHTML = `<span class="badge">${esc(b.category)}</span><h1>${esc(b.title)}</h1>
    <div class="meta"><span>By ${esc(b.author)}</span><span>${fmt(b.createdAt)}</span></div>
    <img class="cover" src="${esc(b.cover || 'assets/covers/git.svg')}" alt="">
    <div class="acts"><button class="pill" id="like" type="button"></button><button class="pill" id="mark" type="button"></button>
      ${b.isOwner ? `<a class="pill" href="write.html?id=${b.id}">Edit</a>` : ''}</div>
    <div class="msg" id="msg"></div>
    <div class="body" style="margin-top:22px">${paras}</div>
    <h2 class="h2">Comments (${comments.length})</h2>
    <div id="cform"></div><div id="comments">${comments.map(row).join('') || '<p class="empty" id="nocomm">No comments yet. Start the discussion.</p>'}</div>`;

  const like = document.getElementById('like'), mark = document.getElementById('mark'), msg = document.getElementById('msg');
  const paint = () => {
    like.textContent = `${b.liked ? 'Unlike' : 'Like'} (${b.likes})`; like.classList.toggle('on', b.liked);
    mark.textContent = b.bookmarked ? 'Bookmarked' : 'Bookmark'; mark.classList.toggle('on', b.bookmarked);
  };
  paint();
  like.onclick = async () => { if (!requireLogin()) return; try { const r = await api(`/blogs/${id}/like`, { method: 'POST' }); b.liked = r.liked; b.likes = r.likes; paint(); } catch (e) { showMsg(msg, e.message); } };
  mark.onclick = async () => { if (!requireLogin()) return; try { b.bookmarked = (await api(`/blogs/${id}/bookmark`, { method: 'POST' })).bookmarked; paint(); } catch (e) { showMsg(msg, e.message); } };

  document.getElementById('cform').innerHTML = getUser()
    ? `<textarea class="dk" id="ctext" placeholder="Add a comment" aria-label="Add a comment"></textarea>
       <div style="margin:12px 0 18px"><button class="btn" id="post" type="button">Post comment</button></div><div class="msg" id="cmsg"></div>`
    : `<p style="margin-bottom:12px"><a href="auth.html?next=${encodeURIComponent('blog.html?id=' + id)}" style="color:#FF8A5C;font-weight:700">Log in</a> to comment.</p>`;
  document.getElementById('post')?.addEventListener('click', async () => {
    const t = document.getElementById('ctext'), cm = document.getElementById('cmsg');
    try {
      const c = await api('/comments/blog/' + id, { method: 'POST', body: { text: t.value } });
      document.getElementById('nocomm')?.remove();
      document.getElementById('comments').insertAdjacentHTML('afterbegin', row(c));
      t.value = ''; cm.className = 'msg';
    } catch (e) { showMsg(cm, e.message); }
  });

  const rel = await api(`/blogs/${id}/related`).catch(() => []);
  if (rel.length) {
    document.getElementById('related').innerHTML = `<h2 class="h2">Related articles</h2><div class="grid">${rel.map(r => card(r)).join('')}</div>`;
  }
})();
