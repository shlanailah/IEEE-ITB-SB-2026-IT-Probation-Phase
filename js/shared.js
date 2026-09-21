// ============================================================================
// SHARED UI HELPERS — navbar/footer injection, toasts, states, carousel,
// formatters and reusable templates.
// Exposes everything on window.app
// ============================================================================
(function () {
  'use strict';

  var app = window.app = window.app || {};

  // ----------------------------- Helpers -----------------------------------
  app.esc = function (str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  app.imageFallback = function (img) {
    img.onerror = null;
    img.classList.add('img-fallback');
    img.alt = img.alt || '';
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  };

  app.getParam = function (name) {
    return new URLSearchParams(window.location.search).get(name);
  };

  // Simple sessionStorage JSON cache keyed by (key) with a max age.
  app.cacheSet = function (key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value }));
    } catch (e) { /* storage full / disabled */ }
  };

  app.cacheGet = function (key, maxAgeMs) {
    try {
      var raw = sessionStorage.getItem(key);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.v) return null;
      if (maxAgeMs && (Date.now() - parsed.t) > maxAgeMs) return null;
      return parsed.v;
    } catch (e) {
      return null;
    }
  };

  app.formatDate = function (dateStr) {
    if (!dateStr) return '-';
    var d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  app.formatTime = function (timeStr) {
    if (!timeStr) return '-';
    return String(timeStr).slice(0, 5);
  };

  app.formatDateTime = function (ev) {
    return (app.formatDate(ev.date) + ' \u00B7 ' + app.formatTime(ev.time));
  };

  app.imageFallback = function (img) {
    img.onerror = null;
    img.classList.add('img-fallback');
    img.alt = img.alt || '';
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  };

  // --------------------------- Navbar & Footer ------------------------------
  var NAV_LINKS = [
    { key: 'home',    label: 'Home',  href: 'index.html' },
    { key: 'about',   label: 'About', href: 'about.html' },
    { key: 'events',  label: 'Event', href: 'events.html' }
  ];

  app.renderNavbar = function (activeKey) {
    var el = document.getElementById('navbar');
    if (!el) return;

    var links = NAV_LINKS.map(function (l) {
      var cls = l.key === activeKey ? 'nav-link is-active' : 'nav-link';
      return '<a class="' + cls + '" href="' + l.href + '">' + l.label + '</a>';
    }).join('');

    el.innerHTML =
      '<header class="nav-wrap">' +
      '  <nav class="nav" id="nav">' +
      '    <a class="nav-brand" href="index.html">IEEE</a>' +
      '    <button class="nav-toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false">' +
      '      <span></span><span></span><span></span>' +
      '    </button>' +
      '    <div class="nav-menu" id="navMenu">' + links + '</div>' +
      '  </nav>' +
      '</header>';

    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('navMenu');
    var nav = document.getElementById('nav');
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') nav.classList.remove('is-open');
    });
  };

  app.renderFooter = function () {
    var el = document.getElementById('footer');
    if (!el) return;
    el.innerHTML =
      '<footer class="site-footer">' +
      '  <span class="footer-brand">IEEE</span>' +
      '  <span class="footer-name">ITB Student Branch</span>' +
      '</footer>';
  };

  // ------------------------------ Toast ------------------------------------
  var toastRoot = null;
  function ensureToastRoot() {
    if (!toastRoot) {
      toastRoot = document.createElement('div');
      toastRoot.className = 'toast-root';
      document.body.appendChild(toastRoot);
    }
    return toastRoot;
  }

  app.toast = function (message, type) {
    var t = ensureToastRoot();
    var node = document.createElement('div');
    node.className = 'toast toast-' + (type || 'info');
    node.textContent = message;
    t.appendChild(node);
    requestAnimationFrame(function () { node.classList.add('is-visible'); });
    setTimeout(function () {
      node.classList.remove('is-visible');
      setTimeout(function () { node.remove(); }, 300);
    }, 3200);
  };

  // ------------------------- State placeholders -----------------------------
  app.stateBlock = function (type, title, message, retryFn) {
    var icon = { loading: '', empty: '\uD83D\uDCCB', error: '\u26A0\uFE0F', info: '\u2139\uFE0F' }[type] || '';
    var btn = retryFn
      ? '<button class="btn btn-ghost state-retry" type="button">Coba lagi</button>'
      : '';
    return (
      '<div class="state-block state-' + type + '" role="status">' +
      '  <div class="state-icon">' + icon + '</div>' +
      '  <h3 class="state-title">' + app.esc(title) + '</h3>' +
      (message ? '<p class="state-msg">' + app.esc(message) + '</p>' : '') +
      btn +
      '</div>'
    );
  };

  app.renderState = function (el, type, title, message, retryFn) {
    if (!el) return;
    el.innerHTML = app.stateBlock(type, title, message, retryFn);
    if (retryFn) {
      var btn = el.querySelector('.state-retry');
      if (btn) btn.addEventListener('click', retryFn);
    }
  };

  app.showLoading = function (el, message) {
    app.renderState(el, 'loading', message || 'Memuat data...');
  };

  // ------------------------------ Templates ---------------------------------
  app.eventCardHTML = function (ev, opts) {
    opts = opts || {};
    var loadAttr = opts.eager ? 'eager' : 'lazy';
    var img = ev.image_url
      ? '<img src="' + app.esc(ev.image_url) + '" alt="' + app.esc(ev.title) + '" loading="' + loadAttr + '" decoding="async" onerror="window.app.imageFallback(this)">'
      : '<div class="media-placeholder">IEEE</div>';
    var desc = app.esc(ev.description) || '';
    if (desc.length > 130) desc = desc.slice(0, 127) + '...';
    return (
      '<article class="event-card glass-card">' +
      '  <div class="card-media">' + img + '</div>' +
      '  <div class="card-body">' +
      '    <div class="card-meta">' + app.esc(app.formatDateTime(ev)) + '</div>' +
      '    <h3 class="card-title">' + app.esc(ev.title) + '</h3>' +
      '    <p class="card-desc">' + desc + '</p>' +
      '    <a class="card-link" href="event-detail.html?id=' + encodeURIComponent(ev.id) + '">See details</a>' +
      '  </div>' +
      '</article>'
    );
  };

  app.adminRowHTML = function (ev) {
    var thumb = ev.image_url
      ? '<img src="' + app.esc(ev.image_url) + '" alt="' + app.esc(ev.title) + '" loading="lazy" onerror="window.app.imageFallback(this)">'
      : '<div class="media-placeholder">IEEE</div>';
    return (
      '<li class="admin-item glass-card" data-id="' + app.esc(ev.id) + '">' +
      '  <div class="admin-thumb">' + thumb + '</div>' +
      '  <div class="admin-info">' +
      '    <h4 class="admin-title">' + app.esc(ev.title) + '</h4>' +
      '    <p class="admin-sub">' + app.esc(app.formatDateTime(ev)) + '</p>' +
      '    <p class="admin-sub">\uD83D\uDCCD ' + app.esc(ev.location) + '</p>' +
      '  </div>' +
      '  <div class="admin-actions">' +
      '    <button class="icon-btn icon-btn-delete" type="button" data-delete="' + app.esc(ev.id) + '" title="Delete event" aria-label="Delete ' + app.esc(ev.title) + '">' +
      '      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
      '        <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M9 7V4.5h6V7M6.5 7l.9 12.5h9.2L17.5 7M10 11l4 4M14 11l-4 4"/>' +
      '      </svg>' +
      '    </button>' +
      '    <a class="icon-btn" href="event-form.html?id=' + encodeURIComponent(ev.id) + '" title="Edit event" aria-label="Edit">' +
      '      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>' +
      '    </a>' +
      '    <a class="card-link" href="../event-detail.html?id=' + encodeURIComponent(ev.id) + '">See details</a>' +
      '  </div>' +
      '</li>'
    );
  };

  // ------------------------------ Carousel ----------------------------------
  // 2 cards per slide (1 on mobile), numbered circular pagination.
  app.renderCarouselZone = function (container, options) {
    // options: { data, title (unused), emptyTitle, emptyMsg, onError }
    if (!container) return;

    if (options.loading) {
      var sk = '';
      for (var i = 0; i < 2; i++) {
        sk += '<div class="car-slide"><div class="event-card glass-card is-skeleton">' +
              '<div class="card-media skeleton"></div>' +
              '<div class="card-body">' +
              '<div class="skeleton skeleton-line"></div>' +
              '<div class="skeleton skeleton-title"></div>' +
              '<div class="skeleton skeleton-line"></div>' +
              '<div class="skeleton skeleton-line short"></div>' +
              '</div></div></div>';
      }
      container.innerHTML =
        '<div class="car car-skeleton">' +
        '  <button class="car-btn" tabindex="-1" aria-hidden="true">\u2039</button>' +
        '  <div class="car-viewport"><div class="car-track">' + sk + '</div></div>' +
        '  <button class="car-btn" tabindex="-1" aria-hidden="true">\u203A</button>' +
        '</div>';
      return;
    }

    if (options.error) {
      app.renderState(container, 'error', 'Gagal memuat event', options.error, options.onRetry);
      return;
    }

    if (!options.data || options.data.length === 0) {
      app.renderState(container, 'empty', options.emptyTitle || 'Belum ada event',
        options.emptyMsg || 'Event akan tampil di sini setelah ditambahkan.');
      return;
    }

    var slides = options.data.map(function (ev) {
      return '<div class="car-slide">' + app.eventCardHTML(ev, { eager: options.eager }) + '</div>';
    }).join('');

    container.innerHTML =
      '<div class="car">' +
      '  <button class="car-btn" data-carousel-prev aria-label="Sebelumnya">\u2039</button>' +
      '  <div class="car-viewport">' +
      '    <div class="car-track" data-carousel-track>' + slides + '</div>' +
      '  </div>' +
      '  <button class="car-btn" data-carousel-next aria-label="Berikutnya">\u203A</button>' +
      '  <div class="car-pager" data-carousel-pager></div>' +
      '</div>';

    app.initCarousel(container);
  };

  app.initCarousel = function (root) {
    root = typeof root === 'string' ? document.getElementById(root) : root;
    var track = root.querySelector('[data-carousel-track]');
    var prev = root.querySelector('[data-carousel-prev]');
    var next = root.querySelector('[data-carousel-next]');
    var pager = root.querySelector('[data-carousel-pager]');
    if (!track || !prev || !next) return;

    var perView = 2;
    var index = 0;
    var count = 1;

    function measure() {
      perView = window.innerWidth < 768 ? 1 : 2;
      count = Math.max(1, Math.ceil(track.children.length / perView));
      if (index >= count) index = 0;
      render();
    }

    function buildPager() {
      if (!pager) return;
      var html = '';
      for (var i = 0; i < count; i++) {
        var active = i === index ? ' is-active' : '';
        html += '<button class="car-dot' + active + '" type="button" aria-label="Halaman ' + (i + 1) + '">' + (i + 1) + '</button>';
      }
      pager.innerHTML = html;
      Array.prototype.forEach.call(pager.children, function (dot, i) {
        dot.addEventListener('click', function () {
          index = i;
          render();
        });
      });
    }

    function render() {
      track.style.transform = 'translateX(-' + index * 100 + '%)';
      buildPager();
      prev.disabled = index === 0;
      next.disabled = count <= 1 || index === count - 1;
    }

    prev.addEventListener('click', function () {
      if (index > 0) { index--; render(); }
    });
    next.addEventListener('click', function () {
      if (index < count - 1) { index++; render(); }
    });

    window.addEventListener('resize', measure);
    measure();
  };

  // ------------------------ Page transitions (fade) ---------------------------
  var REDUCED_MOTION = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var TRANSITION_MS = 260;

  // Fade the page in after everything (fonts/images) finished loading.
  // The double requestAnimationFrame guarantees an opacity:0 frame is painted
  // first so the CSS transition actually animates instead of jumping to 1.
  window.addEventListener('load', function () {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.documentElement.classList.remove('page-fade');
      });
    });
  });

  // True when a link should use the fade transition: an internal relative
  // navigation to another .html page on the same origin.
  app.isSmoothLink = function (a) {
    var href = a.getAttribute('href');
    if (!href || a.hasAttribute('download')) return false;

    var target = (a.getAttribute('target') || '').toLowerCase();
    if (target && target !== '_self') return false;

    var rel = (a.getAttribute('rel') || '').split(/\s+/);
    if (rel.indexOf('external') !== -1) return false;

    if (a.origin && a.origin !== window.location.origin) return false;
    return /\.html(\?|#|$)/.test(href);
  };

  // Intercept internal link clicks: fade out first, then navigate.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (REDUCED_MOTION) return;
    if (document.documentElement.classList.contains('page-leaving')) return;

    var target = e.target;
    var link = target && target.closest ? target.closest('a[href]') : null;
    if (!link || !app.isSmoothLink(link)) return;

    var dest = link.href;
    e.preventDefault();
    document.documentElement.classList.add('page-leaving');
    setTimeout(function () {
      window.location.href = dest;
    }, TRANSITION_MS);
  });
})();