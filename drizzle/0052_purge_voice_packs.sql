-- Temporarily purge Voice Pack rewards from catalog + loadouts.
-- Studio / Talk employee voices are unchanged. PG enum "voice" may remain.

DELETE FROM "organization_reward_item"
WHERE "reward_slug" IN (
  'exec-voice',
  'calm-voice',
  'board-presence',
  'briefing-tone'
)
   OR "reward_slug" IN (
     SELECT "slug" FROM "reward_definition"
     WHERE "type"::text = 'voice'
   );
--> statement-breakpoint
DELETE FROM "reward_definition"
WHERE "type"::text = 'voice';
--> statement-breakpoint
UPDATE "employee_reward_loadout"
SET "voice_slug" = NULL,
    "updated_at" = NOW();
--> statement-breakpoint
UPDATE "capsule_tier"
SET "reward_preview_slugs" = ARRAY['office-soft', 'minimal-frame', 'board-room']::text[],
    "updated_at" = NOW()
WHERE "id" = 'daily';
--> statement-breakpoint
UPDATE "capsule_tier"
SET "reward_preview_slugs" = ARRAY['board-room', 'thin-line', 'office-soft']::text[],
    "updated_at" = NOW()
WHERE "id" = 'standard';
--> statement-breakpoint
UPDATE "capsule_tier"
SET "reward_preview_slugs" = ARRAY['legendary-frame', 'board-room', 'thin-line']::text[],
    "updated_at" = NOW()
WHERE "id" = 'executive';
