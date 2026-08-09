-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('PENDING', 'TRANSCRIBING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "storage_path" TEXT,
    "duration_seconds" INTEGER,
    "transcript" TEXT,
    "summary" TEXT,
    "action_items" JSONB,
    "attendees" TEXT[],
    "status" "MeetingStatus" NOT NULL DEFAULT 'PENDING',
    "status_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meetings_user_id_idx" ON "meetings"("user_id");

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
