// ============================================================================
// PAGE: User Events (list)
// - Client-side search (name / place / description)
// - Status filter tabs: All / Upcoming / Past
// - Pagination (PER_PAGE cards per page)
// Reuses the shared data layer (app.listEvents) + card template
// (app.eventCardHTML) so the UI stays consistent everywhere.
// ============================================================================
(function () {
  'use strict';

  var PER_PAGE = 8;

  document.addEventListener('DOMContentLoaded', function () {
    app.renderNavbar('events');
    app.renderFooter();

    var zone = document.getElementById('eventsZone');
    var pagerEl = document.getElementById('pagination');
    var searchInput = document.getElementById('searchInput');
    var tabBtns = Array.prototype.slice.call(document.querySelectorAll('#filterTabs .tab'));

    var allEvents = [];
    var query = '';
    var filter = 'all';
    var page = 1;
    var searchTimer = null;

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        filter = btn.getAttribute('data-filter');
        page = 1;
        render();
      });
    });

    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        query = searchInput.value.trim().toLowerCase();
        page = 1;
        render();
      }, 250);
    });

    loadEvents();

    function loadEvents() {
      app.renderState(zone, 'loading', 'Memuat event...');
      app.listEvents('all').then(function (res) {
        if (res.error) {
          app.renderState(zone, 'error', 'Gagal memuat event', res.error, loadEvents);
          return;
        }
        allEvents = res.data || [];
        page = 1;
        render();
      });
    }

    function matchesFilter(ev) {
      if (filter === 'upcoming') return ev.status === 'upcoming' || ev.status === 'ongoing';
      if (filter === 'past') return ev.status === 'past';
      return true;
    }

    function matchesQuery(ev) {
      if (!query) return true;
      return (ev.title || '').toLowerCase().indexOf(query) !== -1 ||
             (ev.location || '').toLowerCase().indexOf(query) !== -1 ||
             (ev.description || '').toLowerCase().indexOf(query) !== -1;
    }

    function filteredEvents() {
      return allEvents.filter(function (ev) {
        return matchesFilter(ev) && matchesQuery(ev);
      });
    }

    function render() {
      var list = filteredEvents();
      var count = list.length;
      var pages = Math.max(1, Math.ceil(count / PER_PAGE));
      if (page > pages) page = pages;

      if (count === 0) {
        pagerEl.innerHTML = '';
        if (!allEvents.length) {
          app.renderState(zone, 'empty', 'Belum ada event',
            'Event akan tampil di sini setelah ditambahkan oleh admin.');
          return;
        }
        app.renderState(zone, 'empty', 'Tidak ada event yang cocok',
          'Coba ubah kata kunci pencarian atau filter kamu.');
        return;
      }

      var start = (page - 1) * PER_PAGE;
      var slice = list.slice(start, start + PER_PAGE);

      zone.innerHTML = slice.map(function (ev) {
        return app.eventCardHTML(ev, { eager: page === 1 });
      }).join('');

      renderPager(page, pages);
    }

    function renderPager(currentPage, totalPages) {
      if (totalPages <= 1) {
        pagerEl.innerHTML = '';
        return;
      }

      var prev = currentPage > 1
        ? '<button class="page-btn" type="button" data-page="' + (currentPage - 1) + '" aria-label="Previous page">\u2039</button>'
        : '<button class="page-btn" type="button" disabled aria-label="Previous page">\u2039</button>';

      var next = currentPage < totalPages
        ? '<button class="page-btn" type="button" data-page="' + (currentPage + 1) + '" aria-label="Next page">\u203A</button>'
        : '<button class="page-btn" type="button" disabled aria-label="Next page">\u203A</button>';

      var dots = '';
      for (var i = 1; i <= totalPages; i++) {
        var active = i === currentPage ? ' is-active' : '';
        dots += '<button class="page-btn' + active + '" type="button" data-page="' + i +
                '" aria-label="Page ' + i + '">' + i + '</button>';
      }

      pagerEl.innerHTML =
        '<div class="page-group">' + prev + dots + next + '</div>' +
        '<span class="page-info">' + currentPage + ' / ' + totalPages + '</span>';

      Array.prototype.forEach.call(pagerEl.querySelectorAll('[data-page]'), function (btn) {
        btn.addEventListener('click', function () {
          page = parseInt(btn.getAttribute('data-page'), 10);
          render();
          zone.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }
  });
})();