/*
  Warnings:

  - The values [GENERATED,EDITED,SUBMITTED] on the enum `ProposalStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `aiModel` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `generatedAt` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `length` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `ragUsed` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `streamingUsed` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `style` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `submittedAt` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `tone` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `wordCount` on the `Proposal` table. All the data in the column will be lost.
  - Added the required column `jobSource` to the `Proposal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProposalStatus_new" AS ENUM ('DRAFT', 'SENT', 'ARCHIVED');
ALTER TABLE "Proposal" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Proposal" ALTER COLUMN "status" TYPE "ProposalStatus_new" USING ("status"::text::"ProposalStatus_new");
ALTER TYPE "ProposalStatus" RENAME TO "ProposalStatus_old";
ALTER TYPE "ProposalStatus_new" RENAME TO "ProposalStatus";
DROP TYPE "ProposalStatus_old";
ALTER TABLE "Proposal" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_parentId_fkey";

-- AlterTable
ALTER TABLE "Proposal" DROP COLUMN "aiModel",
DROP COLUMN "content",
DROP COLUMN "generatedAt",
DROP COLUMN "length",
DROP COLUMN "parentId",
DROP COLUMN "ragUsed",
DROP COLUMN "streamingUsed",
DROP COLUMN "style",
DROP COLUMN "submittedAt",
DROP COLUMN "tone",
DROP COLUMN "version",
DROP COLUMN "wordCount",
ADD COLUMN     "currentVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "jobSource" TEXT NOT NULL,
ALTER COLUMN "jobDescription" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "ProposalVersion" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "promptMeta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProposalVersion_proposalId_idx" ON "ProposalVersion"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalVersion_proposalId_version_key" ON "ProposalVersion"("proposalId", "version");

-- AddForeignKey
ALTER TABLE "ProposalVersion" ADD CONSTRAINT "ProposalVersion_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
