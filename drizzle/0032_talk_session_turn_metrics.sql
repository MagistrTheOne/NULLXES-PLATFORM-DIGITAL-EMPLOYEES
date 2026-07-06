ALTER TABLE "employee_session" ADD COLUMN "talk_brain_cache" jsonb;

CREATE TABLE "employee_session_turn" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"turn_id" uuid NOT NULL,
	"voice_mode" text,
	"spans" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"flags" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"e2e_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employee_session_turn_turn_id_unique" UNIQUE("turn_id")
);

ALTER TABLE "employee_session_turn" ADD CONSTRAINT "employee_session_turn_session_id_employee_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."employee_session"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "employee_session_turn" ADD CONSTRAINT "employee_session_turn_employee_id_digital_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."digital_employee"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "employee_session_turn_session_id_created_at_idx" ON "employee_session_turn" USING btree ("session_id","created_at");
