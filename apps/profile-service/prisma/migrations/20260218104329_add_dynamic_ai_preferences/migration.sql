-- CreateEnum
CREATE TYPE "PreferenceCategory" AS ENUM ('TONE', 'WRITING_STYLE', 'LENGTH');

-- CreateTable
CREATE TABLE "AIPreference" (
    "id" TEXT NOT NULL,
    "category" "PreferenceCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilePreference" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "preferenceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfilePreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIPreference_category_isActive_idx" ON "AIPreference"("category", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AIPreference_category_name_key" ON "AIPreference"("category", "name");

-- CreateIndex
CREATE INDEX "ProfilePreference_profileId_idx" ON "ProfilePreference"("profileId");

-- CreateIndex
CREATE INDEX "ProfilePreference_preferenceId_idx" ON "ProfilePreference"("preferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePreference_profileId_preferenceId_key" ON "ProfilePreference"("profileId", "preferenceId");

-- AddForeignKey
ALTER TABLE "ProfilePreference" ADD CONSTRAINT "ProfilePreference_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilePreference" ADD CONSTRAINT "ProfilePreference_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "AIPreference"("id") ON DELETE CASCADE ON UPDATE CASCADE;
