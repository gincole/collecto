begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(1);

do $$
begin
  if not exists (
    select 1
    from storage.buckets
    where id = 'item-images'
      and public = false
      and file_size_limit = 5242880
      and allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  ) then
    raise exception 'Private item-images bucket does not match the contract';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'owners can delete their item images'
      and cmd = 'DELETE'
      and roles = array['authenticated']::name[]
  ) then
    raise exception 'Authenticated owner delete policy is missing';
  end if;
end;
$$;

insert into auth.users (id, email)
values
  ('30000000-0000-4000-8000-000000000001', 'storage-a@example.invalid'),
  ('30000000-0000-4000-8000-000000000002', 'storage-b@example.invalid');

insert into public.collections (id, owner_id, name)
values
  (
    '31000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'Storage A Collection'
  ),
  (
    '31000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    'Storage B Collection'
  );

insert into storage.objects (bucket_id, name, owner_id)
values (
  'item-images',
  '30000000-0000-4000-8000-000000000002/31000000-0000-4000-8000-000000000002/32000000-0000-4000-8000-000000000002/33000000-0000-4000-8000-000000000002.webp',
  '30000000-0000-4000-8000-000000000002'
);

select set_config(
  'request.jwt.claim.sub',
  '30000000-0000-4000-8000-000000000001',
  true
);
set local role authenticated;

do $$
declare
  affected_rows integer;
begin
  insert into storage.objects (bucket_id, name, owner_id)
  values (
    'item-images',
    '30000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000001/32000000-0000-4000-8000-000000000001/33000000-0000-4000-8000-000000000001.jpg',
    '30000000-0000-4000-8000-000000000001'
  );

  if (select count(*) from storage.objects where bucket_id = 'item-images') <> 1 then
    raise exception 'Owner A can list objects outside their Collection';
  end if;

  begin
    insert into storage.objects (bucket_id, name, owner_id)
    values (
      'item-images',
      '30000000-0000-4000-8000-000000000002/31000000-0000-4000-8000-000000000002/32000000-0000-4000-8000-000000000002/33000000-0000-4000-8000-000000000003.png',
      '30000000-0000-4000-8000-000000000001'
    );
    raise exception 'Owner A uploaded into Owner B path';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into storage.objects (bucket_id, name, owner_id)
    values (
      'item-images',
      '30000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000002/32000000-0000-4000-8000-000000000001/33000000-0000-4000-8000-000000000003.png',
      '30000000-0000-4000-8000-000000000001'
    );
    raise exception 'Owner A uploaded into Owner B Collection';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into storage.objects (bucket_id, name, owner_id)
    values (
      'item-images',
      '30000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000001/not-an-item/not-random.gif',
      '30000000-0000-4000-8000-000000000001'
    );
    raise exception 'Owner A uploaded an invalid object path';
  exception
    when insufficient_privilege then null;
  end;

  update storage.objects
  set metadata = '{"verified":true}'::jsonb
  where name = '30000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000001/32000000-0000-4000-8000-000000000001/33000000-0000-4000-8000-000000000001.jpg';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Owner A could not replace their object metadata';
  end if;

  begin
    update storage.objects
    set name = '30000000-0000-4000-8000-000000000002/31000000-0000-4000-8000-000000000002/32000000-0000-4000-8000-000000000001/33000000-0000-4000-8000-000000000001.jpg'
    where name = '30000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000001/32000000-0000-4000-8000-000000000001/33000000-0000-4000-8000-000000000001.jpg';
    raise exception 'Owner A moved an object into Owner B path';
  exception
    when insufficient_privilege then null;
  end;

end;
$$;

reset role;
set local role anon;

do $$
begin
  if exists (
    select 1
    from storage.objects
    where bucket_id = 'item-images'
  ) then
    raise exception 'Private objects are publicly readable';
  end if;
end;
$$;

reset role;

select extensions.pass('private Storage policies enforce Collection ownership');
select * from extensions.finish();

rollback;
