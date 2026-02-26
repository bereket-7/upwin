-- CreateTable
CREATE TABLE "EducationItem" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "dates" TEXT,
    "fieldOfStudy" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EducationItem_profileId_idx" ON "EducationItem"("profileId");

-- AddForeignKey
ALTER TABLE "EducationItem" ADD CONSTRAINT "EducationItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
