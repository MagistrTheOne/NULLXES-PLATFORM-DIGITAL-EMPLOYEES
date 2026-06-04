CREATE TABLE "employee_runtime" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"brain_provider" "brain_provider" NOT NULL,
	"avatar_provider" "avatar_provider" NOT NULL,
	"system_prompt" text NOT NULL,
	"temperature" real DEFAULT 0.7 NOT NULL,
	"max_tokens" integer DEFAULT 4096 NOT NULL,
	"session_limit_seconds" integer DEFAULT 3600 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employee_runtime_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
ALTER TABLE "employee_runtime" ADD CONSTRAINT "employee_runtime_employee_id_digital_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."digital_employee"("id") ON DELETE cascade ON UPDATE no action;