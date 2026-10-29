create type public.field_type as enum (
  'text',
  'number',
  'date',
  'rating',
  'select',
  'url'
);

create type public.cleanup_job_operation as enum ('delete');

create type public.cleanup_job_status as enum (
  'pending',
  'processing',
  'failed',
  'complete'
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  preset_key text,
  view_config jsonb not null default '{"columns":3,"aspectRatio":"3:4","imageFit":"cover","showDetails":true,"visibleFieldIds":["title"],"spacing":"normal","sortBy":"createdAt","sortDirection":"desc"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collections_name_length check (
    name = btrim(name) and char_length(name) between 1 and 100
  ),
  constraint collections_description_length check (
    description is null or (
      description = btrim(description)
      and char_length(description) between 1 and 1000
    )
  ),
  constraint collections_preset_key_valid check (
    preset_key is null or preset_key in (
      'book',
      'movie',
      'song',
      'merch',
      'shopping',
      'meal',
      'travel',
      'favorites',
      'blank'
    )
  ),
  constraint collections_view_config_object check (
    jsonb_typeof(view_config) = 'object'
  )
);

create table public.field_definitions (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  name text not null,
  type public.field_type not null,
  required boolean not null default false,
  position integer not null,
  created_at timestamptz not null default now(),
  constraint field_definitions_name_length check (
    name = btrim(name) and char_length(name) between 1 and 64
  ),
  constraint field_definitions_position_nonnegative check (position >= 0)
);

create table public.field_options (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.field_definitions (id) on delete cascade,
  label text not null,
  position integer not null,
  constraint field_options_label_length check (
    label = btrim(label) and char_length(label) between 1 and 64
  ),
  constraint field_options_position_nonnegative check (position >= 0)
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  title text not null,
  description text,
  image_path text,
  values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint items_title_length check (
    title = btrim(title) and char_length(title) between 1 and 200
  ),
  constraint items_description_length check (
    description is null or (
      description = btrim(description)
      and char_length(description) between 1 and 5000
    )
  ),
  constraint items_image_path_length check (
    image_path is null or (
      image_path = btrim(image_path)
      and char_length(image_path) between 1 and 1024
    )
  ),
  constraint items_values_object check (jsonb_typeof(values) = 'object')
);

create table public.storage_cleanup_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  collection_id uuid references public.collections (id) on delete set null,
  item_id uuid references public.items (id) on delete set null,
  object_path text not null,
  operation public.cleanup_job_operation not null default 'delete',
  status public.cleanup_job_status not null default 'pending',
  attempt_count integer not null default 0,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint storage_cleanup_jobs_object_path_length check (
    object_path = btrim(object_path)
    and char_length(object_path) between 1 and 1024
  ),
  constraint storage_cleanup_jobs_attempt_count_nonnegative check (
    attempt_count >= 0
  ),
  constraint storage_cleanup_jobs_last_error_code_length check (
    last_error_code is null or (
      last_error_code = btrim(last_error_code)
      and char_length(last_error_code) between 1 and 100
    )
  )
);

create or replace function public.enforce_collection_field_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.collection_id = old.collection_id then
      return new;
    end if;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('collection-fields:' || new.collection_id::text, 0)
  );

  if (
    select count(*)
    from public.field_definitions
    where collection_id = new.collection_id
  ) >= 30 then
    raise exception 'A Collection cannot have more than 30 custom fields'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger field_definitions_enforce_limit
before insert or update of collection_id on public.field_definitions
for each row execute function public.enforce_collection_field_limit();

create or replace function public.enforce_select_option_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.field_id = old.field_id then
      return new;
    end if;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('select-options:' || new.field_id::text, 0)
  );

  if (
    select count(*)
    from public.field_options
    where field_id = new.field_id
  ) >= 50 then
    raise exception 'A Select field cannot have more than 50 options'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger field_options_enforce_limit
before insert or update of field_id on public.field_options
for each row execute function public.enforce_select_option_limit();

create unique index field_definitions_collection_name_unique
  on public.field_definitions (collection_id, lower(name));

create unique index field_options_field_label_unique
  on public.field_options (field_id, lower(label));

create index collections_owner_created_idx
  on public.collections (owner_id, created_at desc);

create unique index field_definitions_collection_position_idx
  on public.field_definitions (collection_id, position);

create unique index field_options_field_position_idx
  on public.field_options (field_id, position);

create index items_collection_created_idx
  on public.items (collection_id, created_at desc);

create index storage_cleanup_jobs_status_created_idx
  on public.storage_cleanup_jobs (status, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger collections_set_updated_at
before update on public.collections
for each row execute function public.set_updated_at();

create trigger items_set_updated_at
before update on public.items
for each row execute function public.set_updated_at();

create trigger storage_cleanup_jobs_set_updated_at
before update on public.storage_cleanup_jobs
for each row execute function public.set_updated_at();
