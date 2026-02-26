-- CreateTable
CREATE TABLE "CertificateItem" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "issueDate" TEXT,
    "expiryDate" TEXT,
    "credentialId" TEXT,
    "url" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CertificateItem_profileId_idx" ON "CertificateItem"("profileId");

-- AddForeignKey
ALTER TABLE "CertificateItem" ADD CONSTRAINT "CertificateItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
