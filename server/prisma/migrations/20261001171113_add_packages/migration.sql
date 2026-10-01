-- CreateEnum
CREATE TYPE "PackageCategory" AS ENUM ('CULTURAL', 'TREKKING', 'FESTIVAL', 'PILGRIMAGE', 'ADVENTURE', 'WELLNESS');

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dzongkhag" TEXT NOT NULL,
    "category" "PackageCategory" NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "requiresSpecialPermit" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);
