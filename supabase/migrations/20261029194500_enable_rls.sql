alter table public.collections enable row level security;
alter table public.field_definitions enable row level security;
alter table public.field_options enable row level security;
alter table public.items enable row level security;
alter table public.storage_cleanup_jobs enable row level security;

revoke all on table public.collections from anon;
revoke all on table public.field_definitions from anon;
revoke all on table public.field_options from anon;
revoke all on table public.items from anon;
revoke all on table public.storage_cleanup_jobs from anon, authenticated;

grant select, insert, update, delete on table public.collections to authenticated;
grant select, insert, update, delete on table public.field_definitions to authenticated;
grant select, insert, update, delete on table public.field_options to authenticated;
grant select, insert, update, delete on table public.items to authenticated;

create policy "owners can read their collections"
on public.collections
for select
to authenticated
using (owner_id = (select auth.uid()));

create policy "owners can create their collections"
on public.collections
for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "owners can update their collections"
on public.collections
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "owners can delete their collections"
on public.collections
for delete
to authenticated
using (owner_id = (select auth.uid()));

create policy "owners can read their field definitions"
on public.field_definitions
for select
to authenticated
using (
  exists (
    select 1
    from public.collections
    where collections.id = field_definitions.collection_id
      and collections.owner_id = (select auth.uid())
  )
);

create policy "owners can create their field definitions"
on public.field_definitions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.collections
    where collections.id = field_definitions.collection_id
      and collections.owner_id = (select auth.uid())
  )
);

create policy "owners can update their field definitions"
on public.field_definitions
for update
to authenticated
using (
  exists (
    select 1
    from public.collections
    where collections.id = field_definitions.collection_id
      and collections.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.collections
    where collections.id = field_definitions.collection_id
      and collections.owner_id = (select auth.uid())
  )
);

create policy "owners can delete their field definitions"
on public.field_definitions
for delete
to authenticated
using (
  exists (
    select 1
    from public.collections
    where collections.id = field_definitions.collection_id
      and collections.owner_id = (select auth.uid())
  )
);

create policy "owners can read their field options"
on public.field_options
for select
to authenticated
using (
  exists (
    select 1
    from public.field_definitions
    join public.collections
      on collections.id = field_definitions.collection_id
    where field_definitions.id = field_options.field_id
      and collections.owner_id = (select auth.uid())
  )
);

create policy "owners can create their field options"
on public.field_options
for insert
to authenticated
with check (
  exists (
    select 1
    from public.field_definitions
    join public.collections
      on collections.id = field_definitions.collection_id
    where field_definitions.id = field_options.field_id
      and collections.owner_id = (select auth.uid())
  )
);

create policy "owners can update their field options"
on public.field_options
for update
to authenticated
using (
  exists (
    select 1
    from public.field_definitions
    join public.collections
      on collections.id = field_definitions.collection_id
    where field_definitions.id = field_options.field_id
      and collections.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.field_definitions
    join public.collections
      on collections.id = field_definitions.collection_id
    where field_definitions.id = field_options.field_id
      and collections.owner_id = (select auth.uid())
  )
);

create policy "owners can delete their field options"
on public.field_options
for delete
to authenticated
using (
  exists (
    select 1
    from public.field_definitions
    join public.collections
      on collections.id = field_definitions.collection_id
    where field_definitions.id = field_options.field_id
      and collections.owner_id = (select auth.uid())
  )
);

create policy "owners can read their items"
on public.items
for select
to authenticated
using (
  exists (
    select 1
    from public.collections
    where collections.id = items.collection_id
      and collections.owner_id = (select auth.uid())
  )
);

create policy "owners can create their items"
on public.items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.collections
    where collections.id = items.collection_id
      and collections.owner_id = (select auth.uid())
  )
);

create policy "owners can update their items"
on public.items
for update
to authenticated
using (
  exists (
    select 1
    from public.collections
    where collections.id = items.collection_id
      and collections.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.collections
    where collections.id = items.collection_id
      and collections.owner_id = (select auth.uid())
  )
);

create policy "owners can delete their items"
on public.items
for delete
to authenticated
using (
  exists (
    select 1
    from public.collections
    where collections.id = items.collection_id
      and collections.owner_id = (select auth.uid())
  )
);
