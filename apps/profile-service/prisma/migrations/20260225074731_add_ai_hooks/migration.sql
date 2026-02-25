/*
  Warnings:

  - You are about to drop the column `defaultTone` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `defaultWritingStyle` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "defaultTone",
DROP COLUMN "defaultWritingStyle";

-- CreateTable
CREATE TABLE "AIHook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "preferenceId" TEXT NOT NULL,
    "profileId" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIHook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIHook_preferenceId_idx" ON "AIHook"("preferenceId");

-- CreateIndex
CREATE INDEX "AIHook_profileId_idx" ON "AIHook"("profileId");

-- AddForeignKey
ALTER TABLE "AIHook" ADD CONSTRAINT "AIHook_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "AIPreference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIHook" ADD CONSTRAINT "AIHook_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
