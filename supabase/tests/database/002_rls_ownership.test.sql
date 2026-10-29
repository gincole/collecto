begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(1);

insert into auth.users (id, email)
values
  ('20000000-0000-0000-0000-000000000001', 'owner-a@example.invalid'),
  ('20000000-0000-0000-0000-000000000002', 'owner-b@example.invalid');

insert into public.collections (id, owner_id, name)
values
  (
    '21000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Owner A Collection'
  ),
  (
    '21000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'Owner B Collection'
  );

insert into public.field_definitions (
  id,
  collection_id,
  name,
  type,
  position
)
values
  (
    '22000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001',
    'Owner A Status',
    'select',
    0
  ),
  (
    '22000000-0000-0000-0000-000000000002',
    '21000000-0000-0000-0000-000000000002',
    'Owner B Status',
    'select',
    0
  );

insert into public.field_options (id, field_id, label, position)
values
  (
    '23000000-0000-0000-0000-000000000001',
    '22000000-0000-0000-0000-000000000001',
    'Owner A Option',
    0
  ),
  (
    '23000000-0000-0000-0000-000000000002',
    '22000000-0000-0000-0000-000000000002',
    'Owner B Option',
    0
  );

insert into public.items (id, collection_id, title)
values
  (
    '24000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001',
    'Owner A Item'
  ),
  (
    '24000000-0000-0000-0000-000000000002',
    '21000000-0000-0000-0000-000000000002',
    'Owner B Item'
  );

insert into public.storage_cleanup_jobs (
  id,
  owner_id,
  collection_id,
  item_id,
  object_path
)
values (
  '25000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000001',
  '24000000-0000-0000-0000-000000000001',
  'owner-a/collection/item/image.webp'
);

select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

do $$
declare
  affected_rows integer;
