CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
ALTER TYPE "public"."knowledge_source_type" ADD VALUE 'session_summary';--> statement-breakpoint
ALTER TABLE "knowledge_chunk" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
ALTER TABLE "knowledge_chunk" ADD COLUMN "embedding_model" text DEFAULT 'text-embedding-3-small';--> statement-breakpoint
ALTER TABLE "knowledge_chunk" ADD COLUMN "token_count" integer;--> statement-breakpoint
CREATE INDEX "knowledge_chunk_embedding_hnsw_idx" ON "knowledge_chunk" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
ALTER TABLE "employee_session" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "employee_session" ADD COLUMN "summary_knowledge_source_id" uuid;--> statement-breakpoint
ALTER TABLE "employee_session" ADD CONSTRAINT "employee_session_summary_knowledge_source_id_knowledge_source_id_fk" FOREIGN KEY ("summary_knowledge_source_id") REFERENCES "public"."knowledge_source"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE TYPE "public"."session_message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TABLE "employee_session_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" "session_message_role" NOT NULL,
	"content" text NOT NULL,
	"sequence" integer NOT NULL,
	"stream_message_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_session_message" ADD CONSTRAINT "employee_session_message_session_id_employee_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."employee_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TYPE "public"."employee_task_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."employee_task_source" AS ENUM('talk_tool', 'api', 'followup', 'handoff', 'session_summary');--> statement-breakpoint
CREATE TABLE "employee_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"session_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "employee_task_status" DEFAULT 'pending' NOT NULL,
	"source" "employee_task_source" DEFAULT 'api' NOT NULL,
	"due_at" timestamp with time zone,
	"result" text,
	"callback_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "employee_task" ADD CONSTRAINT "employee_task_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_task" ADD CONSTRAINT "employee_task_employee_id_digital_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."digital_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_task" ADD CONSTRAINT "employee_task_session_id_employee_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."employee_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE TYPE "public"."employee_work_event_type" AS ENUM('task_received', 'task_completed', 'followup_executed', 'knowledge_updated', 'session_summarized', 'api_response_sent', 'handoff_created', 'approval_requested', 'approval_resolved');--> statement-breakpoint
CREATE TABLE "employee_work_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"task_id" uuid,
	"session_id" uuid,
	"event_type" "employee_work_event_type" NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_work_event" ADD CONSTRAINT "employee_work_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_work_event" ADD CONSTRAINT "employee_work_event_employee_id_digital_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."digital_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_work_event" ADD CONSTRAINT "employee_work_event_task_id_employee_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."employee_task"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_work_event" ADD CONSTRAINT "employee_work_event_session_id_employee_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."employee_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE TYPE "public"."agent_approval_status" AS ENUM('pending', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TABLE "agent_approval_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"task_id" uuid,
	"action_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "agent_approval_status" DEFAULT 'pending' NOT NULL,
	"reviewer_user_id" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "agent_approval_request" ADD CONSTRAINT "agent_approval_request_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_approval_request" ADD CONSTRAINT "agent_approval_request_employee_id_digital_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."digital_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_approval_request" ADD CONSTRAINT "agent_approval_request_task_id_employee_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."employee_task"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_approval_request" ADD CONSTRAINT "agent_approval_request_reviewer_user_id_user_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE TYPE "public"."employee_handoff_status" AS ENUM('pending', 'accepted', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "employee_handoff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_employee_id" uuid NOT NULL,
	"to_employee_id" uuid NOT NULL,
	"task_id" uuid,
	"context" jsonb NOT NULL,
	"status" "employee_handoff_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "employee_handoff" ADD CONSTRAINT "employee_handoff_from_employee_id_digital_employee_id_fk" FOREIGN KEY ("from_employee_id") REFERENCES "public"."digital_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_handoff" ADD CONSTRAINT "employee_handoff_to_employee_id_digital_employee_id_fk" FOREIGN KEY ("to_employee_id") REFERENCES "public"."digital_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_handoff" ADD CONSTRAINT "employee_handoff_task_id_employee_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."employee_task"("id") ON DELETE set null ON UPDATE no action;
