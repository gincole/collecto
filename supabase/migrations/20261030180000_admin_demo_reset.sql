create table public.demo_seed_runs (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  seeded_at timestamptz not null default now()
);
alter table public.demo_seed_runs enable row level security;
revoke all on public.demo_seed_runs from public, anon, authenticated;
grant all on public.demo_seed_runs to service_role;

create or replace function public.seed_demo_library(
  p_owner_id uuid, p_expected_email text, p_collections jsonb,
  p_reset boolean default false, p_confirm_owner_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c jsonb; f jsonb; o jsonb; i jsonb;
begin
  if p_owner_id is null or p_expected_email is null or not exists (
    select 1 from auth.users where id = p_owner_id and lower(email) = lower(p_expected_email)
  ) then raise exception 'Demo owner confirmation failed' using errcode = '22023'; end if;
  if p_reset and p_confirm_owner_id is distinct from p_owner_id then
    raise exception 'Reset requires owner confirmation' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_owner_id::text, 0));
  -- Block new Collection FK inserts and serialize current writes before taking
  -- the image cleanup snapshot. Image attachment itself locks Item rows.
  perform 1 from auth.users where id = p_owner_id for update;
  if not p_reset and exists (select 1 from public.demo_seed_runs where owner_id = p_owner_id) then
    return jsonb_build_object('status', 'unchanged');
  end if;
  if not p_reset and exists (select 1 from public.collections where owner_id = p_owner_id) then
    raise exception 'Demo owner already has data; explicit reset required' using errcode = '22023';
  end if;
  if p_collections is null or jsonb_typeof(p_collections) <> 'array' or jsonb_array_length(p_collections) <> 3 then
    raise exception 'Invalid demo fixture' using errcode = '22023';
  end if;
  if p_reset then
    perform 1 from public.collections where owner_id = p_owner_id for update;
    perform 1 from public.items
    join public.collections on collections.id = items.collection_id
    where collections.owner_id = p_owner_id for update of items;
    insert into public.storage_cleanup_jobs(owner_id, collection_id, item_id, object_path)
    select p_owner_id, items.collection_id, items.id, items.image_path
    from public.items join public.collections on collections.id = items.collection_id
    where collections.owner_id = p_owner_id and items.image_path is not null;
    delete from public.collections where owner_id = p_owner_id;
  end if;
  for c in select value from jsonb_array_elements(p_collections) loop
    if jsonb_typeof(c) is distinct from 'object'
      or jsonb_typeof(c->'items') is distinct from 'array'
      or jsonb_typeof(c->'fields') is distinct from 'array'
      or jsonb_typeof(c->'viewConfig') is distinct from 'object' then
      raise exception 'Invalid demo fixture shape' using errcode = '22023';
    end if;
    if jsonb_array_length(c->'items') <> 6 or jsonb_array_length(c->'fields') > 30 then
      raise exception 'Invalid demo item count' using errcode = '22023';
    end if;
    insert into public.collections(id, owner_id, name, description, preset_key, view_config)
    values ((c->>'id')::uuid, p_owner_id, c->>'name', c->>'description', c->>'presetKey', c->'viewConfig');
    for f in select value from jsonb_array_elements(c->'fields') loop
      if jsonb_typeof(f->'options') is distinct from 'array' then
        raise exception 'Invalid demo options' using errcode = '22023';
      end if;
      if jsonb_array_length(f->'options') > 50
        or (f->>'type' <> 'select' and jsonb_array_length(f->'options') <> 0) then
        raise exception 'Invalid demo options' using errcode = '22023';
      end if;
      insert into public.field_definitions(id, collection_id, name, type, required, position)
      values ((f->>'id')::uuid, (c->>'id')::uuid, f->>'name', (f->>'type')::public.field_type, (f->>'required')::boolean, (f->>'position')::integer);
      for o in select value from jsonb_array_elements(f->'options') loop
        insert into public.field_options(id, field_id, label, position)
        values ((o->>'id')::uuid, (f->>'id')::uuid, o->>'label', (o->>'position')::integer);
      end loop;
    end loop;
    for i in select value from jsonb_array_elements(c->'items') loop
      perform public.validate_item_values((c->>'id')::uuid, i->'values');
      insert into public.items(id, collection_id, title, description, values)
      values ((i->>'id')::uuid, (c->>'id')::uuid, i->>'title', i->>'description', i->'values');
    end loop;
  end loop;
  insert into public.demo_seed_runs(owner_id) values(p_owner_id)
  on conflict(owner_id) do update set seeded_at = now();
  return jsonb_build_object('status', 'seeded', 'collections', 3, 'items', 18);
end;
$$;
revoke all on function public.seed_demo_library(uuid, text, jsonb, boolean, uuid) from public, anon, authenticated;
grant execute on function public.seed_demo_library(uuid, text, jsonb, boolean, uuid) to service_role;
