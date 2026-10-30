begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(10);

insert into auth.users (id, email) values
  ('a0000000-0000-4000-8000-000000000001', 'gallery-a@example.invalid'),
  ('a0000000-0000-4000-8000-000000000002', 'gallery-b@example.invalid');
insert into public.collections (id, owner_id, name) values
  ('a1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Gallery'),
  ('a1000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'Private');
insert into public.field_definitions (id, collection_id, name, type, position) values
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Notes', 'text', 0);

select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
set local role authenticated;

select extensions.is(public.update_gallery_config('a1000000-0000-4000-8000-000000000001', '{"columns":5,"aspectRatio":"16:9","imageFit":"contain","showDetails":false,"visibleFieldIds":["description","a2000000-0000-4000-8000-000000000001","title"],"spacing":"tight","sortBy":"title","sortDirection":"asc"}'), 'a1000000-0000-4000-8000-000000000001'::uuid, 'owner can save full settings');
select extensions.is((select view_config -> 'visibleFieldIds' from public.collections where id = 'a1000000-0000-4000-8000-000000000001'), '["description","a2000000-0000-4000-8000-000000000001","title"]'::jsonb, 'details OFF preserves field order');
select extensions.is(public.update_gallery_config('a1000000-0000-4000-8000-000000000002', '{}'), null::uuid, 'foreign Collection is unavailable');
select extensions.throws_ok($$select public.update_gallery_config('a1000000-0000-4000-8000-000000000001', '{}')$$, '22023', 'Invalid gallery configuration', 'malformed config rejected');
select extensions.throws_ok($$select public.update_gallery_config('a1000000-0000-4000-8000-000000000001', (select jsonb_set(view_config, '{aspectRatio}', 'null') from public.collections where id = 'a1000000-0000-4000-8000-000000000001'))$$, '22023', 'Invalid gallery configuration', 'JSON null enum rejected');
select extensions.throws_ok($$select public.update_gallery_config('a1000000-0000-4000-8000-000000000001', (select jsonb_set(view_config, '{visibleFieldIds}', '["title","title"]') from public.collections where id = 'a1000000-0000-4000-8000-000000000001'))$$, '22023', 'Invalid gallery configuration', 'duplicate references rejected');
select extensions.throws_ok($$select public.update_gallery_config('a1000000-0000-4000-8000-000000000001', (select jsonb_set(view_config, '{visibleFieldIds}', '["title","description","a2000000-0000-4000-8000-000000000001","a2000000-0000-4000-8000-000000000002"]') from public.collections where id = 'a1000000-0000-4000-8000-000000000001'))$$, '22023', 'Invalid gallery configuration', 'four references rejected');
select public.delete_field_with_cleanup('a1000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001');
select extensions.throws_ok($$select public.update_gallery_config('a1000000-0000-4000-8000-000000000001', (select jsonb_set(view_config, '{visibleFieldIds}', '["a2000000-0000-4000-8000-000000000001"]') from public.collections where id = 'a1000000-0000-4000-8000-000000000001'))$$, '22023', 'Invalid gallery configuration', 'stale Save cannot restore deleted Field');
select extensions.is((select view_config -> 'visibleFieldIds' from public.collections where id = 'a1000000-0000-4000-8000-000000000001'), '["description","title"]'::jsonb, 'rejected Save preserves cleaned configuration');
reset role;
set local role anon;
select extensions.throws_ok($$select public.update_gallery_config('a1000000-0000-4000-8000-000000000001', '{}')$$, '42501', null, 'anonymous callers denied');
select * from extensions.finish();
rollback;
