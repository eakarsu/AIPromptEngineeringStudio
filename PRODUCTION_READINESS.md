# Governed reproducible prompt run

The durable path is `/api/governed-prompt-runs`. Bearer identity plus active tenant membership are required; every write also requires `X-Tenant-Id` and `Idempotency-Key`. The workflow records versioned prompt/configuration and fixtures, queued run receipts, immutable artifacts, evaluations, security/regression review, approval, release, failures, retries, and rollback. Evidence stores opaque encrypted references, versions, SHA-256 digests, timestamps, consent basis, and non-sensitive metadata rather than raw sensitive content.

The additive migration `backend/migrations/001_governed_prompt_run.sql` is an explicit operator action. Startup never creates, drops, seeds, synchronizes, or migrates a database. Apply it only through an approved migrator after backup, review, and rollback planning. It adds tenant memberships, optimistic case versions, immutable evidence/events, retention metadata, and connector-failure receipts without deleting legacy tables.

Typed connectors are intentionally unconfigured. Generated, gap, direct-provider, and untrusted-execution routes are quarantined by default; their enablement flag is forbidden in production, and credentials do not establish provider fitness. Production adapters still need credentials, contract tests, webhook verification, retries/backoff, reconciliation, privacy/security review, and usage controls.

Versioned acceptance fixtures exercise complete and unsafe/missing inputs, deterministic metrics, stale data where applicable, RBAC, dual control, optimistic concurrency, provider failure, migration safety, and launcher safety. No repository, CI/CD, provider, telemetry, secret manager, artifact, ticketing, sandbox, model, latency, cost, or production evaluation was validated.

Copy `.env.example` to secret-managed `.env`, replace placeholders, and leave legacy/demo/untrusted flags false. Run `node --test backend/governance/*.test.cjs`, syntax checks, and `bash -n start.sh`. The launcher starts only already-installed code, refuses occupied ports, and stops only its own children. Dependencies, provisioning, migrations, seed data, external systems, and real-world acceptance remain separate approved operations.

