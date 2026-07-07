UPDATE "employee_provider_config"
SET "config" = "config" || jsonb_build_object(
  'xaiVoiceEnabled', true,
  'xaiVoiceBindConsoleAgent', false,
  'xaiVoiceVoice', 'eve'
)
WHERE "provider_type" = 'session'
  AND NOT COALESCE(("config"->>'xaiVoiceEnabled')::boolean, false);--> statement-breakpoint
