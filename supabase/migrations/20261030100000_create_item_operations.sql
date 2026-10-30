create or replace function public.validate_item_values(
  p_collection_id uuid,
  p_values jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  field_record record;
  value jsonb;
begin
  if jsonb_typeof(p_values) <> 'object' then
    raise exception 'Item values must be an object' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_object_keys(p_values) as submitted(field_id)
    where not exists (
      select 1 from public.field_definitions fields
      where fields.collection_id = p_collection_id
        and fields.id::text = submitted.field_id
    )
  ) then
    raise exception 'Item contains an unknown field' using errcode = '22023';
  end if;

  for field_record in
    select id, name, type, required
    from public.field_definitions
    where collection_id = p_collection_id
  loop
    value := p_values -> field_record.id::text;
    if value is null then
      if field_record.required then
        raise exception 'A required Item field is missing' using errcode = '23514';
      end if;
      continue;
    end if;

    if field_record.type in ('text', 'date', 'select', 'url')
      and jsonb_typeof(value) <> 'string' then
      raise exception 'Item field has the wrong type' using errcode = '22023';
    end if;
    if field_record.type in ('number', 'rating')
      and jsonb_typeof(value) <> 'number' then
      raise exception 'Item field has the wrong type' using errcode = '22023';
    end if;
    if field_record.type = 'date'
      and ((value #>> '{}') !~ '^\d{4}-\d{2}-\d{2}$'
        or to_char(to_date(value #>> '{}', 'YYYY-MM-DD'), 'YYYY-MM-DD') <> value #>> '{}') then
      raise exception 'Item date is invalid' using errcode = '22023';
    end if;
    if field_record.type = 'rating'
      and ((value #>> '{}')::numeric <> trunc((value #>> '{}')::numeric)
        or (value #>> '{}')::integer not between 1 and 5) then
      raise exception 'Item rating is invalid' using errcode = '22023';
    end if;
    if field_record.type = 'select'
      and not exists (
        select 1 from public.field_options options
        where options.field_id = field_record.id
          and options.id::text = value #>> '{}'
      ) then
      raise exception 'Item Select option is invalid' using errcode = '22023';
    end if;
    if field_record.type = 'url'
      and (value #>> '{}') !~ '^https?://[^[:space:]]+$' then
      raise exception 'Item URL is invalid' using errcode = '22023';
    end if;
  end loop;
end;
$$;

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
declare
  created_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.collections
    where id = p_collection_id and owner_id = auth.uid()
  ) then
    return null;
  end if;
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
declare
  updated_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.collections
    where id = p_collection_id and owner_id = auth.uid()
  ) then
    return null;
  end if;
  perform public.validate_item_values(p_collection_id, p_values);
  update public.items
  set title = p_title, description = p_description, values = p_values
  where id = p_item_id and collection_id = p_collection_id
  returning id into updated_id;
  return updated_id;
end;
$$;

revoke all on function public.validate_item_values(uuid, jsonb) from public;
revoke all on function public.create_item_with_values(uuid, text, text, jsonb) from public;
revoke all on function public.update_item_with_values(uuid, uuid, text, text, jsonb) from public;
grant execute on function public.create_item_with_values(uuid, text, text, jsonb) to authenticated;
grant execute on function public.update_item_with_values(uuid, uuid, text, text, jsonb) to authenticated;
