/*
  Warnings:

  - You are about to drop the column `profile` on the `User` table. All the data in the column will be lost.
  - Added the required column `position` to the `Board` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `Card` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "lastPosition" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "position" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "position" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "profile";

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "lastPosition" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "ProfilePicture" (
    "id" SERIAL NOT NULL,
    "publicID" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "ProfilePicture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePicture_userId_key" ON "ProfilePicture"("userId");

-- AddForeignKey
ALTER TABLE "ProfilePicture" ADD CONSTRAINT "ProfilePicture_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
