// ============================================================================
// PAGE: Admin Dashboard
// ============================================================================
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    app.requireAdmin('login.html').then(function (session) {
      if (session) {
        showFlashToast();
        init();
      }
    });
  });

  function showFlashToast() {
    var msg = sessionStorage.getItem('appToast');
    if (msg) {
      sessionStorage.removeItem('appToast');
      var parts = msg.split('|');
      app.toast(parts[0], parts[1] || 'success');
    }
  }

  function init() {
    document.getElementById('logoutBtn').addEventListener('click', function () {
      app.signOut().then(function () {
        window.location.replace('login.html');
      });
    });

    var listEl = document.getElementById('eventList');
    var statsEl = document.getElementById('statsZone');
    var allEvents = [];
    var currentFilter = 'all';
    var checkedIds = {};

    var tabBtns = Array.prototype.slice.call(document.querySelectorAll('#filterTabs .tab'));
    var selectionBar = document.getElementById('selectionBar');
    var selectionCount = document.getElementById('selectionCount');
    var deleteModal = document.getElementById('deleteModal');

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        currentFilter = btn.getAttribute('data-filter');
        renderList();
      });
    });

    document.getElementById('clearSelectionBtn').addEventListener('click', function () {
      checkedIds = {};
      renderList();
    });

    document.getElementById('modalNo').addEventListener('click', closeModal);
    deleteModal.addEventListener('click', function (e) {
      if (e.target === deleteModal) closeModal();
    });

    document.getElementById('modalYes').addEventListener('click', confirmDelete);

    loadEvents();

    function loadEvents() {
      app.renderState(listEl, 'loading', 'Memuat data...');
      app.listEvents('all').then(function (res) {
        if (res.error) {
          app.renderState(listEl, 'error', 'Gagal memuat data', res.error, loadEvents);
          return;
        }
        allEvents = res.data || [];
        renderStats();
        renderList();
      });
    }

    function renderStats() {
      var upcoming = allEvents.filter(function (e) { return e.status === 'upcoming' || e.status === 'ongoing'; }).length;
      var success = allEvents.filter(function (e) { return e.status === 'past'; }).length;
      setStat(0, allEvents.length);
      setStat(1, upcoming);
      setStat(2, success);
    }

    function setStat(index, value) {
      var card = statsEl.children[index];
      if (card) card.querySelector('.stat-value').textContent = value;
    }

    function filtered() {
      if (currentFilter === 'upcoming') {
        return allEvents.filter(function (e) { return e.status === 'upcoming' || e.status === 'ongoing'; });
      }
      if (currentFilter === 'past') {
        return allEvents.filter(function (e) { return e.status === 'past'; });
      }
      return allEvents;
    }

    function renderList() {
      var rows = filtered();

      if (rows.length === 0) {
        app.renderState(listEl, 'empty', 'Tidak ada event',
          currentFilter === 'all' ? 'Klik "+ Add new event" untuk membuat event pertama.'
                                   : 'Tidak ada event dengan filter ini.');
        return;
      }

      listEl.innerHTML = rows.map(function (ev) {
        return app.adminRowHTML(ev)
          .replace('<input type="checkbox" class="row-check"',
            '<input type="checkbox" class="row-check" ' + (checkedIds[ev.id] ? 'checked' : ''));
      }).join('');

      bindChecks();
      updateSelectionBar();
    }

    function bindChecks() {
      var checks = listEl.querySelectorAll('.row-check');
      checks.forEach(function (checkbox) {
        checkbox.addEventListener('change', function () {
          var row = checkbox.closest('.admin-item');
          var id = row.getAttribute('data-id');
          if (checkbox.checked) checkedIds[id] = true;
          else delete checkedIds[id];
          updateSelectionBar();
        });
      });
    }

    function updateSelectionBar() {
      var ids = Object.keys(checkedIds);
      selectionBar.classList.toggle('show', ids.length > 0);
      selectionCount.textContent = ids.length + (ids.length === 1 ? ' event selected' : ' events selected');
    }

    function openModal() {
      deleteModal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      deleteModal.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    function confirmDelete() {
      var ids = Object.keys(checkedIds);
      if (ids.length === 0) {
        closeModal();
        return;
      }

      var label = document.getElementById('modalTitle');
      var p = deleteModal.querySelector('p');
      label.textContent = 'Deleting...';
      p.textContent = 'Please wait a moment.';
      document.getElementById('modalYes').disabled = true;

      app.deleteEvents(ids).then(function (res) {
        document.getElementById('modalYes').disabled = false;
        closeModal();
        if (res.error) {
          app.toast(res.error, 'error');
          return;
        }
        app.toast(ids.length === 1 ? 'Event deleted.' : ids.length + ' events deleted.', 'success');
        checkedIds = {};
        loadEvents();
      });
    }

    document.getElementById('deleteSelectedBtn').addEventListener('click', function () {
      if (Object.keys(checkedIds).length === 0) {
        app.toast('Pilih setidaknya satu event terlebih dahulu.', 'info');
        return;
      }
      openModal();
    });
  }
})();