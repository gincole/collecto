begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(4);

insert into auth.users (id, email) values
  ('70000000-0000-4000-8000-000000000001', 'images-a@example.invalid'),
  ('70000000-0000-4000-8000-000000000002', 'images-b@example.invalid');
insert into public.collections (id, owner_id, name, preset_key) values
  ('71000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 'Images', 'blank');
insert into public.items (id, collection_id, title) values
  ('72000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000001', 'Item');

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000001', true);
set local role authenticated;

select extensions.is(
  (public.set_item_image_path(
    '71000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000001/71000000-0000-4000-8000-000000000001/72000000-0000-4000-8000-000000000001/73000000-0000-4000-8000-000000000001.png'
  ) ->> 'old_path')::text,
  null::text,
  'an owner can attach a generated scoped path'
);
select extensions.is(
  (public.set_item_image_path(
    '71000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000001/71000000-0000-4000-8000-000000000001/72000000-0000-4000-8000-000000000001/73000000-0000-4000-8000-000000000002.webp'
  ) ->> 'old_path')::text,
  '70000000-0000-4000-8000-000000000001/71000000-0000-4000-8000-000000000001/72000000-0000-4000-8000-000000000001/73000000-0000-4000-8000-000000000001.png',
  'replacement atomically returns the old path'
);
reset role;
select extensions.is(
  (select count(*)::integer from public.storage_cleanup_jobs where status = 'pending'
    and owner_id = '70000000-0000-4000-8000-000000000001'),
  1,
  'replacement durably queues the old object for cleanup'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000002', true);
select extensions.is(
  public.set_item_image_path(
    '71000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001',
    null
  ),
  null::jsonb,
  'another user cannot clear the image path'
);

select * from extensions.finish();
rollback;
