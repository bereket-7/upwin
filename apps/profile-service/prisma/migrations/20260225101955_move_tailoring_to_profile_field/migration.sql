/*
  Warnings:

  - The values [TAILORING] on the enum `PreferenceCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "TailoringLevel" AS ENUM ('LIGHT', 'BALANCED', 'DEEP');

-- AlterEnum
BEGIN;
CREATE TYPE "PreferenceCategory_new" AS ENUM ('TONE', 'WRITING_STYLE', 'LENGTH');
ALTER TABLE "AIPreference" ALTER COLUMN "category" TYPE "PreferenceCategory_new" USING ("category"::text::"PreferenceCategory_new");
ALTER TYPE "PreferenceCategory" RENAME TO "PreferenceCategory_old";
ALTER TYPE "PreferenceCategory_new" RENAME TO "PreferenceCategory";
DROP TYPE "public"."PreferenceCategory_old";
COMMIT;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "tailoring" "TailoringLevel" NOT NULL DEFAULT 'BALANCED';
