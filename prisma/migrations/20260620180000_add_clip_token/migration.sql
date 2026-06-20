-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clipToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_clipToken_key" ON "User"("clipToken");