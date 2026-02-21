/*
  Warnings:

  - You are about to drop the column `profileId` on the `PortfolioItem` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `rawText` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `syncedAt` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `tone` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `totalEarnings` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `totalHours` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `totalJobs` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `upworkId` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `writingStyle` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `profileId` on the `WorkHistoryItem` table. All the data in the column will be lost.
  - You are about to drop the column `rawStats` on the `WorkHistoryItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Profile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `portfolioId` to the `PortfolioItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `portfolioId` to the `WorkHistoryItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PortfolioType" AS ENUM ('CUSTOM', 'UPWORK_IMPORT');

-- DropForeignKey
ALTER TABLE "PortfolioItem" DROP CONSTRAINT "PortfolioItem_profileId_fkey";

-- DropForeignKey
ALTER TABLE "WorkHistoryItem" DROP CONSTRAINT "WorkHistoryItem_profileId_fkey";

-- DropIndex
DROP INDEX "PortfolioItem_profileId_idx";

-- DropIndex
DROP INDEX "Profile_upworkId_idx";

-- DropIndex
DROP INDEX "Profile_upworkId_key";

-- DropIndex
DROP INDEX "WorkHistoryItem_profileId_idx";

-- AlterTable
ALTER TABLE "PortfolioItem" DROP COLUMN "profileId",
ADD COLUMN     "portfolioId" TEXT NOT NULL,
ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "description",
DROP COLUMN "rawText",
DROP COLUMN "skills",
DROP COLUMN "syncedAt",
DROP COLUMN "tone",
DROP COLUMN "totalEarnings",
DROP COLUMN "totalHours",
DROP COLUMN "totalJobs",
DROP COLUMN "type",
DROP COLUMN "upworkId",
DROP COLUMN "writingStyle",
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "defaultTone" TEXT,
ADD COLUMN     "defaultWritingStyle" TEXT;

-- AlterTable
ALTER TABLE "WorkHistoryItem" DROP COLUMN "profileId",
DROP COLUMN "rawStats",
ADD COLUMN     "company" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "portfolioId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ProfileType";

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "PortfolioType" NOT NULL DEFAULT 'CUSTOM',
    "name" TEXT NOT NULL,
    "upworkId" TEXT,
    "syncedAt" TIMESTAMP(3),
    "description" TEXT,
    "skills" TEXT[],
    "totalEarnings" TEXT,
    "totalJobs" TEXT,
    "totalHours" TEXT,
    "tone" TEXT,
    "writingStyle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_upworkId_key" ON "Portfolio"("upworkId");

-- CreateIndex
CREATE INDEX "Portfolio_profileId_idx" ON "Portfolio"("profileId");

-- CreateIndex
CREATE INDEX "Portfolio_upworkId_idx" ON "Portfolio"("upworkId");

-- CreateIndex
CREATE INDEX "Portfolio_type_idx" ON "Portfolio"("type");

-- CreateIndex
CREATE INDEX "PortfolioItem_portfolioId_idx" ON "PortfolioItem"("portfolioId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "WorkHistoryItem_portfolioId_idx" ON "WorkHistoryItem"("portfolioId");

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkHistoryItem" ADD CONSTRAINT "WorkHistoryItem_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
