# Copilot Instructions for NoCarry

## Project Overview

**NoCarry** is a full-stack SaaS platform for fair grading of university group projects. It automatically tracks student contributions, detects freeloaders, and generates AI-powered grading reports for professors.

- **Tech Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS + Prisma 7 + PostgreSQL (Supabase) + Claude AI
- **Live at:** [nocarry.space](https://nocarry.space)
- **Key Features:** Contribution scoring, task board with auto-archiving, peer reviews with anomaly detection, AI report generation, professor dashboard

## Architecture Overview

### High-Level Flow
```
Students → NoCarry Platform → Contribution Tracking → Professor Dashboard → AI Report Generation
```

### Core Domain Model
- **User** → has roles (STUDENT, PROFESSOR, TEAM_LEADER)
- **Project** → owned by a user, contains members, tasks, peer reviews, and activity logs
- **ProjectMember** → joins projects with a specific role
- **Task** → assigned to team members, tracks to-do/in-progress/done with auto-archiving after 24 hours
- **ActivityLog** → records every action (task completion, creation, file upload) for contribution scoring
- **PeerReview** → teammates rate each other on quality, communication, timeliness, initiative
- **ProjectFile** → uploaded files attached to projects

### Key Architectural Concepts

1. **Contribution Scoring Engine**
   - Automatic point assignment: Task completion (+5), moved to progress (+3), task creation (+2), member invite (+1)
   - Contribution % = (user points / total team points) × 100
   - Calculated real-time from ActivityLog records
   - Located in: `src/lib/contribution.ts`

2. **Activity Tracking**
   - Every user action is logged to ActivityLog (action type + metadata in JSON)
   - Used for both contribution scoring and audit trail
   - Actions: TASK_CREATED, TASK_COMPLETED, TASK_MOVED, MEMBER_INVITED, FILE_UPLOADED, etc.

3. **Project Member Roles**
   - STUDENT: Create/join projects, manage tasks, submit reviews
   - TEAM_LEADER: Student permissions + invite teammates
   - PROFESSOR: Monitor all teams, view analytics, generate reports

4. **File Organization**
   - `/src/app` - Next.js App Router pages and API routes
   - `/src/components` - Reusable UI components (theme, animations, 3D scenes)
   - `/src/lib` - Business logic: contribution calculation, Prisma client, Supabase auth, email sending
   - `/src/middleware.ts` - Auth middleware using Supabase
   - `/prisma/schema.prisma` - Database schema (migrations handled by `prisma db push`)

5. **Authentication**
   - Supabase Auth for user registration/login
   - Session stored in auth cookie via middleware
   - Protected API routes check auth state and validate user roles

## Build, Test, and Lint Commands

### Development
```bash
npm run dev
# Starts Next.js dev server at http://localhost:3000
```

### Production Build
```bash
npm run build
# Runs `prisma generate && next build`
# Generates Prisma client types, then builds Next.js app
```

### Start Production Server
```bash
npm run start
# Runs Next.js production server
```

### Linting
```bash
npm run lint
# Runs ESLint with Next.js + TypeScript rules
```

## Database Setup

### Initial Setup
```bash
npx prisma generate  # Generate Prisma client types
npx prisma db push   # Sync schema.prisma with PostgreSQL
```

### View Database
```bash
npx prisma studio   # Open Prisma Studio UI (if installed)
```

### Common Prisma Commands
```bash
npx prisma generate                  # Regenerate types
npx prisma migrate dev --name <name> # Create & apply migration (dev only)
npx prisma db push                   # Sync schema without migrations
npx prisma db seed                   # Run seed script (if seed.ts exists)
```

## Environment Variables

Required in `.env`:
```env
DATABASE_URL=          # Supabase pooled connection string (pgBouncer)
DIRECT_URL=            # Supabase direct connection string (for migrations)
ANTHROPIC_API_KEY=     # Claude API key for report generation
NEXT_PUBLIC_SUPABASE_URL=     # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase public anon key
SUPABASE_SERVICE_ROLE_KEY=     # Supabase service role (server-side only)
```

## Key Conventions

### API Route Patterns
- **Dynamic routes use Next.js naming:** `/api/projects/[id]/tasks/[taskId]/route.ts`
- **Endpoints follow REST:** GET (fetch), POST (create), PUT/PATCH (update), DELETE
- **Response format:** JSON with `{ success: boolean, data?, error? }`
- **Auth checking:** Each route validates `req.headers.get('authorization')` or uses Supabase session

### Component Structure
- Functional components with TypeScript interfaces
- Naming: `PascalCase.tsx` for components
- Use shadcn/ui + Radix UI for UI primitives
- Tailwind CSS for styling; avoid inline styles

### Database Access
- **Always** use Prisma client from `src/lib/prisma.ts` (not raw queries)
- Prisma relations are typed; leverage `include` and `select` for efficient queries
- Cascade delete is configured; removing a project removes all related data

### Activity Logging
- Any user action should create an ActivityLog entry:
  ```typescript
  await prisma.activityLog.create({
    data: {
      userId: currentUserId,
      projectId,
      taskId: optional,
      action: "TASK_COMPLETED",
      metadata: { /* contextual data */ }
    }
  });
  ```
- Contribution scoring reads these logs in real-time

### Error Handling
- API routes should use try/catch and return appropriate HTTP status codes
- Client errors (validation) → 400; Auth errors → 401; Not found → 404; Server errors → 500
- Include descriptive error messages for debugging

### Naming Conventions
- Database fields: `camelCase` (Prisma auto-converts to `snake_case` in DB)
- Enum values: `UPPER_SNAKE_CASE` (Role.STUDENT, TaskStatus.IN_PROGRESS)
- Routes: kebab-case slugs, `[brackets]` for dynamic segments

## Common Development Tasks

### Adding a New API Endpoint
1. Create file: `/src/app/api/route-path/route.ts`
2. Import Prisma client: `import { prisma } from "@/lib/prisma"`
3. Handle auth: Check Supabase session or headers
4. Use Prisma for queries: Always use typed client
5. Log activity if user action: Create ActivityLog entry
6. Return JSON response with status codes

### Adding a New Database Model
1. Update `prisma/schema.prisma`
2. Run `npx prisma db push` (dev) or create migration for production
3. Run `npx prisma generate` to regenerate types
4. Use new model in API routes and components

### Updating Contribution Scoring Logic
- Edit `src/lib/contribution.ts`
- This is called by `/api/projects/[id]/contributions` endpoint
- Returns contribution % per team member
- Test with activity logs using Prisma Studio

### Generating AI Reports
- Use `/api/projects/[id]/report` endpoint
- Sends project data to Claude API (via `@anthropic-ai/sdk`)
- Includes contribution scores, peer reviews, and activity summary
- Professors can export as `.txt`

## Troubleshooting

### Database Connection Issues
- Check `DATABASE_URL` and `DIRECT_URL` in `.env`
- Ensure Supabase project is active and credentials are correct
- For migrations: use `DIRECT_URL` (non-pooled connection)

### Prisma Type Errors
- Run `npx prisma generate` after schema changes
- Check that `@prisma/client` version matches `prisma` package version

### Build Failures
- Ensure `npm install` has been run
- Check that all API routes have proper error handling
- Verify `.env` file has all required variables

### Auth Issues
- Middleware in `/src/middleware.ts` validates Supabase session
- Check that auth endpoints are not blocked by middleware
- Ensure Supabase credentials are correct in `.env.local`
