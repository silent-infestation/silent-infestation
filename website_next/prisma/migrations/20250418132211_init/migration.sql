/*
  Warnings:

  - Added the required column `securityKey` to the `Site` table without a default value. This is not possible if the table is not empty.
  - Added the required column `urlPath` to the `Site` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "securityKey" TEXT NOT NULL,
ADD COLUMN     "urlPath" TEXT NOT NULL;
