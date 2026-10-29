create or replace function public.delete_collection_with_cleanup(
  p_collection_id uuid,
  p_confirmation_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_collection public.collections%rowtype;
  v_image_count integer;
  v_item_count integer;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_collection
  from public.collections
  where id = p_collection_id
    and owner_id = v_user_id
  for update;

  if not found then
    return null;
  end if;

  select count(*) into v_item_count
  from public.items
  where collection_id = v_collection.id;

  if v_item_count > 0 and p_confirmation_name is distinct from v_collection.name then
    raise exception 'Collection name confirmation does not match'
      using errcode = '22023';
  end if;

  insert into public.storage_cleanup_jobs (
    owner_id,
    collection_id,
    item_id,
    object_path
  )
  select
    v_user_id,
    v_collection.id,
    items.id,
    items.image_path
  from public.items
  where items.collection_id = v_collection.id
    and items.image_path is not null;

  get diagnostics v_image_count = row_count;

  delete from public.collections
  where id = v_collection.id
    and owner_id = v_user_id;

  return jsonb_build_object(
    'id', v_collection.id,
    'scheduled_image_count', v_image_count
  );
end;
$$;

revoke all on function public.delete_collection_with_cleanup(uuid, text)
from public, anon;

grant execute on function public.delete_collection_with_cleanup(uuid, text)
to authenticated;

create or replace function public.claim_storage_cleanup_jobs(
  p_limit integer,
  p_stale_before timestamptz
)
returns table (id uuid, object_path text, attempt_count integer)
language sql
security definer
set search_path = ''
as $$
  update public.storage_cleanup_jobs
  set
    status = 'processing',
    attempt_count = storage_cleanup_jobs.attempt_count + 1,
    last_error_code = null
  where storage_cleanup_jobs.id in (
    select candidate.id
    from public.storage_cleanup_jobs as candidate
    where candidate.status in ('pending', 'failed')
      or (
        candidate.status = 'processing'
        and candidate.updated_at < p_stale_before
      )
    order by candidate.created_at
    limit greatest(1, least(p_limit, 100))
    for update skip locked
  )
  returning
    storage_cleanup_jobs.id,
    storage_cleanup_jobs.object_path,
    storage_cleanup_jobs.attempt_count;
$$;

revoke all on function public.claim_storage_cleanup_jobs(integer, timestamptz)
from public, anon, authenticated;

grant execute on function public.claim_storage_cleanup_jobs(integer, timestamptz)
to service_role;
