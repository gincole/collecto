insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'item-images',
  'item-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "owners can read their item images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'item-images'
  and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.collections
    where collections.id::text = (storage.foldername(storage.objects.name))[2]
      and collections.owner_id = (select auth.uid())
  )
);

create policy "owners can upload their item images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'item-images'
  and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.collections
    where collections.id::text = (storage.foldername(storage.objects.name))[2]
      and collections.owner_id = (select auth.uid())
  )
);

create policy "owners can replace their item images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'item-images'
  and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.collections
    where collections.id::text = (storage.foldername(storage.objects.name))[2]
      and collections.owner_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'item-images'
  and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.collections
    where collections.id::text = (storage.foldername(storage.objects.name))[2]
      and collections.owner_id = (select auth.uid())
  )
);

create policy "owners can delete their item images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'item-images'
  and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.collections
    where collections.id::text = (storage.foldername(storage.objects.name))[2]
      and collections.owner_id = (select auth.uid())
  )
);
