/*
  Warnings:

  - You are about to drop the column `url` on the `Site` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,url_site]` on the table `Site` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Site` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url_site` to the `Site` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Site_userId_url_key";

-- AlterTable
ALTER TABLE "Site" DROP COLUMN "url",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "url_site" TEXT NOT NULL,
ALTER COLUMN "state" DROP NOT NULL,
ALTER COLUMN "state" SET DEFAULT 'unverified';

-- CreateIndex
CREATE UNIQUE INDEX "Site_userId_url_site_key" ON "Site"("userId", "url_site");
