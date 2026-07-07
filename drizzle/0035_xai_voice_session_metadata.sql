UPDATE "employee_provider_config"
SET "config" = "config" || jsonb_build_object(
  'xaiVoiceEnabled', true,
  'xaiVoiceAgentId', 'agent_yLXnJLDucVtucCck',
  'xaiVoiceBindConsoleAgent', true
)
WHERE "employee_id" = 'b0ab9bc2-aed4-4e1c-875f-dfb9180d234a'
  AND "provider_type" = 'session';--> statement-breakpoint
