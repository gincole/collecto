# M7-T03 security and failure-path evidence

Verified against the local Supabase stack on 30 October 2026. No browser tests or hosted-data writes were performed. The Product/Technical Specification, AGENTS.md ownership/Storage requirements, and decisions B05/B08/B11 control this task. Existing policies and production application contracts are unchanged.

## Repeatable checks

Run from the repository root with local Supabase and Docker running:

```powershell
corepack pnpm test:database
corepack pnpm test:auth:ssr
corepack pnpm test:storage
corepack pnpm test:security:sessions
corepack pnpm test --maxWorkers=1
```

Database tests use rollback-only fixtures through the local `supabase_db_collecto` container. Override only its name with `LOCAL_SUPABASE_DB_CONTAINER` when needed. The runner treats SQL errors, incomplete or mismatched TAP plans, duplicate/out-of-order results, bailouts and failing TAP assertions as failures. It does not reset the database or apply migrations.

API tests discover credentials through local Supabase CLI status, or all three process-local `LOCAL_SUPABASE_URL`, `LOCAL_SUPABASE_PUBLISHABLE_KEY`, and `LOCAL_SUPABASE_SECRET_KEY` variables. The URL must be loopback; hosted URLs are rejected. Tests generate random users/passwords, never use the demo account, and remove their fixtures in finally blocks. Do not commit populated environment files or print status JSON or credentials.

## Acceptance coverage

| Requirement                                                                             | Executable evidence                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two-account table isolation, forged ownership, direct IDs, anonymous rejection          | SQL 001–003 and 009; sessions API verifies private Collection, Field, Option and Item reads plus forged owner insert and cross-owner mutation rejection                                                                                                                                   |
| Atomic Collection schema and owner-scoped request idempotency                           | SQL 004; sessions API submits concurrent identical requests through separate authenticated clients and checks one Collection                                                                                                                                                              |
| Collection/Item deletion confirmation and durable image cleanup                         | SQL 005, 007–008; Collection/Item action and cleanup tests                                                                                                                                                                                                                                |
| Current-schema Item values, types, unknown keys, foreign/stale options                  | SQL 006 and 009; Item schemas/services and draft schema validation tests                                                                                                                                                                                                                  |
| Field/Option create, update, order, impact and delete authorization                     | SQL 009, including persisted type immutability and another user's direct-ID RPC attempts                                                                                                                                                                                                  |
| Gallery config ownership, visible-field cap and foreign/stale IDs                       | SQL 010 and gallery service/action tests                                                                                                                                                                                                                                                  |
| Private Storage upload, replacement, signing, download, deletion and cross-owner denial | SQL 003 and 007; Storage API verifies bytes remain intact after rejected cross-owner replacement/deletion and public reads fail                                                                                                                                                           |
| SSR session persistence and refresh                                                     | SSR API test signs in, reconstructs requests from cookie state, refreshes, and validates subsequent requests                                                                                                                                                                              |
| Shared writable sessions and last-write-wins                                            | Sessions API uses two independent logins for the same temporary owner, reads a shared snapshot, commits edits in defined order, and verifies the second value through the first session                                                                                                   |
| Stale shared state after concurrent removal                                             | Sessions API deletes an Option in session A, rejects session B's stale Item update without overwriting the last saved title, refreshes empty membership, then verifies a deleted Item cannot be recreated by stale update                                                                 |
| Logout isolation                                                                        | Sessions API logs out one session with local scope and checks the other session remains valid                                                                                                                                                                                             |
| Storage/database failure permutations                                                   | Image lifecycle tests cover failed uploads, rejected database attachment, new-object cleanup, lost commit responses, unreadable commit state, unavailable reconciliation queue, old-object deletion failure and lost queue acknowledgement                                                |
| Cleanup retry and admin authorization                                                   | Cleanup worker tests verify claiming, completed jobs, safe failure codes, retries and preserving referenced objects; real Route Handler tests reject missing/wrong credentials before invoking the worker and return sanitized failure responses                                          |
| Sensitive failure output                                                                | Gateway logging tests require operation/code only for Collection/Item/Field failures; cleanup Route Handler tests exclude provider message, authorization secret, private content and signed-URL markers from response/logs; auth callback and return-path tests prevent unsafe redirects |

The concurrency contract is deliberately last-write-wins. Parallel creation is exercised concurrently; edits use controlled commit order rather than relying on scheduler timing. The tests verify same-owner session semantics with disposable users. Seeded-demo creation, shared-data disclosure and admin reset remain M8-T01 work. Browser journey acceptance and real viewport checks remain explicitly separate under M7-T02.

Fault-injection unit tests model provider outages; they do not interrupt a running database or Storage service. Live local SQL/API tests verify the actual RLS/RPC/Storage boundaries. No claim is made about hosted configuration or production deployment verification.
