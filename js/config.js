// ============================================================================
// SUPABASE CONFIGURATION
// ============================================================================
// 1. Create a (free) project at https://supabase.com
// 2. In your project: SQL Editor -> run supabase/schema.sql, then seed.sql
// 3. Open Project Settings -> API (or "Connect" button)
// 4. Copy the Project URL and the anon/public key into the constants below.
// 5. Create your admin account:
//    - Authentication -> Users -> Add user (email + password)
//    - Then in SQL Editor run:
//        insert into public.profiles (id, username, role)
//        select id, 'admin', 'admin' from auth.users limit 1;
//      (run once per admin user you create)
// ============================================================================

window.SUPABASE_URL = 'https://zrqcuhmfpypygdtfrjou.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_LjLW5MpjPwJD8oEY0OljxA_VI8GYMF9';

// Set to true only after the values above are filled in.
window.supabaseConfigured = function () {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return false;
  if (window.SUPABASE_URL.indexOf('PASTE') !== -1) return false;
  if (window.SUPABASE_ANON_KEY.indexOf('PASTE') !== -1) return false;
  return true;
};