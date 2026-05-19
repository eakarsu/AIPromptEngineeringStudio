# Audit Note — AIPromptEngineeringStudio

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_07.md` section #2.

## Original Recommendations

### Gaps — AI Counterparts
- `/classify-prompt` (added)
- `/translate-prompt`
- `/security-scan` (frontend `PIIChecker.jsx` exists; no backend AI route)

### Gaps — Non-AI Features
- Public prompt marketplace
- Production model registry
- Real-time co-editing
- Prompt-version diffing

### Custom Feature Suggestions
1. Regression test suite for prompts
2. Model-specific compilation
3. Cost prediction by volume
4. Prompt lineage graph
5. A/B test marketplace
6. Agentic prompt refinement

## Implemented (Mechanical)
- `POST /api/ai/classify-prompt` — added in `backend/routes/ai.js`. Returns domain, task_type, intent, subjects, tone, audience, complexity, format, language, tags. Follows existing `callOpenRouter` + `authenticateToken` style.

## Backlog (deferred)

### NEEDS-PRODUCT-DECISION
- `/translate-prompt` — needs target-language ergonomics decision (auto-detect source, multi-locale output).
- `/security-scan` — would consolidate `PIIChecker.jsx` and `SecurityScanner.jsx` logic server-side; needs decision on response shape.
- Marketplace governance (rating, moderation, copyright).
- Prompt lineage graph (data model).

### NEEDS-CREDS / NEW-DEPS
- Production model registry integration (vendor SDKs).
- A/B test marketplace storage.

### TOO-RISKY
- Real-time co-editing (CRDT/OT infra).
- Regression test runner (queue + eval framework).
- Multi-model compilation (per-vendor adapters + cost).

## Apply pass 3 (frontend)

LEFT-AS-IS — frontend was already wired for every backend AI endpoint.

- Verified the FE (React/CRA pages or Next.js dynamic AI tool registry) calls every AI route exposed by the backend.
- Auth pattern (JWT in localStorage with axios `Authorization: Bearer` interceptor for the React projects, cookie-based JWT middleware for the Next.js project) is already in place.
- 503/no-key error responses surface to the user via existing error rendering.
- No edits made; idempotence rule applied.

See `_AUDIT/apply3_logs/ab3_53.md` for the full per-project breakdown.

## Apply pass 4 (mechanical backlog)

SKIPPED — every remaining backlog item is categorized NEEDS-PRODUCT-DECISION (translate-prompt, security-scan, marketplace governance, lineage graph), NEEDS-CREDS / NEW-DEPS (model registry, A/B marketplace), or TOO-RISKY (real-time co-editing, regression runner, multi-model compilation). No mechanical work to apply this pass.
