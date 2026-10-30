begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(22);

insert into auth.users (id, email) values
  ('90000000-0000-4000-8000-000000000001', 'fields-a@example.invalid'),
  ('90000000-0000-4000-8000-000000000002', 'fields-b@example.invalid');
insert into public.collections (id, owner_id, name, preset_key, view_config) values (
  '91000000-0000-4000-8000-000000000001',
  '90000000-0000-4000-8000-000000000001',
  'Fields',
  'blank',
  '{"columns":3,"aspectRatio":"3:4","imageFit":"cover","showDetails":true,"visibleFieldIds":["title","92000000-0000-4000-8000-000000000001"],"spacing":"normal","sortBy":"createdAt","sortDirection":"desc"}'
), (
  '91000000-0000-4000-8000-000000000003',
  '90000000-0000-4000-8000-000000000001',
  'Other Fields',
  'blank',
  '{"columns":3,"aspectRatio":"3:4","imageFit":"cover","showDetails":true,"visibleFieldIds":["title"],"spacing":"normal","sortBy":"createdAt","sortDirection":"desc"}'
);
insert into public.field_definitions (id, collection_id, name, type, required, position) values
  ('92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'Notes', 'text', false, 0),
  ('92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000001', 'Status', 'select', false, 1);
insert into public.field_options (id, field_id, label, position) values
  ('93000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000002', 'Kept', 0),
  ('93000000-0000-4000-8000-000000000002', '92000000-0000-4000-8000-000000000002', 'Shared', 1);
insert into public.items (id, collection_id, title, values) values (
  '94000000-0000-4000-8000-000000000001',
  '91000000-0000-4000-8000-000000000001',
  'Memory',
  '{"92000000-0000-4000-8000-000000000001":"value","92000000-0000-4000-8000-000000000002":"93000000-0000-4000-8000-000000000001"}'
);

select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000001', true);
set local role authenticated;

select extensions.ok(
  public.create_field('91000000-0000-4000-8000-000000000001', 'Score', 'number', false) ? 'id',
  'owner can append a Field'
);
select extensions.is(
  (public.update_field('91000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000001', 'Journal', true) ->> 'id')::uuid,
  '92000000-0000-4000-8000-000000000001'::uuid,
  'rename and required toggle preserve the Field ID'
);
select extensions.throws_ok(
  $$update public.field_definitions set type = 'date' where id = '92000000-0000-4000-8000-000000000001'$$,
  '23514',
  'Field type is immutable',
  'direct updates cannot change Field type'
);
select extensions.throws_ok(
  $$update public.field_definitions set collection_id = '91000000-0000-4000-8000-000000000003' where id = '92000000-0000-4000-8000-000000000001'$$,
  '42501',
  'Field collection is immutable',
  'direct updates cannot reparent a Field'
);
select extensions.throws_ok(
  $$select public.create_field('91000000-0000-4000-8000-000000000001', 'score', 'text', false)$$,
  '23505',
  null,
  'Field names remain unique case-insensitively through the RPC'
);
select extensions.is(
  public.create_field_option(
    '91000000-0000-4000-8000-000000000001',
    '92000000-0000-4000-8000-000000000001',
    'Invalid'
  ),
  null::jsonb,
  'Option RPCs reject non-Select fields'
);
select public.reorder_fields(
  '91000000-0000-4000-8000-000000000001',
  array[
    '92000000-0000-4000-8000-000000000002'::uuid,
    (select id from public.field_definitions where name = 'Score'),
    '92000000-0000-4000-8000-000000000001'::uuid
  ]
);
select extensions.is(
  (select string_agg(name, ',' order by position) from public.field_definitions where collection_id = '91000000-0000-4000-8000-000000000001'),
  'Status,Score,Journal',
  'Field reorder persists every stable ID exactly once'
);
select public.reorder_field_options(
  '91000000-0000-4000-8000-000000000001',
  '92000000-0000-4000-8000-000000000002',
  array['93000000-0000-4000-8000-000000000002'::uuid, '93000000-0000-4000-8000-000000000001'::uuid]
);
select extensions.is(
  (select string_agg(label, ',' order by position) from public.field_options where field_id = '92000000-0000-4000-8000-000000000002'),
  'Shared,Kept',
  'Option reorder persists stable IDs'
);
select extensions.is(
  (public.update_field_option(
    '91000000-0000-4000-8000-000000000001',
    '92000000-0000-4000-8000-000000000002',
    '93000000-0000-4000-8000-000000000001',
    'Remembered'
  ) ->> 'id')::uuid,
  '93000000-0000-4000-8000-000000000001'::uuid,
  'Option rename preserves its stable ID'
);
select extensions.throws_ok(
  $$select public.create_field_option('91000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000002', 'shared')$$,
  '23505',
  null,
  'Option labels remain unique case-insensitively through the RPC'
);
select extensions.throws_ok(
  $$select public.update_item_with_values(
    '91000000-0000-4000-8000-000000000001',
    '94000000-0000-4000-8000-000000000001',
    'Memory',
    null,
    '{"92000000-0000-4000-8000-000000000002":"93000000-0000-4000-8000-000000000001"}'::jsonb
  )$$,
  '23514',
  'A required Item field is missing',
  'required toggles apply to subsequent Item saves'
);
select extensions.is(
  (public.get_field_delete_impact('91000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000001') ->> 'affected_item_count')::integer,
  1,
  'Field impact reports populated Items'
);
select extensions.is(
  (public.delete_field_with_cleanup('91000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000001') ->> 'affected_item_count')::integer,
  1,
  'Field deletion reports cleanup impact'
);
select extensions.ok(
  not (select values ? '92000000-0000-4000-8000-000000000001' from public.items where id = '94000000-0000-4000-8000-000000000001'),
  'Field deletion removes Item JSON values'
);
select extensions.ok(
  not (select view_config -> 'visibleFieldIds' ? '92000000-0000-4000-8000-000000000001' from public.collections where id = '91000000-0000-4000-8000-000000000001'),
  'Field deletion removes gallery references'
);
select extensions.ok(
  (select coalesce(max(position), -1) = count(*) - 1 from public.field_definitions where collection_id = '91000000-0000-4000-8000-000000000001'),
  'Field deletion leaves contiguous positions'
);
select extensions.is(
  (public.get_option_delete_impact('91000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000002', '93000000-0000-4000-8000-000000000001') ->> 'affected_item_count')::integer,
  1,
  'Option impact reports matching Items'
);
select extensions.is(
  (public.delete_option_with_cleanup('91000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000002', '93000000-0000-4000-8000-000000000001') ->> 'affected_item_count')::integer,
  1,
  'Option deletion reports cleanup impact'
);
select extensions.ok(
  not (select values ? '92000000-0000-4000-8000-000000000002' from public.items where id = '94000000-0000-4000-8000-000000000001'),
  'Option deletion clears matching values to Uncategorized'
);
select extensions.ok(
  (select coalesce(max(position), -1) = count(*) - 1 from public.field_options where field_id = '92000000-0000-4000-8000-000000000002'),
  'Option deletion leaves contiguous positions'
);

select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000002', true);
select extensions.ok(
  public.create_field('91000000-0000-4000-8000-000000000001', 'Foreign', 'text', false) is null
  and public.update_field('91000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000002', 'Foreign', false) is null
  and public.reorder_fields('91000000-0000-4000-8000-000000000001', array['92000000-0000-4000-8000-000000000002'::uuid]) is null
  and public.get_field_delete_impact('91000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000002') is null
  and public.create_field_option('91000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000002', 'Foreign') is null
  and public.update_field_option('91000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000002', '93000000-0000-4000-8000-000000000002', 'Foreign') is null
  and public.reorder_field_options('91000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000002', array['93000000-0000-4000-8000-000000000002'::uuid]) is null
  and public.get_option_delete_impact('91000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000002', '93000000-0000-4000-8000-000000000002') is null
  and public.delete_option_with_cleanup('91000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000002', '93000000-0000-4000-8000-000000000002') is null,
  'another user cannot call any Field or Option RPC with direct IDs'
);
select extensions.is(
  public.delete_field_with_cleanup('91000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000002'),
  null::jsonb,
  'another user cannot mutate a direct Field ID'
);

select * from extensions.finish();
rollback;
