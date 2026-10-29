# Database Design

## Principles

- Every Collection is private and owned by exactly one Supabase Auth user.
- Child ownership is derived through the parent Collection.
- RLS is mandatory defense in depth; application checks do not replace it.
- Presets live in application code and are copied into independently editable rows at final Collection creation.
- Stable UUIDs preserve values and navigation across label changes.
- Database cascades do not imply atomic Supabase Storage cleanup.

## Entity relationship overview

```text
auth.users 1 ── N collections
collections 1 ── N field_definitions
field_definitions 1 ── N field_options
collections 1 ── N items
collections 1 ── N storage_cleanup_jobs
items 1 ── N storage_cleanup_jobs (optional item reference)
```

No Folder table exists. Browse folders are query results derived from Select fields and option IDs.

## Tables

Application validation limits are fixed for the MVP: Collection name 100 characters, Collection description 1,000, Item title 200, Item description 5,000, Field name 64, Select option label 64, and URL 2,048. A Collection may have at most 30 custom fields; a Select field may have at most 50 options. Database text checks should enforce the same maximums where practical.

### collections

| Column        | Contract                                                     |
| ------------- | ------------------------------------------------------------ |
| `id`          | UUID primary key, generated                                  |
| `owner_id`    | UUID not null, references `auth.users`                       |
| `name`        | Required trimmed text; application maximum defined in M1-T01 |
| `description` | Nullable text                                                |
| `preset_key`  | Nullable approved preset key                                 |
| `view_config` | JSONB not null with approved default                         |
| `created_at`  | UTC timestamptz not null                                     |
| `updated_at`  | UTC timestamptz not null and maintained on update            |

Index `(owner_id, created_at desc)`. Application validation enforces the full view-config schema; practical database checks protect top-level JSON shape.

### field_definitions

| Column          | Contract                                                   |
| --------------- | ---------------------------------------------------------- |
| `id`            | UUID primary key                                           |
| `collection_id` | UUID not null, references Collections with cascade delete  |
| `name`          | Required trimmed text                                      |
| `type`          | One of `text`, `number`, `date`, `rating`, `select`, `url` |
| `required`      | Boolean not null, default false                            |
| `position`      | Non-negative integer not null                              |
| `created_at`    | UTC timestamptz not null                                   |

Unique case-insensitive field names per Collection and unique positions per Collection. Type is immutable in MVP and enforced by application mutation design; a database trigger may protect it if the implementation remains clear and testable.

### field_options

| Column     | Contract                                                        |
| ---------- | --------------------------------------------------------------- |
| `id`       | UUID primary key                                                |
| `field_id` | UUID not null, references Field Definitions with cascade delete |
| `label`    | Required trimmed text                                           |
| `position` | Non-negative integer not null                                   |

Unique case-insensitive labels and unique positions per Field. Application and tests ensure options exist only for Select fields.

### items

| Column          | Contract                                                  |
| --------------- | --------------------------------------------------------- |
| `id`            | UUID primary key                                          |
| `collection_id` | UUID not null, references Collections with cascade delete |
| `title`         | Required trimmed text                                     |
| `description`   | Nullable text                                             |
| `image_path`    | Nullable private Storage object path                      |
| `values`        | JSONB not null, default empty object                      |
| `created_at`    | UTC timestamptz not null                                  |
| `updated_at`    | UTC timestamptz not null and maintained on update         |

Index `(collection_id, created_at desc)`. JSONB keys are stable Field UUID strings. Select values are stable Option UUID strings. Empty optional values are omitted. Current-schema validation occurs server-side because cross-table JSONB membership cannot be fully expressed as a simple check.

### storage_cleanup_jobs

This table records non-atomic Storage cleanup work so failures are never silently lost.

| Column            | Contract                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `id`              | UUID primary key                                                                                 |
| `owner_id`        | UUID not null                                                                                    |
| `collection_id`   | Nullable UUID; retain safe context even if Collection is deleted according to chosen FK behavior |
| `item_id`         | Nullable UUID                                                                                    |
| `object_path`     | Required private object path                                                                     |
| `operation`       | `delete` in MVP                                                                                  |
| `status`          | `pending`, `processing`, `failed`, or `complete`                                                 |
| `attempt_count`   | Non-negative integer                                                                             |
| `last_error_code` | Nullable safe code, never raw secret-bearing error text                                          |
| `created_at`      | UTC timestamptz                                                                                  |
| `updated_at`      | UTC timestamptz                                                                                  |

