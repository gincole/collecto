begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(1);

insert into auth.users (id, email) values ('60000000-0000-0000-0000-000000000001', 'items-a@example.invalid');
insert into public.collections (id, owner_id, name, preset_key) values ('61000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'Items', 'blank');
insert into public.field_definitions (id, collection_id, name, type, required, position) values
  ('62000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', 'Rating', 'rating', true, 0);

select set_config('request.jwt.claim.sub', '60000000-0000-0000-0000-000000000001', true);
set local role authenticated;

do $$
declare item_id uuid;
begin
  item_id := public.create_item_with_values('61000000-0000-0000-0000-000000000001', 'Created', null, '{"62000000-0000-0000-0000-000000000001":5}');
  if item_id is null then raise exception 'Item creation failed'; end if;
  if public.update_item_with_values('61000000-0000-0000-0000-000000000001', item_id, 'Updated', null, '{"62000000-0000-0000-0000-000000000001":4}') <> item_id then raise exception 'Item update failed'; end if;
  if (select title from public.items where id = item_id) <> 'Updated' then raise exception 'Updated Item did not persist'; end if;
  begin
    perform public.update_item_with_values('61000000-0000-0000-0000-000000000001', item_id, 'Invalid', null, '{}');
    raise exception 'Missing required value was accepted';
  exception when check_violation then null;
  end;
end;
$$;

select extensions.pass('Item create and update validate the current owned schema atomically');
select * from extensions.finish();
rollback;
