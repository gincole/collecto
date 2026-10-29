begin;

do $$
declare
  test_user_id uuid := '10000000-0000-0000-0000-000000000001';
  test_collection_id uuid;
  test_field_id uuid;
  test_item_id uuid;
  test_job_id uuid;
  position_index integer;
begin
  insert into auth.users (id, email)
  values (test_user_id, 'schema-test@example.invalid');

  insert into public.collections (owner_id, name)
  values (test_user_id, 'Test Collection')
  returning id into test_collection_id;

  if (select view_config from public.collections where id = test_collection_id)
    <> '{"columns":3,"aspectRatio":"3:4","imageFit":"cover","showDetails":true,"visibleFieldIds":["title"],"spacing":"normal","sortBy":"createdAt","sortDirection":"desc"}'::jsonb
  then
    raise exception 'Collection view_config default does not match the contract';
  end if;

  insert into public.field_definitions (collection_id, name, type, position)
  values (test_collection_id, 'Genre', 'select', 0)
  returning id into test_field_id;

  insert into public.field_options (field_id, label, position)
  values (test_field_id, 'Fiction', 0);

  insert into public.items (collection_id, title)
  values (test_collection_id, 'Test Item')
  returning id into test_item_id;

  if (select values from public.items where id = test_item_id) <> '{}'::jsonb then
    raise exception 'Item values default does not match the contract';
  end if;

  begin
    update public.items set values = '[]'::jsonb where id = test_item_id;
    raise exception 'Expected non-object Item values to fail';
  exception
    when check_violation then null;
  end;

  update public.items
  set updated_at = '2000-01-01 00:00:00+00', title = 'Updated Item'
  where id = test_item_id;

  if (select updated_at from public.items where id = test_item_id)
    <= '2000-01-01 00:00:00+00'::timestamptz
  then
    raise exception 'Item updated_at trigger did not maintain the timestamp';
  end if;

  begin
    insert into public.field_definitions (collection_id, name, type, position)
    values (test_collection_id, 'Duplicate Position', 'text', 0);
    raise exception 'Expected duplicate Field position to fail';
  exception
    when unique_violation then null;
  end;

  begin
    insert into public.field_definitions (collection_id, name, type, position)
    values (test_collection_id, 'Negative Position', 'text', -1);
    raise exception 'Expected negative Field position to fail';
  exception
    when check_violation then null;
  end;

  begin
    insert into public.field_options (field_id, label, position)
    values (test_field_id, 'fiction', 1);
    raise exception 'Expected case-insensitive duplicate Select option label to fail';
  exception
    when unique_violation then null;
  end;

  begin
    insert into public.field_options (field_id, label, position)
    values (test_field_id, 'Duplicate Position', 0);
    raise exception 'Expected duplicate Select option position to fail';
  exception
    when unique_violation then null;
  end;

  begin
    insert into public.field_options (field_id, label, position)
    values (test_field_id, 'Negative Position', -1);
    raise exception 'Expected negative Select option position to fail';
  exception
    when check_violation then null;
  end;

  for position_index in 1..29 loop
    insert into public.field_definitions (collection_id, name, type, position)
    values (
      test_collection_id,
      'Field ' || position_index,
      'text',
      position_index
    );
  end loop;

  begin
    insert into public.field_definitions (collection_id, name, type, position)
    values (test_collection_id, 'Field 30', 'text', 30);
    raise exception 'Expected more than 30 custom fields to fail';
  exception
    when check_violation then null;
  end;

  for position_index in 1..49 loop
    insert into public.field_options (field_id, label, position)
    values (
      test_field_id,
      'Option ' || position_index,
      position_index
    );
  end loop;

  begin
    insert into public.field_options (field_id, label, position)
    values (test_field_id, 'Option 50', 50);
    raise exception 'Expected more than 50 options to fail';
  exception
    when check_violation then null;
  end;

  delete from public.field_definitions where id = test_field_id;

  if exists (select 1 from public.field_options where field_id = test_field_id) then
    raise exception 'Select options did not cascade with Field deletion';
  end if;

  insert into public.items (collection_id, title)
  values (test_collection_id, 'Cleanup Item')
  returning id into test_item_id;

  insert into public.storage_cleanup_jobs (
    owner_id,
    collection_id,
    item_id,
    object_path
  )
  values (
    test_user_id,
    test_collection_id,
    test_item_id,
    test_user_id || '/' || test_collection_id || '/' || test_item_id || '/image.webp'
  )
  returning id into test_job_id;

  delete from public.collections where id = test_collection_id;

  if exists (
    select 1 from public.field_definitions where collection_id = test_collection_id
  ) then
    raise exception 'Field definitions did not cascade with Collection deletion';
  end if;

  if exists (select 1 from public.items where id = test_item_id) then
    raise exception 'Items did not cascade with Collection deletion';
  end if;

  if not exists (
    select 1
    from public.storage_cleanup_jobs
    where id = test_job_id
      and collection_id is null
      and item_id is null
      and owner_id = test_user_id
  ) then
    raise exception 'Cleanup job was not retained after Collection deletion';
  end if;

  begin
    insert into public.collections (owner_id, name)
    values (test_user_id, repeat('x', 101));
    raise exception 'Expected overlong Collection name to fail';
  exception
    when check_violation then null;
  end;

  insert into public.collections (owner_id, name)
  values (test_user_id, 'Uniqueness Test')
  returning id into test_collection_id;

  insert into public.field_definitions (collection_id, name, type, position)
  values (test_collection_id, 'Status', 'select', 0);

  begin
    insert into public.field_definitions (collection_id, name, type, position)
    values (test_collection_id, 'status', 'text', 1);
    raise exception 'Expected case-insensitive duplicate Field name to fail';
  exception
    when unique_violation then null;
  end;
end;
$$;

rollback;
