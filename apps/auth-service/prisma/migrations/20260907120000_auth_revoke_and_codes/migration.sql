-- CreateTable
CREATE TABLE "RevokedAccessToken" (
    "jti" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevokedAccessToken_pkey" PRIMARY KEY ("jti")
);

-- CreateTable
CREATE TABLE "AuthCode" (
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthCode_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "RevokedAccessToken_expiresAt_idx" ON "RevokedAccessToken"("expiresAt");

-- CreateIndex
CREATE INDEX "AuthCode_expiresAt_idx" ON "AuthCode"("expiresAt");

-- CreateIndex
CREATE INDEX "AuthCode_userId_idx" ON "AuthCode"("userId");

-- AddForeignKey
ALTER TABLE "AuthCode" ADD CONSTRAINT "AuthCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
