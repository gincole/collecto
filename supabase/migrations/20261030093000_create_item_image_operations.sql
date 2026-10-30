create or replace function public.set_item_image_path(
  p_collection_id uuid,
  p_item_id uuid,
  p_image_path text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_old_path text;
  v_cleanup_id uuid;
begin
  if v_owner_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_image_path is not null and p_image_path !~* (
    '^' || v_owner_id || '/' || p_collection_id || '/' || p_item_id ||
    '/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
  ) then
    raise exception 'Invalid item image path' using errcode = '22023';
  end if;

  select items.image_path into v_old_path
  from public.items
  join public.collections on collections.id = items.collection_id
  where items.id = p_item_id
    and items.collection_id = p_collection_id
    and collections.owner_id = v_owner_id
  for update of items;
  if not found then return null; end if;

  update public.items set image_path = p_image_path where id = p_item_id;
  if v_old_path is not null and v_old_path is distinct from p_image_path then
    insert into public.storage_cleanup_jobs (owner_id, collection_id, item_id, object_path)
    values (v_owner_id, p_collection_id, p_item_id, v_old_path)
    returning id into v_cleanup_id;
  end if;
  return jsonb_build_object('old_path', v_old_path, 'cleanup_job_id', v_cleanup_id);
end;
$$;

create or replace function public.queue_item_image_cleanup(
  p_collection_id uuid,
  p_item_id uuid,
  p_object_path text,
  p_error_code text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_id uuid;
begin
  if v_owner_id is null or not exists (
    select 1 from public.collections
    where id = p_collection_id and owner_id = v_owner_id
  ) then return null; end if;
  if p_object_path !~* (
    '^' || v_owner_id || '/' || p_collection_id || '/' || p_item_id ||
    '/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
  ) then raise exception 'Invalid item image path' using errcode = '22023'; end if;
  insert into public.storage_cleanup_jobs (
    owner_id, collection_id, item_id, object_path, last_error_code
  ) values (
    v_owner_id, p_collection_id, p_item_id, p_object_path, left(p_error_code, 100)
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.complete_item_image_cleanup(p_job_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.storage_cleanup_jobs
  set status = 'complete', last_error_code = null
  where id = p_job_id and owner_id = auth.uid();
  return found;
end;
$$;

revoke all on function public.set_item_image_path(uuid, uuid, text) from public, anon;
revoke all on function public.queue_item_image_cleanup(uuid, uuid, text, text) from public, anon;
revoke all on function public.complete_item_image_cleanup(uuid) from public, anon;
grant execute on function public.set_item_image_path(uuid, uuid, text) to authenticated;
grant execute on function public.queue_item_image_cleanup(uuid, uuid, text, text) to authenticated;
grant execute on function public.complete_item_image_cleanup(uuid) to authenticated;
