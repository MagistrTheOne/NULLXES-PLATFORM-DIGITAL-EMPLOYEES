-- Purge Idle reward type from catalog + loadouts.
-- PG enum value "idle" may remain until a later enum rebuild; rows/column go away.

DELETE FROM "organization_reward_item"
WHERE "reward_slug" IN ('classic-idle', 'quiet-focus', 'measured-pace')
   OR "reward_slug" IN (
     SELECT "slug" FROM "reward_definition" WHERE "type"::text = 'idle'
   );
--> statement-breakpoint
DELETE FROM "reward_definition" WHERE "type"::text = 'idle';
--> statement-breakpoint
ALTER TABLE "employee_reward_loadout" DROP COLUMN IF EXISTS "idle_slug";
--> statement-breakpoint
-- Clear comingSoon on live voice packs (Voice Design path).
UPDATE "reward_definition"
SET "coming_soon" = false,
    "description" = CASE "slug"
      WHEN 'exec-voice' THEN 'ElevenLabs voice pack — corporate tone. Equips male/female variant via Voice Design.'
      WHEN 'calm-voice' THEN 'ElevenLabs voice pack — steady support tone. Male/female via Voice Design.'
      WHEN 'board-presence' THEN 'ElevenLabs voice pack — measured leadership briefings. Male/female via Voice Design.'
      WHEN 'briefing-tone' THEN 'ElevenLabs voice pack — sharp status briefings. Male/female via Voice Design.'
      ELSE "description"
    END,
    "featured" = CASE WHEN "slug" IN ('exec-voice', 'calm-voice') THEN true ELSE "featured" END,
    "updated_at" = NOW()
WHERE "type"::text = 'voice';
--> statement-breakpoint
UPDATE "capsule_tier"
SET "reward_preview_slugs" = ARRAY['exec-black', 'neg-mastery', 'briefing-tone']::text[]
WHERE "id" = 'executive';
