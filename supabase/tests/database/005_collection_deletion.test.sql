begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(4);

insert into auth.users (id, email)
values
  ('50000000-0000-0000-0000-000000000001', 'delete-a@example.invalid'),
  ('50000000-0000-0000-0000-000000000002', 'delete-b@example.invalid');

select set_config(
  'request.jwt.claim.sub',
  '50000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

do $$
declare
  owner_collection_id uuid;
  foreign_collection_id uuid;
  result jsonb;
begin
  owner_collection_id := public.create_collection_with_schema(
    '51000000-0000-0000-0000-000000000001',
    'Owner Collection',
    null,
    'blank',
    '{"columns":3,"aspectRatio":"3:4","imageFit":"cover","showDetails":true,"visibleFieldIds":["title"],"spacing":"normal","sortBy":"createdAt","sortDirection":"desc"}',
    '[]'
  );

  insert into public.items (collection_id, title, image_path)
  values (
    owner_collection_id,
    'Private Item',
    '50000000-0000-0000-0000-000000000001/' || owner_collection_id || '/52000000-0000-0000-0000-000000000001/image.webp'
  );

  perform set_config(
    'request.jwt.claim.sub',
    '50000000-0000-0000-0000-000000000002',
    true
  );

  foreign_collection_id := public.create_collection_with_schema(
    '51000000-0000-0000-0000-000000000002',
    'Foreign Collection',
    null,
    'blank',
    '{"columns":3,"aspectRatio":"3:4","imageFit":"cover","showDetails":true,"visibleFieldIds":["title"],"spacing":"normal","sortBy":"createdAt","sortDirection":"desc"}',
    '[]'
  );

  result := public.delete_collection_with_cleanup(
    owner_collection_id,
    'Owner Collection'
  );
  if result is not null then
    raise exception 'Foreign Collection deletion disclosed ownership';
  end if;

  perform set_config(
    'request.jwt.claim.sub',
    '50000000-0000-0000-0000-000000000001',
    true
  );

  begin
    perform public.delete_collection_with_cleanup(
      owner_collection_id,
      'owner collection'
    );
    raise exception 'Mismatched typed confirmation was accepted';
  exception
    when invalid_parameter_value then null;
  end;

  result := public.delete_collection_with_cleanup(
    owner_collection_id,
    'Owner Collection'
  );
  if result ->> 'id' <> owner_collection_id::text
    or (result ->> 'scheduled_image_count')::integer <> 1 then
    raise exception 'Deletion result did not report scheduled cleanup';
  end if;

  if exists (
    select 1 from public.collections where id = owner_collection_id
  ) then
    raise exception 'Owned Collection was not deleted';
  end if;

end;
$$;

select extensions.pass(
  'Collection deletion is owner-scoped, confirmed, and schedules image cleanup'
);

reset role;

select extensions.ok(
  exists (
    select 1
    from public.collections
    where creation_request_id = '51000000-0000-0000-0000-000000000002'
  ),
  'Foreign Collection survives an unauthorized deletion request'
);

select extensions.ok(
  exists (
    select 1
    from public.storage_cleanup_jobs
    where owner_id = '50000000-0000-0000-0000-000000000001'
      and collection_id is null
      and item_id is null
      and status = 'pending'
  ),
  'Private image cleanup survives Collection and Item cascade deletion'
);

update public.storage_cleanup_jobs
set status = 'processing', created_at = '-infinity'::timestamptz
where owner_id = '50000000-0000-0000-0000-000000000001';

set local role service_role;

select extensions.is(
  (
    select count(*)::integer
    from public.claim_storage_cleanup_jobs(100, now() + interval '1 minute') as claimed
    join public.storage_cleanup_jobs as jobs on jobs.id = claimed.id
    where jobs.owner_id = '50000000-0000-0000-0000-000000000001'
  ),
  1,
  'A stale processing cleanup job is atomically reclaimed for retry'
);

reset role;

select * from extensions.finish();

rollback;
