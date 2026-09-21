//Supabase client wrapper (auth + events CRUD)

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
      return 'Supabase is not configured. Fill in the URL & anon key in js/config.js.';
    }
    if (/invalid login credentials/i.test(error.message)) {
      return 'Incorrect email or password.';
    }
    if (/email.*not confirmed/i.test(error.message)) {
      return 'Email not confirmed. Please check your inbox.';
    }
    if (/row-level security/i.test(error.message)) {
      return 'You do not have permission to perform this operation.';
    }
    if (/new row violates/i.test(error.message)) {
      return 'Invalid data: please check your input.';
    }
    if (/network|fetch|load failed/i.test(error.message)) {
      return 'Failed to connect to the server. Please check your internet connection.';
    }
    if (/JWT|auth/i.test(error.message)) {
      return 'Your session is invalid. Please log in again.';
    }
    return error.message || 'Something went wrong.';
  }

  //AUTH
  app.getSession = async function () {
    try {
      var res = await client().auth.getSession();
      return res.data.session || null;
    } catch (e) {
      return null;
    }
  };

  //STORAGE SQL (upload image)
  app.uploadEventImage = async function (file, eventId) {
    try {
      var sb = client();
      var safeExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      var fileName = (eventId || 'event') + '-' + Date.now() + '.' + safeExt;

      var res = await sb.storage.from('event-images').upload(fileName, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      });
      if (res.error) {
        if (/storage|bucket|policy|permission/i.test(res.error.message)) {
          return { error: 'Upload failed: storage bucket/policy is not set up. Run supabase/storage.sql in the SQL Editor' };
        }
        return { error: 'Image upload failed: ' + friendlyError(res.error) };
      }
      var url = sb.storage.from('event-images').getPublicUrl(res.data.path).data.publicUrl;
      return { url: url };
    } catch (e) {
      return { error: 'Image upload failed: ' + (e && e.message ? e.message : 'an unexpected error occurred') };
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

  //Guard used on protected admin pages: redirect to login when signed out.
  app.requireAdmin = async function (redirectTo) {
    var session = await app.getSession();
    if (!session) {
      window.location.replace(redirectTo || 'login.html');
      return null;
    }
    return session;
  };

  //EVENTS DATABASE
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

  app.validateEvent = function (ev) {
    if (!ev.title || !ev.title.trim()) return { error: 'Event name is required' };
    if (!ev.description || ev.description.trim().length < 10) {
      return { error: 'Description must be at least 10 characters' };
    }
    if (!ev.date) return { error: 'Date is required' };
    if (!ev.time) return { error: 'Time is required' };
    if (!ev.location || !ev.location.trim()) return { error: 'Place is required' };
    if (!ev.status || ['upcoming', 'ongoing', 'past'].indexOf(ev.status) === -1) {
      return { error: 'Status is invalid' };
    }
    return { error: null };
  };
})();