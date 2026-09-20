// ============================================================================
// DATA LAYER — Supabase client wrapper (auth + events CRUD)
// Exposes everything on window.app
// ============================================================================
(function () {
  'use strict';

  var app = window.app = window.app || {};

  function client() {
    if (!window.supabaseConfigured()) {
      throw new Error('Cfg');
    }
    if (!window.__sb) {
      window.__sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    }
    return window.__sb;
  }

  function friendlyError(error) {
    if (!error) return null;
    if (error.message === 'Cfg') {
      return 'Supabase belum dikonfigurasi. Isi URL & anon key di js/config.js.';
    }
    if (/invalid login credentials/i.test(error.message)) {
      return 'Email atau password salah.';
    }
    if (/email.*not confirmed/i.test(error.message)) {
      return 'Email belum dikonfirmasi. Cek inbox email kamu.';
    }
    if (/row-level security/i.test(error.message)) {
      return 'Kamu tidak punya izin untuk melakukan operasi ini.';
    }
    if (/new row violates/i.test(error.message)) {
      return 'Data tidak valid: periksa kembali input kamu.';
    }
    if (/network|fetch|load failed/i.test(error.message)) {
      return 'Gagal terhubung ke server. Periksa koneksi internet.';
    }
    if (/JWT|auth/i.test(error.message)) {
      return 'Sesi login bermasalah. Silakan login ulang.';
    }
    return error.message || 'Terjadi kesalahan.';
  }

  // ------------------------------- AUTH -----------------------------------
  app.getSession = async function () {
    try {
      var res = await client().auth.getSession();
      return res.data.session || null;
    } catch (e) {
      return null;
    }
  };

  app.signIn = async function (email, password) {
    try {
      var res = await client().auth.signInWithPassword({ email: email, password: password });
      if (res.error) return { error: friendlyError(res.error) };
      return { session: res.data.session };
    } catch (e) {
      return { error: friendlyError(e) };
    }
  };

  app.signOut = async function () {
    try {
      await client().auth.signOut();
    } catch (e) { /* ignore */ }
  };

  app.getProfile = async function (userId) {
    try {
      var res = await client()
        .from('profiles')
        .select('id, username, role')
        .eq('id', userId)
        .maybeSingle();
      if (res.error) return { error: friendlyError(res.error) };
      return { data: res.data };
    } catch (e) {
      return { error: friendlyError(e) };
    }
  };

  app.getCurrentProfile = async function () {
    var session = await app.getSession();
    if (!session) return { error: 'Not signed in.' };
    return await app.getProfile(session.user.id);
  };

  // Guard used on protected admin pages: redirect to login when signed out.
  app.requireAdmin = async function (redirectTo) {
    var session = await app.getSession();
    if (!session) {
      window.location.replace(redirectTo || 'login.html');
      return null;
    }
    return session;
  };

  // ------------------------------- EVENTS ----------------------------------
  app.listEvents = async function (statusFilter) {
    // statusFilter: undefined/"all" | "upcoming" | "past"
    try {
      var q = client().from('events').select('*');
      if (statusFilter === 'upcoming') {
        q = q.in('status', ['upcoming', 'ongoing']);
      } else if (statusFilter === 'past') {
        q = q.eq('status', 'past');
      }
      q = q.order('date', { ascending: true }).order('time', { ascending: true });
      var res = await q;
      if (res.error) return { error: friendlyError(res.error) };
      return { data: res.data };
    } catch (e) {
      return { error: friendlyError(e) };
    }
  };

  app.getEvent = async function (id) {
    try {
      var res = await client()
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (res.error) return { error: friendlyError(res.error) };
      return { data: res.data };
    } catch (e) {
      return { error: friendlyError(e) };
    }
  };

  app.createEvent = async function (payload) {
    try {
      var res = await client().from('events').insert(payload).select().single();
      if (res.error) return { error: friendlyError(res.error) };
      return { data: res.data };
    } catch (e) {
      return { error: friendlyError(e) };
    }
  };

  app.updateEvent = async function (id, payload) {
    try {
      var res = await client()
        .from('events')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (res.error) return { error: friendlyError(res.error) };
      return { data: res.data };
    } catch (e) {
      return { error: friendlyError(e) };
    }
  };

  app.deleteEvents = async function (ids) {
    try {
      var res = await client().from('events').delete().in('id', ids);
      if (res.error) return { error: friendlyError(res.error) };
      return { data: res.data };
    } catch (e) {
      return { error: friendlyError(e) };
    }
  };

  // Orchestrates validation -> persistence so a single call handles
  // create vs update transparently. Returns { data, error }.
  app.saveEvent = async function (event) {
    var payload = {
      title: event.title.trim(),
      description: event.description.trim(),
      date: event.date,
      time: event.time,
      location: event.location.trim(),
      status: event.status,
      image_url: event.image_url ? event.image_url.trim() : null
    };

    var validation = app.validateEvent(payload);
    if (validation.error) return { error: validation.error };

    if (event.id) return await app.updateEvent(event.id, payload);
    return await app.createEvent(payload);
  };

  // Shared client-side validation (mirrors the DB constraints / check rules).
  app.validateEvent = function (ev) {
    if (!ev.title || !ev.title.trim()) return { error: 'Event name wajib diisi.' };
    if (!ev.description || ev.description.trim().length < 10) {
      return { error: 'Description minimal 10 karakter.' };
    }
    if (!ev.date) return { error: 'Date wajib diisi.' };
    if (!ev.time) return { error: 'Time wajib diisi.' };
    if (!ev.location || !ev.location.trim()) return { error: 'Place wajib diisi.' };
    if (!ev.status || ['upcoming', 'ongoing', 'past'].indexOf(ev.status) === -1) {
      return { error: 'Status tidak valid.' };
    }
    return { error: null };
  };
})();