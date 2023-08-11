/*
  Warnings:

  - You are about to drop the column `position` on the `Board` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `List` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Board" DROP COLUMN "position";

-- AlterTable
ALTER TABLE "Card" DROP COLUMN "position";

-- AlterTable
ALTER TABLE "List" DROP COLUMN "position";
