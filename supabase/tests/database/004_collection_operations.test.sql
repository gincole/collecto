begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(1);

insert into auth.users (id, email)
values
  ('40000000-0000-0000-0000-000000000001', 'collections-a@example.invalid'),
  ('40000000-0000-0000-0000-000000000002', 'collections-b@example.invalid');

select set_config(
  'request.jwt.claim.sub',
  '40000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

do $$
declare
  result_id uuid;
begin
  result_id := public.create_collection_with_schema(
    '41000000-0000-0000-0000-000000000001',
    'My Books',
    'Reading list',
    'book',
    '{"columns":3,"aspectRatio":"2:3","imageFit":"cover","showDetails":true,"visibleFieldIds":["title","42000000-0000-0000-0000-000000000001"],"spacing":"normal","sortBy":"createdAt","sortDirection":"desc"}',
    '[{"id":"42000000-0000-0000-0000-000000000001","name":"Author","type":"text","required":false,"position":0,"options":[]},{"id":"42000000-0000-0000-0000-000000000002","name":"Genre","type":"select","required":false,"position":1,"options":[{"id":"43000000-0000-0000-0000-000000000001","label":"Fiction","position":0}]}]'
  );

  if result_id is null then
    raise exception 'Atomic creation did not return a Collection';
  end if;

  perform public.create_collection_with_schema(
    '41000000-0000-0000-0000-000000000001',
    'Changed by retry',
    null,
    'blank',
    '{"columns":3,"aspectRatio":"3:4","imageFit":"cover","showDetails":true,"visibleFieldIds":["title"],"spacing":"normal","sortBy":"createdAt","sortDirection":"desc"}',
    '[]'
  );

  if (select count(*) from public.collections) <> 1
    or (select id from public.collections limit 1) <> result_id
    or (select name from public.collections limit 1) <> 'My Books'
    or (select count(*) from public.field_definitions) <> 2
    or (select count(*) from public.field_options) <> 1 then
    raise exception 'Duplicate submission was not idempotent';
  end if;

  perform set_config(
    'request.jwt.claim.sub',
    '40000000-0000-0000-0000-000000000002',
    true
  );

  if exists (select 1 from public.collections where id = result_id) then
    raise exception 'Foreign Collection was disclosed by direct ID';
  end if;

  if public.create_collection_with_schema(
    '41000000-0000-0000-0000-000000000001',
    'Independent retry token',
    null,
    'blank',
    '{"columns":3,"aspectRatio":"3:4","imageFit":"cover","showDetails":true,"visibleFieldIds":["title"],"spacing":"normal","sortBy":"createdAt","sortDirection":"desc"}',
    '[]'
  ) = result_id then
    raise exception 'Owner-scoped request IDs reused a foreign Collection';
  end if;

  update public.collections
  set name = 'Compromised'
  where id = result_id;
  if found then
    raise exception 'Foreign Collection was updated';
  end if;

  delete from public.collections
  where id = result_id;
  if found then
    raise exception 'Foreign Collection was deleted';
  end if;

  begin
    perform public.create_collection_with_schema(
      '41000000-0000-0000-0000-000000000002',
      'Must roll back',
      null,
      'blank',
      '{"columns":3,"aspectRatio":"3:4","imageFit":"cover","showDetails":true,"visibleFieldIds":["title"],"spacing":"normal","sortBy":"createdAt","sortDirection":"desc"}',
      '[{"id":"42000000-0000-0000-0000-000000000011","name":"Duplicate","type":"text","required":false,"position":0,"options":[]},{"id":"42000000-0000-0000-0000-000000000012","name":"Duplicate","type":"text","required":false,"position":1,"options":[]}]'
    );
    raise exception 'Invalid child schema was accepted';
  exception
    when unique_violation then null;
  end;

  if exists (
    select 1 from public.collections
    where creation_request_id = '41000000-0000-0000-0000-000000000002'
  ) then
    raise exception 'Parent Collection survived a failed child insert';
  end if;

  begin
    perform public.create_collection_with_schema(
      '41000000-0000-0000-0000-000000000003',
      'Invalid gallery',
      null,
      'blank',
      '{}',
      '[]'
    );
    raise exception 'Malformed gallery configuration was accepted';
  exception
    when invalid_parameter_value then null;
  end;
end;
$$;

select extensions.pass(
  'Collection creation is atomic and idempotent while ownership remains private'
);

select * from extensions.finish();

rollback;
