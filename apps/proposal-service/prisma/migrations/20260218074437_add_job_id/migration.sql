-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN     "jobId" TEXT;

-- CreateIndex
CREATE INDEX "Proposal_jobId_idx" ON "Proposal"("jobId");
