ALTER TYPE "public"."knowledge_source_status" ADD VALUE 'processing' BEFORE 'ready';--> statement-breakpoint
ALTER TABLE "knowledge_source" ADD COLUMN "failure_reason" text;