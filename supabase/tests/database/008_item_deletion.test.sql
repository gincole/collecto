begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(4);

insert into auth.users (id, email) values
  ('80000000-0000-4000-8000-000000000001', 'delete-a@example.invalid'),
  ('80000000-0000-4000-8000-000000000002', 'delete-b@example.invalid');
insert into public.collections (id, owner_id, name, preset_key) values
  ('81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000001', 'Owned', 'blank');
insert into public.items (id, collection_id, title, image_path) values
  (
    '82000000-0000-4000-8000-000000000001',
    '81000000-0000-4000-8000-000000000001',
    'With image',
    '80000000-0000-4000-8000-000000000001/81000000-0000-4000-8000-000000000001/82000000-0000-4000-8000-000000000001/83000000-0000-4000-8000-000000000001.webp'
  ),
  ('82000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000001', 'No image', null);

select set_config('request.jwt.claim.sub', '80000000-0000-4000-8000-000000000001', true);
set local role authenticated;

select extensions.is(
  public.delete_item_with_cleanup(
    '81000000-0000-4000-8000-000000000001',
    '82000000-0000-4000-8000-000000000001'
  ) ->> 'image_path',
  '80000000-0000-4000-8000-000000000001/81000000-0000-4000-8000-000000000001/82000000-0000-4000-8000-000000000001/83000000-0000-4000-8000-000000000001.webp',
  'owned deletion returns the private image path'
);
reset role;
select extensions.is(
  (select count(*)::integer from public.storage_cleanup_jobs where status = 'pending'
    and owner_id = '80000000-0000-4000-8000-000000000001'),
  1,
  'image cleanup is durably queued in the delete transaction'
);
select extensions.is(
  (select count(*)::integer from public.items where id = '82000000-0000-4000-8000-000000000001'),
  0,
  'the Item is deleted'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '80000000-0000-4000-8000-000000000002', true);
select extensions.is(
  public.delete_item_with_cleanup(
    '81000000-0000-4000-8000-000000000001',
    '82000000-0000-4000-8000-000000000002'
  ),
  null::jsonb,
  'another user cannot delete the Item'
);

select * from extensions.finish();
rollback;
