begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(5);

select extensions.ok(
  not has_function_privilege('anon', 'public.seed_demo_library(uuid,text,jsonb,boolean,uuid)', 'EXECUTE'),
  'anonymous visitors cannot seed or reset demo data'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'public.seed_demo_library(uuid,text,jsonb,boolean,uuid)', 'EXECUTE'),
  'signed-in visitors cannot seed or reset demo data'
);
select extensions.ok(
  has_function_privilege('service_role', 'public.seed_demo_library(uuid,text,jsonb,boolean,uuid)', 'EXECUTE'),
  'server admin can execute seed/reset'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.demo_seed_runs', 'SELECT,INSERT,UPDATE,DELETE'),
  'seed markers are not exposed to signed-in visitors'
);
select extensions.ok(
  (select relrowsecurity from pg_class where oid = 'public.demo_seed_runs'::regclass),
  'seed marker table enables row level security'
);

select * from extensions.finish();
rollback;
