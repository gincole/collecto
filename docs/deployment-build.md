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
