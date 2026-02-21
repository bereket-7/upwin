-- CreateEnum
CREATE TYPE "ProfileType" AS ENUM ('CUSTOM', 'UPWORK_IMPORT');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "type" "ProfileType" NOT NULL DEFAULT 'CUSTOM';

-- Update existing profiles with upworkId to be UPWORK_IMPORT
UPDATE "Profile" SET "type" = 'UPWORK_IMPORT' WHERE "upworkId" IS NOT NULL;
