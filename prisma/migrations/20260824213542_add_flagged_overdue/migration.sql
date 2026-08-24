-- AlterTable
ALTER TABLE "complaints" ADD COLUMN     "is_flagged_overdue" BOOLEAN NOT NULL DEFAULT false;
