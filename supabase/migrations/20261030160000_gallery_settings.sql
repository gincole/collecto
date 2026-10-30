create or replace function public.update_gallery_config(p_collection_id uuid, p_config jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Match Field mutation locking so deleted references cannot be restored by a stale Save.
  perform 1 from public.collections
  where id = p_collection_id and owner_id = auth.uid()
  for update;
  if not found then return null; end if;

  if p_config is null or jsonb_typeof(p_config) <> 'object'
    or not (p_config ?& array['columns','aspectRatio','imageFit','showDetails','visibleFieldIds','spacing','sortBy','sortDirection'])
    or jsonb_typeof(p_config -> 'visibleFieldIds') <> 'array' then
    raise exception 'Invalid gallery configuration' using errcode = '22023';
  end if;
  if jsonb_typeof(p_config -> 'columns') <> 'number'
    or (p_config ->> 'columns') !~ '^[1-5]$'
    or coalesce(p_config ->> 'aspectRatio', '') not in ('1:1','2:3','3:4','4:3','16:9')
    or coalesce(p_config ->> 'imageFit', '') not in ('cover','contain')
    or jsonb_typeof(p_config -> 'showDetails') <> 'boolean'
    or coalesce(p_config ->> 'spacing', '') not in ('tight','normal')
    or coalesce(p_config ->> 'sortBy', '') not in ('createdAt','title')
    or coalesce(p_config ->> 'sortDirection', '') not in ('asc','desc')
    or jsonb_array_length(p_config -> 'visibleFieldIds') > 3
    or exists (select 1 from jsonb_array_elements(p_config -> 'visibleFieldIds') e where jsonb_typeof(e) <> 'string')
    or (select count(*) <> count(distinct e) from jsonb_array_elements_text(p_config -> 'visibleFieldIds') e)
    or exists (
      select 1 from jsonb_array_elements_text(p_config -> 'visibleFieldIds') e
      where e not in ('title','description') and not exists (
        select 1 from public.field_definitions f where f.collection_id = p_collection_id and f.id::text = e
      )
    ) then
    raise exception 'Invalid gallery configuration' using errcode = '22023';
  end if;
  update public.collections set view_config = p_config where id = p_collection_id;
  return p_collection_id;
end;
$$;

revoke all on function public.update_gallery_config(uuid, jsonb) from public, anon;
grant execute on function public.update_gallery_config(uuid, jsonb) to authenticated;
