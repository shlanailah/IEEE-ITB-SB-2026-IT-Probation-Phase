// ============================================================================
// PAGE: Admin Login
// ============================================================================
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.supabaseConfigured()) {
      app.toast('Supabase belum dikonfigurasi. Isi js/config.js.', 'error');
    }

    app.getSession().then(function (session) {
      if (session) window.location.replace('dashboard.html');
    });

    var form = document.getElementById('loginForm');
    var email = document.getElementById('email');
    var password = document.getElementById('password');
    var btn = document.getElementById('loginBtn');
    var errEmail = document.getElementById('errEmail');
    var errPassword = document.getElementById('errPassword');

    function mark(input, errEl, valid) {
      input.classList.toggle('has-error', !valid);
      errEl.classList.toggle('show', !valid);
      return valid;
    }

    email.addEventListener('input', function () { mark(email, errEmail, true); });
    password.addEventListener('input', function () { mark(password, errPassword, true); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      var validPass = password.value.length >= 6;
      var ok = true;
      ok = mark(email, errEmail, validEmail) && ok;
      ok = mark(password, errPassword, validPass) && ok;
      if (!ok) return;

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Logging in...';

      app.signIn(email.value.trim(), password.value).then(function (res) {
        if (res.error) {
          btn.disabled = false;
          btn.textContent = 'Login';
          app.toast(res.error, 'error');
          return;
        }
        window.location.replace('dashboard.html');
      });
    });
  });
})();