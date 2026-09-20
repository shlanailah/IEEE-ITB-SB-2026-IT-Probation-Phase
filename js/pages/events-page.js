// ============================================================================
// PAGE: User Events (list)
// ============================================================================
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    app.renderNavbar('events');
    app.renderFooter();

    var upZone = document.getElementById('upcomingZone');
    var pastZone = document.getElementById('pastZone');

    loadUpcoming();
    loadPast();

    function loadUpcoming() {
      app.renderCarouselZone(upZone, { loading: true });
      app.listEvents('upcoming')
        .then(function (res) {
          if (res.error) {
            app.renderCarouselZone(upZone, { error: res.error, onRetry: loadUpcoming });
            return;
          }
          app.renderCarouselZone(upZone, {
            data: res.data,
            emptyTitle: 'Belum ada event mendatang',
            emptyMsg: 'Event akan tampil di sini setelah ditambahkan oleh admin.'
          });
        });
    }

    function loadPast() {
      app.renderCarouselZone(pastZone, { loading: true });
      app.listEvents('past')
        .then(function (res) {
          if (res.error) {
            app.renderCarouselZone(pastZone, { error: res.error, onRetry: loadPast });
            return;
          }
          app.renderCarouselZone(pastZone, {
            data: res.data,
            emptyTitle: 'Belum ada event yang selesai',
            emptyMsg: 'Event yang sudah selesai akan tampil di sini.'
          });
        });
    }
  });
})();