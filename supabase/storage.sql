-- Create avatars bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set public = true;

-- Storage RLS policies
drop policy if exists "avatars_public_read"   on storage.objects;
drop policy if exists "avatars_auth_upload"   on storage.objects;
drop policy if exists "avatars_auth_update"   on storage.objects;
drop policy if exists "avatars_auth_delete"   on storage.objects;

create policy "avatars_public_read"
  on storage.objects for select to public
  using (bucket_id = 'avatars');

create policy "avatars_auth_upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_auth_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_auth_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
