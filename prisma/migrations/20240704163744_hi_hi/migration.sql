/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Board` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `Board` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Board` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `isDone` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `startedBy` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Card` table. All the data in the column will be lost.
  - The `color` column on the `Card` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `adminId` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the column `lastPosition` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Workspace` table. All the data in the column will be lost.
  - The primary key for the `WorkspaceMember` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `WorkspaceMember` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `WorkspaceMember` table. All the data in the column will be lost.
  - You are about to drop the `ProfilePicture` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `workspaceId` to the `Card` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Card" DROP CONSTRAINT "Card_startedBy_fkey";

-- DropForeignKey
ALTER TABLE "ProfilePicture" DROP CONSTRAINT "ProfilePicture_id_fkey";

-- DropForeignKey
ALTER TABLE "Workspace" DROP CONSTRAINT "Workspace_adminId_fkey";

-- AlterTable
ALTER TABLE "Board" DROP COLUMN "createdAt",
DROP COLUMN "position",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Card" DROP COLUMN "createdAt",
DROP COLUMN "isDone",
DROP COLUMN "startedAt",
DROP COLUMN "startedBy",
DROP COLUMN "updatedAt",
ADD COLUMN     "workspaceId" INTEGER NOT NULL,
DROP COLUMN "color",
ADD COLUMN     "color" TEXT NOT NULL DEFAULT 'FFFFFF';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "fcmToken" TEXT,
ADD COLUMN     "profile" TEXT;

-- AlterTable
ALTER TABLE "Workspace" DROP COLUMN "adminId",
DROP COLUMN "createdAt",
DROP COLUMN "lastPosition",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "WorkspaceMember" DROP CONSTRAINT "WorkspaceMember_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
ADD CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("userId", "workspaceId");

-- DropTable
DROP TABLE "ProfilePicture";

-- DropEnum
DROP TYPE "Color";

-- CreateTable
CREATE TABLE "Subtask" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "cardId" INTEGER NOT NULL,

    CONSTRAINT "Subtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardUser" (
    "cardId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "CardUser_pkey" PRIMARY KEY ("cardId","userId")
);

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardUser" ADD CONSTRAINT "CardUser_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardUser" ADD CONSTRAINT "CardUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
