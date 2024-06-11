/*
  Warnings:

  - You are about to drop the column `description` on the `Board` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Board" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "Card" ALTER COLUMN "deadline" DROP NOT NULL,
ALTER COLUMN "deadline" SET DATA TYPE TEXT;