begin
  if (select count(*) from public.collections) <> 1 then
    raise exception 'Owner A must list only their Collection';
  end if;

  if exists (
    select 1
    from public.collections
    where id = '21000000-0000-0000-0000-000000000002'
  ) then
    raise exception 'Owner A can read Owner B Collection by direct ID';
  end if;

  insert into public.collections (id, owner_id, name)
  values (
    '21000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    'Owner A New Collection'
  );

  begin
    insert into public.collections (owner_id, name)
    values (
      '20000000-0000-0000-0000-000000000002',
      'Invalid Foreign Collection'
    );
    raise exception 'Owner A inserted a Collection for Owner B';
  exception
    when insufficient_privilege then null;
  end;

  update public.collections
  set name = 'Owner A Updated Collection'
  where id = '21000000-0000-0000-0000-000000000001';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Owner A could not update their Collection';
  end if;

  begin
    update public.collections
    set owner_id = '20000000-0000-0000-0000-000000000002'
    where id = '21000000-0000-0000-0000-000000000001';
    raise exception 'Owner A transferred their Collection to Owner B';
  exception
    when insufficient_privilege then null;
  end;

  update public.collections
  set name = 'Owner B Compromised Collection'
  where id = '21000000-0000-0000-0000-000000000002';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Owner A updated Owner B Collection';
  end if;

  delete from public.collections
  where id = '21000000-0000-0000-0000-000000000002';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Owner A deleted Owner B Collection';
  end if;

  delete from public.collections
  where id = '21000000-0000-0000-0000-000000000003';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Owner A could not delete their Collection';
  end if;

  if (select count(*) from public.field_definitions) <> 1 then
    raise exception 'Owner A must list only their Field Definitions';
  end if;

  if exists (
    select 1
    from public.field_definitions
    where id = '22000000-0000-0000-0000-000000000002'
  ) then
    raise exception 'Owner A can read Owner B Field by direct ID';
  end if;

  insert into public.field_definitions (
    id,
    collection_id,
    name,
    type,
    position
  )
  values (
    '22000000-0000-0000-0000-000000000003',
    '21000000-0000-0000-0000-000000000001',
    'Owner A Notes',
    'text',
    1
  );

  begin
    insert into public.field_definitions (
      collection_id,
      name,
      type,
      position
    )
    values (
      '21000000-0000-0000-0000-000000000002',
      'Foreign Field',
      'text',
      1
    );
    raise exception 'Owner A inserted a Field into Owner B Collection';
  exception
    when insufficient_privilege then null;
  end;

  update public.field_definitions
  set required = true
  where id = '22000000-0000-0000-0000-000000000003';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Owner A could not update their Field';
  end if;

  begin
    update public.field_definitions
    set collection_id = '21000000-0000-0000-0000-000000000002'
    where id = '22000000-0000-0000-0000-000000000003';
    raise exception 'Owner A moved their Field to Owner B Collection';
  exception
    when insufficient_privilege then null;
  end;

  update public.field_definitions
  set required = true
  where id = '22000000-0000-0000-0000-000000000002';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Owner A updated Owner B Field';
  end if;

  delete from public.field_definitions
  where id = '22000000-0000-0000-0000-000000000002';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Owner A deleted Owner B Field';
  end if;

  delete from public.field_definitions
  where id = '22000000-0000-0000-0000-000000000003';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Owner A could not delete their Field';
  end if;

  if (select count(*) from public.field_options) <> 1 then
    raise exception 'Owner A must list only their Field Options';
  end if;

  if exists (
    select 1
    from public.field_options
    where id = '23000000-0000-0000-0000-000000000002'
  ) then
    raise exception 'Owner A can read Owner B Option by direct ID';
  end if;

  insert into public.field_options (id, field_id, label, position)
  values (
    '23000000-0000-0000-0000-000000000003',
    '22000000-0000-0000-0000-000000000001',
    'Owner A Second Option',
    1
  );

  begin
    insert into public.field_options (field_id, label, position)
    values (
      '22000000-0000-0000-0000-000000000002',
      'Foreign Option',
      1
    );
    raise exception 'Owner A inserted an Option into Owner B Field';
  exception
    when insufficient_privilege then null;
  end;

  update public.field_options
  set label = 'Owner A Updated Option'
  where id = '23000000-0000-0000-0000-000000000003';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Owner A could not update their Option';
  end if;

  begin
    update public.field_options
    set field_id = '22000000-0000-0000-0000-000000000002'
    where id = '23000000-0000-0000-0000-000000000003';
    raise exception 'Owner A moved their Option to Owner B Field';
  exception
    when insufficient_privilege then null;
  end;

  update public.field_options
  set label = 'Owner B Compromised Option'
  where id = '23000000-0000-0000-0000-000000000002';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Owner A updated Owner B Option';
  end if;

  delete from public.field_options
  where id = '23000000-0000-0000-0000-000000000002';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Owner A deleted Owner B Option';
  end if;

  delete from public.field_options
  where id = '23000000-0000-0000-0000-000000000003';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Owner A could not delete their Option';
  end if;

  if (select count(*) from public.items) <> 1 then
    raise exception 'Owner A must list only their Items';
  end if;

  if exists (
    select 1
    from public.items
    where id = '24000000-0000-0000-0000-000000000002'
  ) then
    raise exception 'Owner A can read Owner B Item by direct ID';
  end if;

  insert into public.items (id, collection_id, title)
  values (
    '24000000-0000-0000-0000-000000000003',
    '21000000-0000-0000-0000-000000000001',
    'Owner A New Item'
  );

  begin
    insert into public.items (collection_id, title)
    values (
      '21000000-0000-0000-0000-000000000002',
      'Foreign Item'
    );
    raise exception 'Owner A inserted an Item into Owner B Collection';
  exception
    when insufficient_privilege then null;
  end;

  update public.items
  set title = 'Owner A Updated Item'
  where id = '24000000-0000-0000-0000-000000000003';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Owner A could not update their Item';
  end if;

  begin
    update public.items
    set collection_id = '21000000-0000-0000-0000-000000000002'
    where id = '24000000-0000-0000-0000-000000000003';
    raise exception 'Owner A moved their Item to Owner B Collection';
  exception
    when insufficient_privilege then null;
  end;

  update public.items
  set title = 'Owner B Compromised Item'
  where id = '24000000-0000-0000-0000-000000000002';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Owner A updated Owner B Item';
  end if;

  delete from public.items
  where id = '24000000-0000-0000-0000-000000000002';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Owner A deleted Owner B Item';
  end if;

  delete from public.items
  where id = '24000000-0000-0000-0000-000000000003';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Owner A could not delete their Item';
  end if;

  begin
    perform count(*) from public.storage_cleanup_jobs;
    raise exception 'Authenticated users can read cleanup jobs';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.storage_cleanup_jobs (owner_id, object_path)
    values (
      '20000000-0000-0000-0000-000000000001',
      'owner-a/unauthorized.webp'
    );
    raise exception 'Authenticated users can create cleanup jobs';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.storage_cleanup_jobs
    set attempt_count = 1
    where id = '25000000-0000-0000-0000-000000000001';
    raise exception 'Authenticated users can update cleanup jobs';
  exception
    when insufficient_privilege then null;
  end;

  begin
    delete from public.storage_cleanup_jobs
    where id = '25000000-0000-0000-0000-000000000001';
    raise exception 'Authenticated users can delete cleanup jobs';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000002',
  true
);

do $$
declare
  affected_rows integer;
begin
  if (select count(*) from public.collections) <> 1 then
    raise exception 'Owner B must list only their Collection';
  end if;

  if exists (
    select 1
    from public.collections
    where id = '21000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'Owner B can read Owner A Collection by direct ID';
  end if;

  if exists (
    select 1
    from public.field_definitions
    where id = '22000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'Owner B can read Owner A Field by direct ID';
  end if;

  if exists (
    select 1
    from public.field_options
    where id = '23000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'Owner B can read Owner A Option by direct ID';
  end if;

  if exists (
    select 1
    from public.items
    where id = '24000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'Owner B can read Owner A Item by direct ID';
  end if;

  update public.collections
  set name = 'Owner A Compromised By Owner B'
  where id = '21000000-0000-0000-0000-000000000001';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Owner B updated Owner A Collection';
  end if;
end;
$$;

reset role;

set local role anon;

do $$
begin
  begin
    perform count(*) from public.collections;
    raise exception 'Anonymous users can read private Collections';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

select extensions.pass('RLS isolates owner data and blocks cleanup-job access');
select * from extensions.finish();

rollback;
