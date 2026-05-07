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

## Deployment Notes

Staging workflows build and push Docker images per service. Production-like deployments must provide explicit `ALLOWED_ORIGINS`; wildcard origins are not valid for credentialed CORS. Admin seed passwords must be supplied through `ADMIN_SEED_PASSWORD` and are never printed.
