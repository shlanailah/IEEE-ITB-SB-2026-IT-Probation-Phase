-- ============================================================================
-- Supabase Storage set-up for event images
-- RUN ONCE, AFTER supabase/schema.sql, in the Supabase SQL Editor (postgres role).
-- Creates a public bucket "event-images" plus policies so that:
--   - anyone can READ stored images (public URLs),
--   - only authenticated admins (public.is_admin()) can INSERT/UPDATE/DELETE.
-- NOTE: CREATE POLICY cannot use IF NOT EXISTS, so do not re-run blindly;
-- drop the policies first if you ever need to rebuild.
-- ============================================================================

-- Bucket for event covers (public so <img src> works without auth headers).
insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

-- Public read of any object in the bucket.
create policy "event_images_public_read" on storage.objects
    for select using (bucket_id = 'event-images');

-- Only admins may upload new images.
create policy "event_images_admin_insert" on storage.objects
    for insert with check (bucket_id = 'event-images' and public.is_admin());

-- Only admins may update/overwrite existing images.
create policy "event_images_admin_update" on storage.objects
    for update using (bucket_id = 'event-images' and public.is_admin());

-- Only admins may delete images.
create policy "event_images_admin_delete" on storage.objects
    for delete using (bucket_id = 'event-images' and public.is_admin());