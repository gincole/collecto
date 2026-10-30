# M8-T03A: Keep deployment artifacts out of source checks

## Failure and task boundary

The user's Vercel deployment of a39547b failed before compilation: the combined
verification command reached `prettier --check .`, scanned `.pnpm-store/v11` and
`.vercel/cache` / `.vercel/adapter-toolbar-script.js`, and exited with code 2.
Local checks did not contain those Vercel-generated artifacts. This explains why
the local verification passed while the hosted formatter failed; it does not
prove later cloud stages or runtime behavior succeed.

Scope: exclude only deployment/tool caches from Git, Prettier, ESLint and
TypeScript; retain all application checks. No formatting bypass, ignored source
errors, dependency upgrade, browser test, database change or hosted mutation.
References: AGENTS.md verification/secrets rules, M8-T02 release boundary, and
the user's failed-deployment logs. Product, UX and domain behavior are unchanged.

## Acceptance and regression checks

- Malformed files under root `.vercel` and `.pnpm-store` must not block formatting,
  lint or type checking. Real source errors must continue to fail checks.
- Generated tooling/config files must not become Git candidates.
- Keep Next-generated route types included for strict application validation.
- Use one checked-in deployment verification command to avoid dashboard drift.
- Verify from an isolated copy of current source, without `.env`, `.next` or
  next-env.d.ts, using placeholder public configuration and synthetic cloud cache
  files. Install frozen dependencies inside that copy; cached package downloads
  may be reused. Do not equate a local Windows run with a Linux/Vercel build.

The regression invokes the real Prettier CLI on a temporary fixture containing
invalid cache TypeScript, verifies unformatted source still fails, checks the
TypeScript input set, and queries the actual ESLint ignore configuration. It
reproduces formatter exit 2 and missing ESLint exclusions before the fix.

## Vercel settings after pushing the fix

In the existing `collecto-gincole` project, keep Next.js, Node 24.x, Corepack enabled
and the configured public Supabase/site environment variables.

Install Command:

```sh
corepack pnpm install --frozen-lockfile
```

Build Command:

```sh
pnpm verify:deployment
```

This runs route type generation, formatting, lint, TypeScript, unit/component
tests and the production build. Push the new fix commit to main, then deploy that
commit; redeploying a39547b retains the old ignore rules. No automatic database
migration or cleanup worker is added. Capture any subsequent cloud error from the
first failing step; production runtime and mobile acceptance remain separate.

## Executed verification

A fresh isolated source copy had no populated environment files, previous Next
build/route artifacts or TypeScript build cache. A frozen-lockfile install created
its own dependency tree from cached packages and passed supply-chain validation.
With placeholder public environment values and malformed synthetic `.vercel` /
`.pnpm-store` files present, `corepack pnpm verify:deployment` passed every stage:
route generation, formatter, ESLint, strict TypeScript, 336 tests across 51 files
and production build. Production dependency audit found no known vulnerabilities.
Git ignore probes and focused independent review pass.

This is local Windows evidence for the reported failure, not a completed Vercel
redeployment or runtime/mobile smoke test. No remote push, hosted environment
change, deployment, database access or browser test was performed by the agent.

## M8-T03B: Explicit test runtime under a production build host

The next Vercel attempt of e92ae2c passed formatting, lint and TypeScript, then
failed at Vitest with `React.act is not a function` from React's production bundle.
The initial local replay did not inherit NODE_ENV=production. The installed Vitest
sets NODE_ENV=test only when no value already exists; the deployment host's value
therefore selected the React production runtime during component tests.

Scope: set NODE_ENV=test in Vitest's worker-only `test.env` configuration. Do not
change the Vercel project environment or the application build, disable checks,
mock React.act or skip tests. This follows Vitest's documented per-test env option:
https://vitest.dev/config/env . Application, security and product behavior stay
unchanged.

Acceptance: with the parent NODE_ENV=production, the regression verifies the worker
sees test mode, React.act exists and a real component renders. The complete source
verification gate must pass with production/CI/Vercel environment flags, while the
parent and subsequent Next build retain production mode. Retain the cache-shaped
fixture files from M8-T03A. No browser or hosted tests are authorized by this fix.

Final M8-T03B evidence: the regression fails before the worker override and passes
afterward with parent NODE_ENV=production. The isolated full verification gate
passes route generation, formatting, lint, types, 337 tests across 52 files and
Next production build with NODE_ENV=production, CI=1, VERCEL=1 and
VERCEL_ENV=production. The outer shell still reports production afterward.

The replay also exposed a cold ESLint configuration-load timeout in the existing
infrastructure regression; only that integration check now allows 15 seconds.
Assertions, component-test timeouts and checks remain intact. Independent review
found no actionable issue. This is local Windows evidence; a successful hosted
retry and runtime/mobile acceptance remain pending. No push or deployment was
performed by the agent. The existing explicit dashboard command chain also uses
this Vitest configuration, so it need not change for this fix.
