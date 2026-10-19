(function () {
  let mode = 'login';
  const $ = x => document.getElementById(x), msg = $('msg');

  const set = m => {
    mode = m;
    const s = m === 'signup';
    if ($('name-wrap')) $('name-wrap').style.display = s ? '' : 'none';
    if ($('username-wrap')) $('username-wrap').style.display = s ? '' : 'none';
    $('heading').textContent = s ? 'Create your account' : 'Welcome back';
    $('submit').textContent = s ? 'Create account' : 'Log in';
    $('tab-login').classList.toggle('on', !s);
    $('tab-signup').classList.toggle('on', s);
    msg.className = 'msg';
  };

  $('tab-login').onclick = () => set('login');
  $('tab-signup').onclick = () => set('signup');

  // Check if URL has ?mode=signup
  if (new URLSearchParams(location.search).get('mode') === 'signup') {
    set('signup');
  }

  $('form').addEventListener('submit', async e => {
    e.preventDefault();
    const body = {
      name: $('name') ? $('name').value.trim() : '',
      username: $('username') ? $('username').value.trim() : '',
      email: $('email').value.trim(),
      password: $('password').value
    };

    if (mode === 'signup' && !body.name) return showMsg(msg, 'Please enter your full name');
    if (!body.email) return showMsg(msg, 'Please enter your email');
    if (!body.password) return showMsg(msg, 'Please enter your password');
    if (mode === 'signup' && body.password.length < 6) return showMsg(msg, 'Password must be at least 6 characters');

    const submitBtn = $('submit');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = mode === 'signup' ? 'Creating account...' : 'Logging in...';

    try {
      const r = await api('/auth/' + mode, { method: 'POST', body });
      localStorage.setItem('tv_token', r.token);
      localStorage.setItem('tv_user', JSON.stringify(r.user));
      localStorage.setItem('tkg_token', r.token);
      localStorage.setItem('tkg_user', JSON.stringify(r.user));

      // Notification
      if (window.showToast) {
        showToast(mode === 'signup' ? 'Account created! Welcome to Tech Verse' : 'Welcome back, ' + r.user.name, 'ok');
      }

      // Role-based routing: Admin accounts navigate to admin panel, regular users to profile dashboard
      if (r.user && r.user.role === 'admin') {
        location.href = 'admin.html';
      } else {
        const next = new URLSearchParams(location.search).get('next');
        location.href = (next && !next.includes('auth.html')) ? next : 'profile.html';
      }
    } catch (err) {
      showMsg(msg, err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
})();
