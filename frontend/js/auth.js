(function () {
  let mode = 'login';
  const $ = x => document.getElementById(x), msg = $('msg');
  const set = m => {
    mode = m; const s = m === 'signup';
    $('name-wrap').style.display = s ? '' : 'none';
    $('heading').textContent = s ? 'Create your account' : 'Welcome back';
    $('submit').textContent = s ? 'Create account' : 'Log in';
    $('tab-login').classList.toggle('on', !s); $('tab-signup').classList.toggle('on', s);
    msg.className = 'msg';
  };
  $('tab-login').onclick = () => set('login');
  $('tab-signup').onclick = () => set('signup');

  $('form').addEventListener('submit', async e => {
    e.preventDefault();
    const body = { name: $('name').value, email: $('email').value.trim(), password: $('password').value };
    if (mode === 'signup' && !body.name.trim()) return showMsg(msg, 'Enter your name');
    if (!body.email) return showMsg(msg, 'Enter your email');
    if (!body.password) return showMsg(msg, 'Enter your password');
    if (mode === 'signup' && body.password.length < 6) return showMsg(msg, 'Password must be at least 6 characters');
    $('submit').disabled = true;
    try {
      localStorage.setItem('tv_token', r.token); localStorage.setItem('tv_user', JSON.stringify(r.user));
      localStorage.setItem('tkg_token', r.token); localStorage.setItem('tkg_user', JSON.stringify(r.user));
      location.href = 'index.html';
    } catch (err) { showMsg(msg, err.message); $('submit').disabled = false; }
  });
})();
