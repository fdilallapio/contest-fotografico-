-- CreateTable
CREATE TABLE "ContestConfig" (
    "id" TEXT NOT NULL,
    "uploadStart" TIMESTAMP(3) NOT NULL,
    "uploadEnd" TIMESTAMP(3) NOT NULL,
    "votingEnd" TIMESTAMP(3) NOT NULL,
    "eventDate" TIMESTAMP(3),
    "eventLocation" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContestConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unlockDay" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "gdprConsent" BOOLEAN NOT NULL,
    "rulesConsent" BOOLEAN NOT NULL,
    "consentIp" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmationEmailSentAt" TIMESTAMP(3),
    "resultsEmailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "originalKey" TEXT NOT NULL,
    "originalMime" TEXT NOT NULL,
    "thumbKey" TEXT,
    "mediumKey" TEXT,
    "fullKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "piazzaVotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "voterHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Theme_slug_key" ON "Theme"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_email_key" ON "Candidate"("email");

-- CreateIndex
CREATE INDEX "Photo_themeId_status_idx" ON "Photo"("themeId", "status");

-- CreateIndex
CREATE INDEX "Photo_candidateId_idx" ON "Photo"("candidateId");

-- CreateIndex
CREATE INDEX "Vote_photoId_idx" ON "Vote"("photoId");

-- CreateIndex
CREATE INDEX "Vote_voterHash_photoId_idx" ON "Vote"("voterHash", "photoId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_photoId_email_key" ON "Vote"("photoId", "email");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
