/*
  Warnings:

  - Added the required column `job_description` to the `resumes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `screening_id` to the `resumes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "resumes" ADD COLUMN     "current_role" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "interview_questions" TEXT[],
ADD COLUMN     "job_description" TEXT NOT NULL,
ADD COLUMN     "screening_id" TEXT NOT NULL,
ADD COLUMN     "skills_missing" TEXT[],
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "years_experience" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "resumes_screening_id_idx" ON "resumes"("screening_id");
