/*
  Warnings:

  - You are about to drop the column `tone` on the `Portfolio` table. All the data in the column will be lost.
  - You are about to drop the column `writingStyle` on the `Portfolio` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Portfolio" DROP COLUMN "tone",
DROP COLUMN "writingStyle";
