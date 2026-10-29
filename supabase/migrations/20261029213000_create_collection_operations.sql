alter table public.collections
add column creation_request_id uuid not null default gen_random_uuid();

create unique index collections_owner_creation_request_unique
on public.collections (owner_id, creation_request_id);

create or replace function public.create_collection_with_schema(
  p_request_id uuid,
  p_name text,
  p_description text,
  p_preset_key text,
  p_view_config jsonb,
  p_fields jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_field record;
  v_inserted integer;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_request_id is null
    or p_fields is null
    or jsonb_typeof(p_fields) <> 'array'
    or jsonb_array_length(p_fields) > 30 then
    raise exception 'Invalid Collection fields' using errcode = '22023';
  end if;

  if p_view_config is null
    or jsonb_typeof(p_view_config) <> 'object'
    or not (
      p_view_config ?& array[
        'columns',
        'aspectRatio',
        'imageFit',
        'showDetails',
        'visibleFieldIds',
        'spacing',
        'sortBy',
        'sortDirection'
      ]
    )
    or jsonb_typeof(p_view_config -> 'columns') <> 'number'
    or (p_view_config ->> 'columns') !~ '^[1-5]$'
    or (p_view_config ->> 'aspectRatio') not in ('1:1', '2:3', '3:4', '4:3', '16:9')
    or (p_view_config ->> 'imageFit') not in ('cover', 'contain')
    or jsonb_typeof(p_view_config -> 'showDetails') <> 'boolean'
    or jsonb_typeof(p_view_config -> 'visibleFieldIds') <> 'array'
    or jsonb_array_length(p_view_config -> 'visibleFieldIds') > 3
    or (p_view_config ->> 'spacing') not in ('tight', 'normal')
    or (p_view_config ->> 'sortBy') not in ('createdAt', 'title')
    or (p_view_config ->> 'sortDirection') not in ('asc', 'desc')
    or exists (
      select 1
      from jsonb_array_elements(p_view_config -> 'visibleFieldIds') as visible(value)
      where jsonb_typeof(visible.value) <> 'string'
    )
    or (
      select count(*) <> count(distinct visible.value)
      from jsonb_array_elements_text(p_view_config -> 'visibleFieldIds') as visible(value)
    )
    or exists (
      select 1
      from jsonb_array_elements_text(p_view_config -> 'visibleFieldIds') as visible(value)
      where visible.value not in ('title', 'description')
        and not exists (
          select 1
          from jsonb_array_elements(p_fields) as field_data(value)
          where field_data.value ->> 'id' = visible.value
        )
    ) then
    raise exception 'Invalid gallery configuration' using errcode = '22023';
  end if;

  insert into public.collections (
    owner_id,
    creation_request_id,
    name,
    description,
    preset_key,
    view_config
  ) values (
    v_user_id,
    p_request_id,
    p_name,
    p_description,
    p_preset_key,
    p_view_config
  )
  on conflict (owner_id, creation_request_id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    return (
      select id
      from public.collections
      where owner_id = v_user_id
        and creation_request_id = p_request_id
    );
  end if;

  for v_field in
    select *
    from jsonb_to_recordset(p_fields) as field_data(
      id uuid,
      name text,
      type public.field_type,
      required boolean,
      position integer,
      options jsonb
    )
  loop
    if v_field.id is null
      or v_field.name is null
      or v_field.type is null
      or v_field.required is null
      or v_field.position is null
      or v_field.options is null
      or jsonb_typeof(v_field.options) <> 'array'
      or jsonb_array_length(v_field.options) > 50
      or (v_field.type <> 'select' and jsonb_array_length(v_field.options) <> 0) then
      raise exception 'Invalid Collection field' using errcode = '22023';
    end if;

    insert into public.field_definitions (
      id,
      collection_id,
      name,
      type,
      required,
      position
    ) values (
      v_field.id,
      (
        select id
        from public.collections
        where owner_id = v_user_id
          and creation_request_id = p_request_id
      ),
      v_field.name,
      v_field.type,
      v_field.required,
      v_field.position
    );

    insert into public.field_options (id, field_id, label, position)
    select option_data.id, v_field.id, option_data.label, option_data.position
    from jsonb_to_recordset(v_field.options) as option_data(
      id uuid,
      label text,
      position integer
    );
  end loop;

  return (
    select id
    from public.collections
    where owner_id = v_user_id
      and creation_request_id = p_request_id
  );
end;
$$;

revoke all on function public.create_collection_with_schema(
  uuid,
  text,
  text,
  text,
  jsonb,
  jsonb
) from public, anon;

grant execute on function public.create_collection_with_schema(
  uuid,
  text,
  text,
  text,
  jsonb,
  jsonb
) to authenticated;
