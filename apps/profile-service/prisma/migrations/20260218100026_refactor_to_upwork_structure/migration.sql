/*
  Warnings:

  - You are about to drop the column `portfolioId` on the `PortfolioItem` table. All the data in the column will be lost.
  - You are about to drop the column `portfolioId` on the `WorkHistoryItem` table. All the data in the column will be lost.
  - You are about to drop the `Portfolio` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[upworkId]` on the table `Profile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profileId` to the `PortfolioItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `WorkHistoryItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Portfolio" DROP CONSTRAINT "Portfolio_profileId_fkey";

-- DropForeignKey
ALTER TABLE "PortfolioItem" DROP CONSTRAINT "PortfolioItem_portfolioId_fkey";

-- DropForeignKey
ALTER TABLE "WorkHistoryItem" DROP CONSTRAINT "WorkHistoryItem_portfolioId_fkey";

-- DropIndex
DROP INDEX "PortfolioItem_portfolioId_idx";

-- DropIndex
DROP INDEX "WorkHistoryItem_portfolioId_idx";

-- AlterTable
ALTER TABLE "PortfolioItem" DROP COLUMN "portfolioId",
ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "skills" TEXT[],
ADD COLUMN     "syncedAt" TIMESTAMP(3),
ADD COLUMN     "totalEarnings" TEXT,
ADD COLUMN     "totalHours" TEXT,
ADD COLUMN     "totalJobs" TEXT,
ADD COLUMN     "upworkId" TEXT;

-- AlterTable
ALTER TABLE "WorkHistoryItem" DROP COLUMN "portfolioId",
ADD COLUMN     "profileId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Portfolio";

-- DropEnum
DROP TYPE "PortfolioType";

-- CreateIndex
CREATE INDEX "PortfolioItem_profileId_idx" ON "PortfolioItem"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_upworkId_key" ON "Profile"("upworkId");

-- CreateIndex
CREATE INDEX "Profile_upworkId_idx" ON "Profile"("upworkId");

-- CreateIndex
CREATE INDEX "WorkHistoryItem_profileId_idx" ON "WorkHistoryItem"("profileId");

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkHistoryItem" ADD CONSTRAINT "WorkHistoryItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
