create or replace function public.delete_item_with_cleanup(
  p_collection_id uuid,
  p_item_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.items%rowtype;
  v_cleanup_job_id uuid;
  v_owner_id uuid := auth.uid();
begin
  if v_owner_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select items.* into v_item
  from public.items
  join public.collections on collections.id = items.collection_id
  where items.id = p_item_id
    and items.collection_id = p_collection_id
    and collections.owner_id = v_owner_id
  for update of items;

  if not found then return null; end if;

  if v_item.image_path is not null then
    insert into public.storage_cleanup_jobs (
      owner_id, collection_id, item_id, object_path
    ) values (
      v_owner_id, p_collection_id, p_item_id, v_item.image_path
    ) returning id into v_cleanup_job_id;
  end if;

  delete from public.items where id = v_item.id;

  return jsonb_build_object(
    'id', v_item.id,
    'image_path', v_item.image_path,
    'cleanup_job_id', v_cleanup_job_id
  );
end;
$$;

revoke all on function public.delete_item_with_cleanup(uuid, uuid)
from public, anon;
grant execute on function public.delete_item_with_cleanup(uuid, uuid)
to authenticated;
