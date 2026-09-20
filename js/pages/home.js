// ============================================================================
// PAGE: User Home
// - Shows cached events instantly when available, then silently refreshes.
// - First paint shows a clean shimmer skeleton, never an empty container.
// ============================================================================
(function () {
  'use strict';

  var CACHE_KEY = 'ieee_home_upcoming';
  var CACHE_AGE = 5 * 60 * 1000;

  document.addEventListener('DOMContentLoaded', function () {
    app.renderNavbar('home');
    app.renderFooter();

    var zone = document.getElementById('homeCarousel');
    if (!zone) return;

    var cached = app.cacheGet(CACHE_KEY, CACHE_AGE);
    if (cached && cached.length) {
      app.renderCarouselZone(zone, { data: cached, eager: true });
    } else {
      app.renderCarouselZone(zone, { loading: true });
    }
    fetchUpcoming();
  });

  function fetchUpcoming() {
    var zone = document.getElementById('homeCarousel');
    app.listEvents('upcoming').then(function (res) {
      if (res.error) {
        // Only replace the screen when there is nothing cached to fall back on.
        if (!app.cacheGet(CACHE_KEY, CACHE_AGE)) {
          app.renderCarouselZone(zone, {
            error: res.error,
            emptyTitle: 'Gagal memuat event',
            onRetry: fetchUpcoming
          });
        }
        return;
      }
      app.cacheSet(CACHE_KEY, res.data);
      app.renderCarouselZone(zone, { data: res.data, eager: true });
    });
  }
})();