/*
  Warnings:

  - You are about to drop the `List` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `deadline` to the `Card` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startedBy` to the `Card` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Color" AS ENUM ('RED', 'GREEN', 'BLUE', 'YELLOW', 'WHITE');

-- DropForeignKey
ALTER TABLE "List" DROP CONSTRAINT "List_cardId_fkey";

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "color" "Color" NOT NULL DEFAULT 'WHITE',
ADD COLUMN     "deadline" TIMESTAMP NOT NULL,
ADD COLUMN     "isDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "startedBy" INTEGER NOT NULL;

-- DropTable
DROP TABLE "List";

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_startedBy_fkey" FOREIGN KEY ("startedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
