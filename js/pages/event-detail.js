// ============================================================================
// PAGE: User Event Detail
// ============================================================================
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    app.renderNavbar('events');
    app.renderFooter();

    var zone = document.getElementById('detailZone');
    var titleEl = document.getElementById('detailTitle');
    var id = app.getParam('id');

    var backBtn = document.getElementById('backBtn');
    if (backBtn) {
      var isAdmin = app.getParam('from') === 'admin';
      backBtn.href = isAdmin ? '../admin/dashboard.html' : 'events.html';
      backBtn.setAttribute('aria-label', isAdmin ? 'Kembali ke dashboard' : 'Kembali ke daftar event');
    }

    if (!id) {
      titleEl.textContent = 'Event tidak ditemukan';
      app.renderState(zone, 'empty', 'Event tidak ditemukan',
        'Tidak ada ID event. Coba buka dari daftar event.',
        function () { window.location.href = 'events.html'; });
      return;
    }

    loadEvent();

    function loadEvent() {
      app.showLoading(zone, 'Memuat detail event...');
      app.getEvent(id).then(function (res) {
        if (res.error) {
          titleEl.textContent = 'Gagal memuat event';
          app.renderState(zone, 'error', 'Gagal memuat event', res.error, loadEvent);
          return;
        }
        var ev = res.data;
        if (!ev) {
          titleEl.textContent = 'Event tidak ditemukan';
          app.renderState(zone, 'empty', 'Event tidak ditemukan',
            'Event mungkin telah dihapus.',
            function () { window.location.href = 'events.html'; });
          return;
        }
        titleEl.textContent = ev.title;

        var media = ev.image_url
          ? '<img src="' + app.esc(ev.image_url) + '" alt="' + app.esc(ev.title) + '" onerror="window.app.imageFallback(this)">'
          : '<div class="media-placeholder">IEEE</div>';

        var rows =
          detailRow('Date', app.formatDate(ev.date)) +
          detailRow('Time', app.formatTime(ev.time) + ' WIB') +
          detailRow('Place', ev.location) +
          detailRow('Description', ev.description);

        zone.innerHTML =
          '<div class="detail-card glass-card">' +
          '  <div class="detail-media">' + media + '</div>' +
          '  <div class="detail-body">' + rows + '</div>' +
          '</div>';
      });
    }

    function detailRow(label, value) {
      return '<div class="detail-row">' +
             '<span class="detail-label">' + app.esc(label) + '</span>' +
             '<span class="detail-value">' + app.esc(value) + '</span>' +
             '</div>';
    }
  });
})();