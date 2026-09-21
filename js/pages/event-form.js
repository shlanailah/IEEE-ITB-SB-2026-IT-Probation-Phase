(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    app.renderFooter();
    app.requireAdmin('login.html').then(function (session) {
      if (session) init();
    });
  });

  function init() {
    var form = document.getElementById('eventForm');
    var submitBtn = document.getElementById('submitBtn');
    var formTitle = document.getElementById('formTitle');
    var editId = app.getParam('id');

    var fileInput = document.getElementById('image_file');
    var fileError = document.getElementById('errImageFile');
    var preview = document.getElementById('imagePreview');
    var dateInput = document.getElementById('date');
    var statusSelect = document.getElementById('status');

    if (editId) {
      formTitle.textContent = 'Edit event';
      submitBtn.textContent = 'Save changes';
      form.classList.add('is-hidden');
      loadEvent(editId);
    }

    fileInput.addEventListener('change', function () {
      clearFileError();
      var file = fileInput.files && fileInput.files[0];
      if (!file) {
        preview.innerHTML = '';
        return;
      }
      preview.innerHTML = '<img src="' + URL.createObjectURL(file) + '" alt="Pratinjau gambar">';
    });

    dateInput.addEventListener('change', function () {
      var s = statusFromDate(dateInput.value);
      if (s) statusSelect.value = s;
    });

    bindClear('title', 'errTitle');
    bindClear('date', 'errDate');
    bindClear('time', 'errTime');
    bindClear('location', 'errLocation');
    bindClear('status', 'errStatus');
    bindClear('image_url', 'errImage');
    bindClear('description', 'errDescription');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var values = readValues();
      var validation = app.validateEvent(values);
      var anyShown = showFieldErrors(values);
      if (validation.error || anyShown) return;

      var file = fileInput.files && fileInput.files[0];
      if (file) persistWithUpload(values, file);
      else persist(values);
    });

    function persistWithUpload(values, file) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Uploading...';
      app.uploadEventImage(file, editId || 'event').then(function (res) {
        if (res.error) {
          submitBtn.disabled = false;
          submitBtn.textContent = editId ? 'Save changes' : 'Add event';
          markFileError(res.error);
          return;
        }
        values.image_url = res.url;
        persist(values);
      });
    }

    function persist(values) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Saving...';

      values.id = editId || null;
      app.saveEvent(values).then(function (res) {
        submitBtn.disabled = false;
        submitBtn.textContent = editId ? 'Save changes' : 'Add event';
        if (res.error) {
          app.toast(res.error, 'error');
          return;
        }
        sessionStorage.setItem('appToast', (editId ? 'Event updated.' : 'Event added.') + '|info');
        window.location.replace('dashboard.html');
      });
    }

    function markFileError(msg) {
      fileError.textContent = msg || 'Something went wrong while uploading the image';
      fileError.classList.add('show');
      fileInput.classList.add('has-error');
    }

    function clearFileError() {
      fileError.classList.remove('show');
      fileInput.classList.remove('has-error');
    }

    function loadEvent(id) {
      var loadingZone = document.getElementById('formLoading');
      app.showLoading(loadingZone, 'Load event...');
      app.getEvent(id).then(function (res) {
        if (res.error || !res.data) {
          loadingZone.innerHTML =
            app.stateBlock('error', 'Failed to load event', res.error || 'Event not found.',
              function () { window.location.replace('dashboard.html'); });
          return;
        }
        loadingZone.innerHTML = '';
        form.classList.remove('is-hidden');
        fillForm(res.data);
      });
    }

    function fillForm(ev) {
      document.getElementById('title').value = ev.title || '';
      document.getElementById('date').value = ev.date || '';
      document.getElementById('time').value = (ev.time || '').slice(0, 5);
      document.getElementById('location').value = ev.location || '';
      statusSelect.value = statusFromDate(ev.date || '') || ev.status || 'upcoming';
      document.getElementById('image_url').value = ev.image_url || '';
      document.getElementById('description').value = ev.description || '';
      fileInput.value = '';
      clearFileError();
      preview.innerHTML = '';
    }

    function toISODate(d) {
      var m = d.getMonth() + 1;
      var day = d.getDate();
      return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
    }

    function statusFromDate(dateStr) {
      if (!dateStr) return null;
      var today = toISODate(new Date());
      if (dateStr < today) return 'past';
      if (dateStr === today) return 'ongoing';
      return 'upcoming';
    }

    function readValues() {
      return {
        title: document.getElementById('title').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        location: document.getElementById('location').value,
        status: document.getElementById('status').value,
        image_url: document.getElementById('image_url').value,
        description: document.getElementById('description').value
      };
    }

    function showFieldErrors(v) {
      var anyShown = false;

      function check(cond, inputId, errId) {
        var input = document.getElementById(inputId);
        var err = document.getElementById(errId);
        var bad = !cond;
        input.classList.toggle('has-error', bad);
        err.classList.toggle('show', bad);
        if (bad) anyShown = true;
      }

      check(v.title && v.title.trim().length > 0, 'title', 'errTitle');
      check(!!v.date, 'date', 'errDate');
      check(!!v.time, 'time', 'errTime');
      check(v.location && v.location.trim().length > 0, 'location', 'errLocation');
      check(['upcoming', 'ongoing', 'past'].indexOf(v.status) !== -1, 'status', 'errStatus');
      check(!v.image_url || /^https?:\/\/.+/.test(v.image_url.trim()), 'image_url', 'errImage');
      check(v.description && v.description.trim().length >= 10, 'description', 'errDescription');
      return anyShown;
    }

    function bindClear(inputId, errId) {
      var input = document.getElementById(inputId);
      input.addEventListener('input', function () {
        input.classList.remove('has-error');
        document.getElementById(errId).classList.remove('show');
      });
    }
  }
})();