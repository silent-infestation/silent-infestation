/*
  Warnings:

  - You are about to drop the column `url_site` on the `Site` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,url]` on the table `Site` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `url` to the `Site` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Site_userId_url_site_key";

-- AlterTable
ALTER TABLE "Site" DROP COLUMN "url_site",
ADD COLUMN     "url" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Site_userId_url_key" ON "Site"("userId", "url");
