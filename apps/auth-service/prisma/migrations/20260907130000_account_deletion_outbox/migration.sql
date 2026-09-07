-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "AccountDeletionOutbox" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountDeletionOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountDeletionOutbox_status_createdAt_idx" ON "AccountDeletionOutbox"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AccountDeletionOutbox_userId_idx" ON "AccountDeletionOutbox"("userId");

-- AddForeignKey
ALTER TABLE "AccountDeletionOutbox" ADD CONSTRAINT "AccountDeletionOutbox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