Only protected server/admin workflows may access cleanup jobs. The precise FK strategy must preserve retry data after parent deletion and is finalized in M1-T01 with a migration test.

## Gallery view configuration

Canonical JSON shape:

```json
{
  "columns": 3,
  "aspectRatio": "3:4",
  "imageFit": "cover",
  "showDetails": true,
  "visibleFieldIds": ["title"],
  "spacing": "normal",
  "sortBy": "createdAt",
  "sortDirection": "desc"
}
```

Validation rules:

- `columns`: integer 1–5.
- `aspectRatio`: `1:1`, `2:3`, `3:4`, `4:3`, or `16:9`.
- `imageFit`: `cover` or `contain`.
- `showDetails`: boolean. Turning it off does not clear `visibleFieldIds`.
- `visibleFieldIds`: zero to three unique entries; built-ins `title` and `description` or current Field UUIDs belonging to the Collection.
- `spacing`: `tight` or `normal`.
- Sort combinations represent newest, oldest, title A–Z, and title Z–A. Creation timestamp and Item UUID provide deterministic tie-breaks.

Field deletion removes its ID from the configuration and preserves the remaining order.

## RLS policy matrix

| Resource          | Select                              | Insert                                   | Update                                  | Delete                              |
| ----------------- | ----------------------------------- | ---------------------------------------- | --------------------------------------- | ----------------------------------- |
| Collections       | `owner_id = auth.uid()`             | `owner_id = auth.uid()` via `WITH CHECK` | owner match in `USING` and `WITH CHECK` | owner match                         |
| Field Definitions | parent Collection owner             | parent Collection owner                  | parent Collection owner                 | parent Collection owner             |
| Field Options     | owner through Field then Collection | owner through Field then Collection      | owner through Field then Collection     | owner through Field then Collection |
| Items             | parent Collection owner             | parent Collection owner                  | parent Collection owner                 | parent Collection owner             |
| Cleanup Jobs      | no direct user access by default    | protected server/admin workflow          | protected server/admin workflow         | protected server/admin workflow     |

Policy tests must cover list and direct-ID operations for two users. An unauthorized response must not reveal whether a record belongs to someone else.

## Storage design

- Bucket: `item-images`, private.
- Path: `userId/collectionId/itemId/randomUUID.ext`.
- Accepted formats: JPEG, PNG, WebP.
- Maximum file size: 5 MB.
- Verify MIME type and decodability at a trusted boundary.
- Store only `image_path` in Items.
- Issue short-lived signed URLs or use an authenticated route after ownership verification.
- Never use original filenames in paths.

### Non-atomic workflows

Upload:

1. Authenticate and verify Collection ownership and current Item schema.
2. Validate image.
3. Upload to the generated private path.
4. Write the Item or image path.
5. If the database write fails, delete the uploaded object; if cleanup fails, record a cleanup job.

Replace:

1. Upload and validate the new object.
2. Atomically update the Item row to the new path.
3. Delete the old object; record retry work on failure.

Delete Item or Collection:

1. Collect owned object paths or create cleanup records while ownership context exists.
2. Delete database records using cascades.
3. Delete objects and mark cleanup complete, or retain failed jobs for protected retry.

Never claim cross-service atomicity.

## Mutation invariants

- Server derives owner identity from the authenticated session.
- Field type cannot change after creation.
- Required fields are enforced on subsequent Item saves; pre-existing missing values may remain until edited.
- Field deletion warns when populated, removes matching JSONB keys, and removes gallery references.
- Option deletion warns when populated and clears matching Item values, causing Uncategorized membership.
- Renames change labels only and preserve stable IDs.
- Reordering updates positions transactionally and results in unique contiguous positions.

## Migration and verification strategy

- Use timestamped, forward-only Supabase migrations.
- Apply migrations to a clean local database before connected environments.
- Generate TypeScript database types after schema changes and review the diff.
- Test constraints, cascades, indexes, RLS, Storage policies, and cleanup failure paths.
- Never edit a migration already applied to a shared environment; add a new migration.
