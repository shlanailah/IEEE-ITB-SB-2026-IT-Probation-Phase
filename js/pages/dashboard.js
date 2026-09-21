(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    app.renderFooter();
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

    var tabBtns = Array.prototype.slice.call(document.querySelectorAll('#filterTabs .tab'));
    var deleteModal = document.getElementById('deleteModal');
    var pendingDeleteId = null;

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        currentFilter = btn.getAttribute('data-filter');
        renderList();
      });
    });

    document.getElementById('modalNo').addEventListener('click', closeModal);
    deleteModal.addEventListener('click', function (e) {
      if (e.target === deleteModal) closeModal();
    });

    document.getElementById('modalYes').addEventListener('click', confirmDelete);

    loadEvents();

    function loadEvents() {
      app.renderState(listEl, 'loading', 'Loading data...');
      app.listEvents('all').then(function (res) {
        if (res.error) {
          app.renderState(listEl, 'error', 'Failed to load data', res.error, loadEvents);
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
        app.renderState(listEl, 'empty', 'No events',
          currentFilter === 'all' ? 'Click "+ Add new event" to create your first event.'
                                   : 'No events match this filter.');
        return;
      }

      listEl.innerHTML = rows.map(function (ev) {
        return app.adminRowHTML(ev);
      }).join('');

      bindDelete();
    }

    function bindDelete() {
      var btns = listEl.querySelectorAll('[data-delete]');
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          pendingDeleteId = btn.getAttribute('data-delete');
          openModal();
        });
      });
    }

    function openModal() {
      document.getElementById('modalTitle').textContent = 'Delete event?';
      var p = deleteModal.querySelector('p');
      p.textContent = 'Are you sure you want to delete this event? This action cannot be undone.';
      document.getElementById('modalYes').disabled = false;
      deleteModal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      deleteModal.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    function confirmDelete() {
      if (!pendingDeleteId) {
        closeModal();
        return;
      }

      var label = document.getElementById('modalTitle');
      var p = deleteModal.querySelector('p');
      label.textContent = 'Deleting...';
      p.textContent = 'Please wait a moment.';
      document.getElementById('modalYes').disabled = true;

      app.deleteEvents([pendingDeleteId]).then(function (res) {
        document.getElementById('modalYes').disabled = false;
        closeModal();
        pendingDeleteId = null;
        if (res.error) {
          app.toast(res.error, 'error');
          return;
        }
        app.toast('Event deleted.');
        loadEvents();
      });
    }
  }
})();