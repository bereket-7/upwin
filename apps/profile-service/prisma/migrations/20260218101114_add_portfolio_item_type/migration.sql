-- CreateEnum
CREATE TYPE "PortfolioType" AS ENUM ('CUSTOM', 'UPWORK_IMPORT');

-- AlterTable
ALTER TABLE "PortfolioItem" ADD COLUMN     "type" "PortfolioType" NOT NULL DEFAULT 'CUSTOM';

-- CreateIndex
CREATE INDEX "PortfolioItem_type_idx" ON "PortfolioItem"("type");
