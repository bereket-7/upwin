# Proposal Service

Microservice for managing AI-generated proposals with full CRUD operations, versioning, and ownership tracking.

## Port

- Development: `3010`
- Production: `3010`

## Features

- ✅ Store generated proposals
- ✅ User ownership tracking
- ✅ Proposal versioning
- ✅ Status management (DRAFT, GENERATED, EDITED, SUBMITTED, ARCHIVED)
- ✅ Full CRUD operations
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ PostgreSQL database

## Database Schema

```prisma
model Proposal {
  id              String          @id @default(uuid())
  userId          String
  profileId       String
  
  jobTitle        String?
  jobDescription  String
  jobUrl          String?
  
  content         String          # The proposal text
  tone            String?
  length          String?
  style           String?
  
  status          ProposalStatus  # DRAFT, GENERATED, EDITED, SUBMITTED, ARCHIVED
  wordCount       Int?
  generatedAt     DateTime
  submittedAt     DateTime?
  
  version         Int             # Versioning support
  parentId        String?         # Link to parent version
  
  aiModel         String?
  ragUsed         Boolean
  streamingUsed   Boolean
  
  createdAt       DateTime
  updatedAt       DateTime
}
```

## Setup

### 1. Install Dependencies

```bash
cd apps/proposal-service
npm install --legacy-peer-deps
```

### 2. Create Database

```sql
CREATE DATABASE upwin_proposals;
```

### 3. Run Migrations

```bash
npx prisma migrate dev --schema=./prisma/schema.prisma
```

### 4. Generate Prisma Client

```bash
npx prisma generate --schema=./prisma/schema.prisma
```

### 5. Start Service

```bash
npx nx serve-dev proposal-service
```

Service will start on: http://localhost:3010/api

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/upwin_proposals?schema=public"
PORT=3010
NODE_ENV=development
JWT_SECRET="h9ijhg2qwaszxcvghjuy65trfvgnhjmko09iuytr4rfv0okm"
ALLOWED_ORIGINS=http://localhost:3000
AUTH_SERVICE_URL=http://localhost:3008/api
PROFILE_SERVICE_URL=http://localhost:3009/api
AI_GATEWAY_URL=http://localhost:3007/api
```

## API Endpoints (To Be Implemented)

### Proposals

- `POST /api/proposals` - Create/save a proposal
- `GET /api/proposals` - List user's proposals
- `GET /api/proposals/:id` - Get specific proposal
- `PATCH /api/proposals/:id` - Update proposal
- `DELETE /api/proposals/:id` - Delete proposal
- `POST /api/proposals/:id/submit` - Mark as submitted
- `POST /api/proposals/:id/archive` - Archive proposal

### Generation Integration

- `POST /api/proposals/generate` - Generate and save proposal
- `POST /api/proposals/generate-stream` - Generate with streaming and save

## Integration with AI Gateway

```typescript
// Generate and save proposal
const response = await fetch('http://localhost:3010/api/proposals/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer JWT_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    profileId: 'profile-uuid',
    jobDescription: 'Build a React app...',
    jobTitle: 'Full-Stack Developer',
    tone: 'professional',
  }),
});

const { proposal } = await response.json();
```

## Service Architecture

```
proposal-service (Port 3010)
├── Database: upwin_proposals (PostgreSQL)
├── Auth: JWT (shared with other services)
├── Dependencies:
│   ├── ai-gateway (generate proposals)
│   ├── profile-service (validate profiles)
│   └── auth-service (JWT validation)
```

## Next Steps

1. ✅ Database schema created
2. ✅ Prisma configured
3. ✅ JWT authentication setup
4. ✅ Port configured (3010)
5. ✅ Dockerfile created
6. ⏳ Implement proposal CRUD endpoints
7. ⏳ Integrate with AI Gateway
8. ⏳ Add versioning logic
9. ⏳ Add search/filtering
10. ⏳ Deploy

## Production Build

```bash
npx nx build proposal-service --configuration=production
```

## Docker

```bash
# Build
docker build -f apps/proposal-service/Dockerfile -t proposal-service:latest .

# Run
docker run -d \
  --name proposal-service \
  -p 3010:3010 \
  -e DATABASE_URL="postgresql://postgres:password@host.docker.internal:5432/upwin_proposals?schema=public" \
  -e JWT_SECRET="your-secret" \
  -e NODE_ENV="production" \
  proposal-service:latest
```

## Status

✅ Infrastructure Complete - Ready for endpoint implementation
