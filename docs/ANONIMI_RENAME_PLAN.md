# EchoID to anonimi Rebrand + ID Migration Plan

This document captures the full migration plan to rename the app from EchoID to anonimi, including branding, technical identifier migration, GitHub/repository updates, and release rollout.

## Objective

Execute the rename in two coordinated tracks:

1. Immediate brand/repo/domain rebrand to `anonimi`
2. Full technical identifier migration from `echoId`/`eid_` to `anonimiId`/`aid_` with backward compatibility windows

This avoids a risky big-bang release while still delivering the chosen final naming (`anonimi`, `AID`).

## Steps

### 1. Phase 0 - Naming Contract Freeze

1. Finalize canonical branding and casing rules:
- Product brand is `anonimi` (lowercase in logos/marketing)
- Sentence-leading fallback `Anonimi` when grammar requires capitalization

2. Finalize identifier terminology:
- User-facing label: `AID`
- Technical fields: migrate `echoId` -> `anonimiId`
- ID prefix: migrate `eid_` -> `aid_`

3. Define compatibility policy:
- Accept/read both legacy (`echoId`, `eid_`) and new (`anonimiId`, `aid_`) for a deprecation period
- This policy blocks all following phases until approved

### 2. Phase 1 - GitHub, Repo, and Public Surface Rebrand

1. Rename GitHub repository from `mark-ianz/EchoID` to `mark-ianz/anonimi`; verify GitHub redirect is active for old URL.
2. Update local git remote URL and docs links to the new repo URL. Depends on step 1.
3. Replace user-facing brand strings (`EchoID` -> `anonimi`) in frontend metadata, marketing copy, docs headers, and README. Parallel with step 2.
4. Update deployment-facing public URLs and references (`echoid.com`/`api.echoid.com` to new domains), plus CORS/security docs and env examples. Depends on domain decision.

### 3. Phase 2 - Backend Identifier Migration (Compatibility First)

1. Add dual-field support in backend models/services:
- Keep existing `echoId` read/write temporarily
- Introduce `anonimiId` read/write
- Enforce uniqueness for both where needed
Depends on Phase 0.

2. Extend API contracts to return both fields during transition, with `anonimiId` as primary and `echoId` as deprecated alias. Depends on step 1.

3. Add route compatibility:
- Introduce `/api/users/:anonimiId`
- Keep `/api/users/:echoId` temporarily (deprecated)
Depends on step 2.

4. Update ID generation to emit `aid_` for new accounts while preserving legacy `eid_` records for existing users. Depends on step 1.

5. Add data migration script:
- Backfill `anonimiId` for all existing users
- Ensure deterministic mapping and collision handling
- Reindex and verify cardinality
Depends on steps 1 and 4.

6. Update socket payloads/types and backend DTOs to include `anonimiId` and keep legacy compatibility fields during transition. Parallel after step 2.

### 4. Phase 3 - Frontend and Client Storage Migration

1. Update all frontend types/components/routes/hooks from `echoId` usage to `anonimiId` with alias fallback support while backend is transitional. Depends on Phase 2 step 2.
2. Migrate route segments and navigations where appropriate (`/user/[echoId]` semantics to new param naming) while preserving old deep links through redirects/compat parsing. Depends on step 1.
3. Migrate local storage keys (`echo_*`) to `anonimi_*` with one-time hydration/move logic so users stay signed in. Depends on step 1.
4. Update visible label copy to `AID` throughout profile/search/chat/group UIs and prompts (e.g., "What's your AID?"). Parallel with step 3.

### 5. Phase 4 - Documentation, Tooling, and Release

1. Rewrite docs/contracts to primary `anonimi` + `anonimiId` + `AID`, and mark old names deprecated with sunset date.
2. Add release notes and migration guide for contributors and API consumers.
3. Run staged rollout: internal -> canary -> full production, monitoring auth, user lookup, message delivery, and profile links.
4. After deprecation window, remove legacy `echoId`/`eid_` compatibility paths and old storage-key fallbacks.

## Relevant Files

- `backend/src/models/user.model.ts` - currently anchors `echoId` schema/index and must support transition fields.
- `backend/src/services/user.service.ts` - user lookup and DTO shaping for `getUserByEchoId`-style flows.
- `backend/src/controllers/user.controller.ts` - route handlers for profile lookup compatibility endpoints.
- `backend/src/routes/user.routes.ts` - add new primary route and maintain deprecated route.
- `backend/src/config/env.ts` - DB name/defaults, CORS origin docs and env evolution.
- `frontend/src/lib/constants.ts` - token key migration from `echo_*` to `anonimi_*`.
- `frontend/src/app/(main)/user/[anonimiId]/page.tsx` - user route param migration and compatibility handling.
- `frontend/src/types` - DTO contracts changing `echoId` to `anonimiId` with aliases.
- `frontend/src/components/user` - profile/search displays and labels to `AID`.
- `docs/API_DESIGN.md` - contract updates + deprecation notices.
- `docs/SYSTEM_DESIGN.md` - identity generation and architecture wording changes.
- `docs/SECURITY_MODEL.md` - production domain/origin updates.
- `.git/config` - remote URL update after GitHub rename.

## Verification

1. DB migration validation: every user has unique `anonimiId`; no collisions; legacy `echoId` preserved during transition.
2. API compatibility tests: both old and new lookup routes/fields function during deprecation window.
3. Frontend smoke tests: profile routing, mentions/links, search by ID, contact/message request flows, group member links.
4. Session continuity test: existing users remain logged in after storage-key migration.
5. Realtime tests: socket events carrying user identifiers still resolve profile links and caches.
6. GitHub/repo checks: new remote works, CI still resolves repository path, README badges/links valid.

## Decisions

- Brand style: `anonimi`.
- Public ID label: `AID`.
- Migration approach: full technical rename with temporary compatibility bridge (no hard cutover in one release).
- Included scope: codebase, docs, GitHub repository name, and domain/config references.
- Excluded from immediate cutover: forced deletion of legacy IDs before transition stability is confirmed.

## Further Considerations

1. Recommendation: reserve and verify domain variants early (`anonimi.com`, `api.anonimi.com`, plus fallback TLDs) before public announcement.
2. Recommendation: keep accepting `aid_` in user search for one release cycle with UI hinting users toward `AID` format.
3. Recommendation: if external API consumers exist, publish a versioned deprecation timeline (e.g., 60-90 days) before removing `echoId` fields/endpoints.
