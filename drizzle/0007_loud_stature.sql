CREATE TYPE "public"."provider_config_type" AS ENUM('avatar', 'brain', 'session');--> statement-breakpoint
CREATE TABLE "employee_provider_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"provider_type" "provider_config_type" NOT NULL,
	"provider_id" text NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employee_provider_config_employee_type_unique" UNIQUE("employee_id","provider_type")
);
--> statement-breakpoint
ALTER TABLE "employee_provider_config" ADD CONSTRAINT "employee_provider_config_employee_id_digital_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."digital_employee"("id") ON DELETE cascade ON UPDATE no action;