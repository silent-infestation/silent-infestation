/*
  Warnings:

  - Added the required column `state` to the `Site` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "state" TEXT NOT NULL;
