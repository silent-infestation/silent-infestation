/*
  Warnings:

  - You are about to drop the column `auth_email` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `auth_key` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `auth_url` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `id_user` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `url_site` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `scanID` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,url]` on the table `Site` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `url` to the `Site` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Site` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Site_auth_key_key";

-- DropIndex
DROP INDEX "Site_auth_url_key";

-- DropIndex
DROP INDEX "Site_url_site_key";

-- AlterTable
ALTER TABLE "Site" DROP COLUMN "auth_email",
DROP COLUMN "auth_key",
DROP COLUMN "auth_url",
DROP COLUMN "id_user",
DROP COLUMN "url_site",
ADD COLUMN     "url" TEXT NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "scanID";

-- CreateTable
CREATE TABLE "Scan" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "isRunning" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analyse" (
    "id" SERIAL NOT NULL,
    "scanId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "date_analyse" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultats" TEXT NOT NULL,

    CONSTRAINT "Analyse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanResult" (
    "id" SERIAL NOT NULL,
    "scanId" INTEGER NOT NULL,
    "totalFindings" INTEGER NOT NULL,

    CONSTRAINT "ScanResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawledUrl" (
    "id" SERIAL NOT NULL,
    "scanResultId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "CrawledUrl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityFinding" (
    "id" SERIAL NOT NULL,
    "scanResultId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "severity" TEXT NOT NULL,

    CONSTRAINT "SecurityFinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scan_userId_idx" ON "Scan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Analyse_scanId_key" ON "Analyse"("scanId");

-- CreateIndex
CREATE INDEX "Analyse_userId_idx" ON "Analyse"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ScanResult_scanId_key" ON "ScanResult"("scanId");

-- CreateIndex
CREATE UNIQUE INDEX "Site_userId_url_key" ON "Site"("userId", "url");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analyse" ADD CONSTRAINT "Analyse_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analyse" ADD CONSTRAINT "Analyse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanResult" ADD CONSTRAINT "ScanResult_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawledUrl" ADD CONSTRAINT "CrawledUrl_scanResultId_fkey" FOREIGN KEY ("scanResultId") REFERENCES "ScanResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityFinding" ADD CONSTRAINT "SecurityFinding_scanResultId_fkey" FOREIGN KEY ("scanResultId") REFERENCES "ScanResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
