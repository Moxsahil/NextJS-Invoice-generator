-- AlterEnum
ALTER TYPE "public"."InvoiceStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "trialEndsAt" SET DEFAULT NOW() + INTERVAL '7 days';
