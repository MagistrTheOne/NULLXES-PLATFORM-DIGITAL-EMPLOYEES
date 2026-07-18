-- Temporarily purge Appearance + Skill Chip rewards from catalog + loadouts.
-- PG enum values "appearance" / "skill_chip" may remain until a later enum rebuild.

DELETE FROM "organization_reward_item"
WHERE "reward_slug" IN (
  'exec-black',
  'studio-neutral',
  'neg-mastery',
  'sales-eff',
  'knowledge-recall',
  'support-spec'
)
   OR "reward_slug" IN (
     SELECT "slug" FROM "reward_definition"
     WHERE "type"::text IN ('appearance', 'skill_chip')
   );
--> statement-breakpoint
DELETE FROM "reward_definition"
WHERE "type"::text IN ('appearance', 'skill_chip');
--> statement-breakpoint
UPDATE "employee_reward_loadout"
SET "appearance_slug" = NULL,
    "skill_chip_slugs" = ARRAY[]::text[],
    "updated_at" = NOW();
--> statement-breakpoint
UPDATE "capsule_tier"
SET "reward_preview_slugs" = ARRAY['office-soft', 'minimal-frame', 'calm-voice']::text[],
    "updated_at" = NOW()
WHERE "id" = 'daily';
--> statement-breakpoint
UPDATE "capsule_tier"
SET "reward_preview_slugs" = ARRAY['board-room', 'calm-voice', 'thin-line']::text[],
    "updated_at" = NOW()
WHERE "id" = 'standard';
--> statement-breakpoint
UPDATE "capsule_tier"
SET "reward_preview_slugs" = ARRAY['exec-voice', 'legendary-frame', 'briefing-tone']::text[],
    "updated_at" = NOW()
WHERE "id" = 'executive';
--> statement-breakpoint
-- Frame / cosmetic display metadata (existing orgs keep old names otherwise).
UPDATE "reward_definition"
SET "name" = 'Base Frame',
    "description" = 'Clean white nameplate frame for employee cards.',
    "updated_at" = NOW()
WHERE "slug" = 'minimal-frame';
--> statement-breakpoint
UPDATE "reward_definition"
SET "name" = 'Gold Frame',
    "rarity" = 'executive',
    "description" = 'Gold glow nameplate frame for executive presence.',
    "featured" = true,
    "updated_at" = NOW()
WHERE "slug" = 'thin-line';
