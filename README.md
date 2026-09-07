# Upwin Services

Upwin is an Nx monorepo for the backend services that support profile management, authentication, proposal storage, and AI-assisted proposal workflows.

## Services

- `apps/auth-service`: local and OAuth authentication, JWTs, sessions, email verification, and admin login.
- `apps/profile-service`: authenticated user profiles, Upwork imports, portfolio data, AI preferences, and profile-scoped hooks.
- `apps/proposal-service`: authenticated proposal storage, proposal versions, status changes, and proposal listing.
- `apps/ai-gateway`: AI proposal generation, streaming, job review, question answering, and RAG integration.
- `libs/shared`: shared auth decorators, guards, config helpers, database helpers, types, and utilities.

## Local Setup

Install dependencies from the repository root:

```sh
npm install
```

Each service owns its own environment file. Start from the service `.env.example` files and set the database URLs, `JWT_SECRET`, AI provider keys, SMTP values, and service URLs needed by the service you run.

Generate Prisma clients after changing schemas or installing dependencies:

```sh
npm run prisma:generate:auth
npm run prisma:generate:profile
npm run prisma:generate:proposal
```

Run services with Nx:

```sh
npx nx serve-dev @org/auth-service
npx nx serve-dev profile-service
npx nx serve-dev proposal-service
npx nx serve-dev ai-gateway
```

## Verification

Common checks:

```sh
npm run build
npm run typecheck
npm run e2e
```

Service-specific e2e commands are available as `npm run e2e:auth`, `npm run e2e:profile`, `npm run e2e:proposal`, and `npm run e2e:ai`.

## API Ownership Rules

- Do not trust `userId` from request bodies or query strings.
- Controllers must derive the current user from the JWT-authenticated request.
- Proposal reads and writes must always be scoped by the authenticated `userId`.
- Profile lookup by ID is allowed only through guarded routes that verify `profile.userId` matches the current user.
- AI gateway forwards the bearer token to profile and proposal services and uses JWT claims as the source of user identity.

### RAG reseeding

After deploying AI gateway RAG changes, re-seed Qdrant so payload metadata matches filters (`metadata.tone`, etc.):

```sh
cd apps/ai-gateway && npx ts-node src/scripts/seed-rag.ts
```

### Account deletion cascade

`DELETE /api/auth/account` (JWT required) returns **202** and queues durable deletion:

1. Deactivates the user (blocks login) and revokes current access `jti` / sessions
2. Outbox worker mints a short-lived deletion JWT and calls `DELETE /api/me` (profile) then `DELETE /api/proposals/me`
3. Hard-deletes the auth user and marks the outbox row `DONE`

Retries on failure up to a fixed attempt limit. Idempotent purge endpoints make replay safe.

## Frontend integration

The frontend lives in a **separate repository**. This monorepo is API-only.

- **Staging API base:** `https://upxl.sandbox.be.tibebai.com` with path prefixes `/auth`, `/profile`, `/ai`, and `/proposal` (see [infrastructure/README.md](infrastructure/README.md)).
- **CORS:** Credentialed browser requests require the frontend origin in `ALLOWED_ORIGINS` (comma-separated). Do **not** use `*`.
- **`FRONTEND_URL`:** Auth-service base for OAuth redirects and email verification links. Set it to the real frontend origin per environment.
- **Local default:** Frontend at `http://localhost:3000`.

Shared TypeScript helpers live in `libs/shared` (`@org/shared`). Do not add a parallel `packages/` tree without an explicit package need.

## Deployment Notes

Staging workflows build and push Docker images per service using SSH key authentication (`VPS_SSH_PRIVATE_KEY` + `VPS_SSH_KNOWN_HOSTS`). Production-like deployments must provide explicit `ALLOWED_ORIGINS`; wildcard origins are not valid for credentialed CORS. Admin seed passwords must be supplied through `ADMIN_SEED_PASSWORD` and are never printed.

### Required GitHub Actions secrets (staging)

| Secret | Used by |
|--------|---------|
| `DOCKER_USERNAME`, `DOCKER_PASSWORD` | All deploy workflows |
| `VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_PRIVATE_KEY`, `VPS_SSH_KNOWN_HOSTS` | All deploy workflows |
| `JWT_SECRET`, `ALLOWED_ORIGINS` | All services |
| `FRONTEND_URL`, `ADMIN_SEED_PASSWORD`, `DATABASE_URL`, OAuth/SMTP secrets | Auth |
| `PROFILE_DATABASE_URL` | Profile |
| `PROPOSAL_DATABASE_URL`, service URLs | Proposal |
| `GEMINI_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`, service URLs | AI gateway |
| `PROFILE_SERVICE_URL`, `PROPOSAL_SERVICE_URL` | Auth (account deletion cascade) |

### Token revocation note

Logout revokes the access token `jti` in auth-service Postgres (`RevokedAccessToken`) and deletes refresh sessions. Profile, proposal, and AI gateway verify JWT signature and expiry only — residual access window is at most `JWT_EXPIRY` (default 15m). Prefer short access TTL with refresh rotation. OAuth one-time codes are stored in Postgres (`AuthCode`) so multi-instance auth works.

Deleted profiles can leave historical proposals with a stale `profileId`; account and profile delete flows purge or scope those rows by authenticated `userId` (see account deletion endpoints).
