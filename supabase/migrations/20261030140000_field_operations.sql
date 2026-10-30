create or replace function public.protect_field_contract()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.type is distinct from old.type then
    raise exception 'Field type is immutable' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and new.collection_id is distinct from old.collection_id then
    raise exception 'Field collection is immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger field_definitions_protect_contract
before update of type, collection_id on public.field_definitions
for each row execute function public.protect_field_contract();

create or replace function public.create_field(
  p_collection_id uuid,
  p_name text,
  p_type public.field_type,
  p_required boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid; v_position integer;
begin
  perform 1 from public.collections
  where id = p_collection_id and collections.owner_id = auth.uid()
  for update;
  if not found then return null; end if;
  select coalesce(max(position) + 1, 0) into v_position
  from public.field_definitions where collection_id = p_collection_id;
  insert into public.field_definitions (collection_id, name, type, required, position)
  values (p_collection_id, p_name, p_type, p_required, v_position)
  returning id into v_id;
  return jsonb_build_object('id', v_id);
end;
$$;

create or replace function public.update_field(
  p_collection_id uuid,
  p_field_id uuid,
  p_name text,
  p_required boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  perform 1 from public.collections
  where id = p_collection_id and collections.owner_id = auth.uid()
  for update;
  if not found then return null; end if;
  update public.field_definitions as fields
  set name = coalesce(p_name, fields.name), required = coalesce(p_required, fields.required)
  from public.collections
  where fields.id = p_field_id
    and fields.collection_id = p_collection_id
    and collections.id = fields.collection_id
    and collections.owner_id = auth.uid()
  returning fields.id into v_id;
  return case when v_id is null then null else jsonb_build_object('id', v_id) end;
end;
$$;

create or replace function public.reorder_fields(
  p_collection_id uuid,
  p_field_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_count integer;
begin
  perform 1 from public.collections
  where id = p_collection_id and collections.owner_id = auth.uid()
  for update;
  if not found then return null; end if;
  select count(*) into v_count from public.field_definitions where collection_id = p_collection_id;
  if cardinality(p_field_ids) <> v_count
    or (select count(distinct value) from unnest(p_field_ids) as submitted(value)) <> v_count
    or exists (
      select 1 from unnest(p_field_ids) as submitted(value)
      where not exists (
        select 1 from public.field_definitions
        where collection_id = p_collection_id and id = submitted.value
      )
    ) then
    raise exception 'Field reorder must contain every field exactly once' using errcode = '22023';
  end if;
  update public.field_definitions set position = position + 1000 where collection_id = p_collection_id;
  update public.field_definitions as fields
  set position = submitted.ordinality - 1
  from unnest(p_field_ids) with ordinality as submitted(id, ordinality)
  where fields.id = submitted.id and fields.collection_id = p_collection_id;
  return jsonb_build_object('id', p_collection_id);
end;
$$;

create or replace function public.get_field_delete_impact(
  p_collection_id uuid,
  p_field_id uuid
)
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select jsonb_build_object(
    'affected_item_count', (
      select count(*) from public.items
      where collection_id = p_collection_id and values ? p_field_id::text
    )
  )
  from public.field_definitions as fields
  join public.collections on collections.id = fields.collection_id
  where fields.id = p_field_id
    and fields.collection_id = p_collection_id
    and collections.owner_id = auth.uid();
$$;

create or replace function public.delete_field_with_cleanup(
  p_collection_id uuid,
  p_field_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_affected integer; v_visible jsonb;
begin
  perform 1 from public.collections
  where id = p_collection_id and collections.owner_id = auth.uid()
  for update;
  if not found then return null; end if;
  perform 1 from public.field_definitions as fields
  where fields.id = p_field_id and fields.collection_id = p_collection_id
  for update of fields;
  if not found then return null; end if;

  update public.items set values = items.values - p_field_id::text
  where collection_id = p_collection_id and values ? p_field_id::text;
  get diagnostics v_affected = row_count;

  select coalesce(jsonb_agg(entry.value order by entry.ordinality), '[]'::jsonb)
  into v_visible
  from public.collections,
    jsonb_array_elements(view_config -> 'visibleFieldIds') with ordinality as entry(value, ordinality)
  where id = p_collection_id and entry.value <> to_jsonb(p_field_id::text);
  update public.collections
  set view_config = jsonb_set(view_config, '{visibleFieldIds}', v_visible)
  where id = p_collection_id and owner_id = auth.uid();

  delete from public.field_definitions where id = p_field_id and collection_id = p_collection_id;
  update public.field_definitions set position = position + 1000 where collection_id = p_collection_id;
  with ordered as (
    select id, row_number() over (order by position) - 1 as position
    from public.field_definitions where collection_id = p_collection_id
  )
  update public.field_definitions as fields set position = ordered.position
  from ordered where fields.id = ordered.id;
  return jsonb_build_object('id', p_field_id, 'affected_item_count', v_affected);
end;
$$;

create or replace function public.create_field_option(
  p_collection_id uuid,
  p_field_id uuid,
  p_label text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid; v_position integer;
begin
  perform 1 from public.collections
  where id = p_collection_id and collections.owner_id = auth.uid()
  for update;
  if not found then return null; end if;
  perform 1 from public.field_definitions as fields
  where fields.id = p_field_id and fields.collection_id = p_collection_id
    and fields.type = 'select'
  for update of fields;
  if not found then return null; end if;
  select coalesce(max(position) + 1, 0) into v_position
  from public.field_options where field_id = p_field_id;
  insert into public.field_options (field_id, label, position)
  values (p_field_id, p_label, v_position) returning id into v_id;
  return jsonb_build_object('id', v_id);
end;
$$;

create or replace function public.update_field_option(
  p_collection_id uuid,
  p_field_id uuid,
  p_option_id uuid,
  p_label text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  perform 1 from public.collections
  where id = p_collection_id and collections.owner_id = auth.uid()
  for update;
  if not found then return null; end if;
  update public.field_options as options set label = p_label
  from public.field_definitions as fields, public.collections
  where options.id = p_option_id and options.field_id = p_field_id
    and fields.id = options.field_id and fields.collection_id = p_collection_id
    and collections.id = fields.collection_id and collections.owner_id = auth.uid()
  returning options.id into v_id;
  return case when v_id is null then null else jsonb_build_object('id', v_id) end;
end;
$$;

create or replace function public.reorder_field_options(
  p_collection_id uuid,
  p_field_id uuid,
  p_option_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_count integer;
begin
  perform 1 from public.collections
  where id = p_collection_id and collections.owner_id = auth.uid()
  for update;
  if not found then return null; end if;
  perform 1 from public.field_definitions as fields
  where fields.id = p_field_id and fields.collection_id = p_collection_id
    and fields.type = 'select'
  for update of fields;
  if not found then return null; end if;
  select count(*) into v_count from public.field_options where field_id = p_field_id;
  if cardinality(p_option_ids) <> v_count
    or (select count(distinct value) from unnest(p_option_ids) as submitted(value)) <> v_count
    or exists (
      select 1 from unnest(p_option_ids) as submitted(value)
      where not exists (
        select 1 from public.field_options where field_id = p_field_id and id = submitted.value
      )
    ) then
    raise exception 'Option reorder must contain every option exactly once' using errcode = '22023';
  end if;
  update public.field_options set position = position + 1000 where field_id = p_field_id;
  update public.field_options as options
  set position = submitted.ordinality - 1
  from unnest(p_option_ids) with ordinality as submitted(id, ordinality)
  where options.id = submitted.id and options.field_id = p_field_id;
  return jsonb_build_object('id', p_field_id);
end;
$$;

create or replace function public.get_option_delete_impact(
  p_collection_id uuid,
  p_field_id uuid,
  p_option_id uuid
)
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select jsonb_build_object(
    'affected_item_count', (
      select count(*) from public.items
      where collection_id = p_collection_id
        and items.values ->> p_field_id::text = p_option_id::text
    )
  )
  from public.field_options as options
  join public.field_definitions as fields on fields.id = options.field_id
  join public.collections on collections.id = fields.collection_id
  where options.id = p_option_id and options.field_id = p_field_id
    and fields.collection_id = p_collection_id and collections.owner_id = auth.uid();
$$;

create or replace function public.delete_option_with_cleanup(
  p_collection_id uuid,
  p_field_id uuid,
  p_option_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_affected integer;
begin
  perform 1 from public.collections
  where id = p_collection_id and collections.owner_id = auth.uid()
  for update;
  if not found then return null; end if;
  perform 1 from public.field_definitions as fields
  where fields.id = p_field_id and fields.collection_id = p_collection_id
    and fields.type = 'select'
  for update of fields;
  if not found then return null; end if;
  perform 1 from public.field_options as options
  where options.id = p_option_id and options.field_id = p_field_id
  for update of options;
  if not found then return null; end if;
  update public.items set values = items.values - p_field_id::text
  where collection_id = p_collection_id
    and items.values ->> p_field_id::text = p_option_id::text;
  get diagnostics v_affected = row_count;
  delete from public.field_options where id = p_option_id and field_id = p_field_id;
  update public.field_options set position = position + 1000 where field_id = p_field_id;
  with ordered as (
    select id, row_number() over (order by position) - 1 as position
    from public.field_options where field_id = p_field_id
  )
  update public.field_options as options set position = ordered.position
  from ordered where options.id = ordered.id;
  return jsonb_build_object('id', p_option_id, 'affected_item_count', v_affected);
end;
$$;

-- Item writes take a shared Collection lock so a validated value cannot be
-- committed after a concurrent Field or Option cleanup has finished.
create or replace function public.create_item_with_values(
  p_collection_id uuid,
  p_title text,
  p_description text,
  p_values jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare created_id uuid;
begin
  perform 1 from public.collections
  where id = p_collection_id and owner_id = auth.uid()
  for share;
  if not found then return null; end if;
  perform public.validate_item_values(p_collection_id, p_values);
  insert into public.items (collection_id, title, description, values)
  values (p_collection_id, p_title, p_description, p_values)
  returning id into created_id;
  return created_id;
end;
$$;

create or replace function public.update_item_with_values(
  p_collection_id uuid,
  p_item_id uuid,
  p_title text,
  p_description text,
  p_values jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare updated_id uuid;
begin
  perform 1 from public.collections
  where id = p_collection_id and owner_id = auth.uid()
  for share;
  if not found then return null; end if;
  perform public.validate_item_values(p_collection_id, p_values);
  update public.items
  set title = p_title, description = p_description, values = p_values
  where id = p_item_id and collection_id = p_collection_id
  returning id into updated_id;
  return updated_id;
end;
$$;

revoke all on function public.create_field(uuid, text, public.field_type, boolean) from public, anon;
revoke all on function public.update_field(uuid, uuid, text, boolean) from public, anon;
revoke all on function public.reorder_fields(uuid, uuid[]) from public, anon;
revoke all on function public.get_field_delete_impact(uuid, uuid) from public, anon;
revoke all on function public.delete_field_with_cleanup(uuid, uuid) from public, anon;
revoke all on function public.create_field_option(uuid, uuid, text) from public, anon;
revoke all on function public.update_field_option(uuid, uuid, uuid, text) from public, anon;
revoke all on function public.reorder_field_options(uuid, uuid, uuid[]) from public, anon;
revoke all on function public.get_option_delete_impact(uuid, uuid, uuid) from public, anon;
revoke all on function public.delete_option_with_cleanup(uuid, uuid, uuid) from public, anon;

grant execute on function public.create_field(uuid, text, public.field_type, boolean) to authenticated;
grant execute on function public.update_field(uuid, uuid, text, boolean) to authenticated;
grant execute on function public.reorder_fields(uuid, uuid[]) to authenticated;
grant execute on function public.get_field_delete_impact(uuid, uuid) to authenticated;
grant execute on function public.delete_field_with_cleanup(uuid, uuid) to authenticated;
grant execute on function public.create_field_option(uuid, uuid, text) to authenticated;
grant execute on function public.update_field_option(uuid, uuid, uuid, text) to authenticated;
grant execute on function public.reorder_field_options(uuid, uuid, uuid[]) to authenticated;
grant execute on function public.get_option_delete_impact(uuid, uuid, uuid) to authenticated;
grant execute on function public.delete_option_with_cleanup(uuid, uuid, uuid) to authenticated;
