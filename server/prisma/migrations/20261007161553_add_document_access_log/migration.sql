-- CreateEnum
CREATE TYPE "DocumentAccessAction" AS ENUM ('DOWNLOAD', 'STATUS_CHANGE');

-- CreateTable
CREATE TABLE "document_access_logs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" "Role" NOT NULL,
    "action" "DocumentAccessAction" NOT NULL,
    "newStatus" "DocumentStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_access_logs_documentId_createdAt_idx" ON "document_access_logs"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "document_access_logs_actorId_createdAt_idx" ON "document_access_logs"("actorId", "createdAt");
