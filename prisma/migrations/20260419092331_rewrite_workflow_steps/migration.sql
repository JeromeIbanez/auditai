/*
  Warnings:

  - You are about to drop the column `company` on the `Audit` table. All the data in the column will be lost.
  - You are about to drop the column `claudeDoes` on the `Workflow` table. All the data in the column will be lost.
  - You are about to drop the column `handoffs` on the `Workflow` table. All the data in the column will be lost.
  - You are about to drop the column `humanDoes` on the `Workflow` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `Workflow` table. All the data in the column will be lost.
  - You are about to drop the column `trigger` on the `Workflow` table. All the data in the column will be lost.
  - You are about to drop the `Prompt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Rating` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StepType" AS ENUM ('TRIGGER', 'AI', 'HUMAN', 'INTEGRATION', 'OUTPUT');

-- DropForeignKey
ALTER TABLE "Prompt" DROP CONSTRAINT "Prompt_workflowId_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_promptId_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_workflowId_fkey";

-- AlterTable
ALTER TABLE "Audit" DROP COLUMN "company";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "onboarded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tools" TEXT[];

-- AlterTable
ALTER TABLE "Workflow" DROP COLUMN "claudeDoes",
DROP COLUMN "handoffs",
DROP COLUMN "humanDoes",
DROP COLUMN "paymentId",
DROP COLUMN "trigger",
ADD COLUMN     "summary" TEXT;

-- DropTable
DROP TABLE "Prompt";

-- DropTable
DROP TABLE "Rating";

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "StepType" NOT NULL,
    "tool" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prompt" TEXT,
    "promptVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowRating" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepRating" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StepRating_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRating" ADD CONSTRAINT "WorkflowRating_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepRating" ADD CONSTRAINT "StepRating_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
