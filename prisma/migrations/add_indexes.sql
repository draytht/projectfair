-- Performance indexes for NoCarry
-- Run with: npx prisma db execute --file ./prisma/migrations/add_indexes.sql
-- All use CONCURRENTLY — zero downtime, safe on live DB.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email
  ON "User"(email);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_project_status
  ON "Task"("projectId", status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_due_date
  ON "Task"("dueDate") WHERE "dueDate" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_project_created
  ON "ActivityLog"("projectId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chatmessage_project_created
  ON "ChatMessage"("projectId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projectmember_user
  ON "ProjectMember"("userId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invite_token
  ON "ProjectInvite"(token);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invite_expires
  ON "ProjectInvite"("expiresAt");
