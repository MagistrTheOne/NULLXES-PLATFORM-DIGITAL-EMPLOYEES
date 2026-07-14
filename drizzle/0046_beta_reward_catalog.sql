-- Beta reward catalog gap-fillers (slot coverage for drop tests).
-- Idempotent: skip rows that already exist by slug.

INSERT INTO "reward_definition" (
  "slug",
  "name",
  "type",
  "rarity",
  "description",
  "compatible",
  "boost_label",
  "featured",
  "coming_soon",
  "sort_order"
)
VALUES
  (
    'studio-neutral',
    'Studio Neutral',
    'appearance',
    'professional',
    'Clean studio look for day-to-day workforce presence.',
    'All Employees',
    NULL,
    false,
    false,
    12
  ),
  (
    'office-soft',
    'Office Soft',
    'background',
    'core',
    'Soft office backdrop for cards and Talk chrome.',
    'All Employees',
    NULL,
    false,
    false,
    13
  ),
  (
    'thin-line',
    'Thin Line',
    'frame',
    'core',
    'Hairline nameplate frame for employee cards.',
    'All Employees',
    NULL,
    false,
    false,
    14
  ),
  (
    'measured-pace',
    'Measured Pace',
    'idle',
    'premium',
    'Composed idle cadence for premium presence.',
    'All Employees',
    NULL,
    false,
    false,
    15
  ),
  (
    'briefing-tone',
    'Briefing Tone',
    'voice',
    'executive',
    'Sharp briefing delivery for leadership updates.',
    'All Employees',
    NULL,
    false,
    false,
    16
  )
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
UPDATE "capsule_tier"
SET
  "reward_preview_slugs" = ARRAY['knowledge-recall', 'office-soft', 'thin-line']::text[],
  "updated_at" = now()
WHERE "id" = 'daily';
--> statement-breakpoint
UPDATE "capsule_tier"
SET
  "reward_preview_slugs" = ARRAY['studio-neutral', 'calm-voice', 'sales-eff']::text[],
  "updated_at" = now()
WHERE "id" = 'standard';
--> statement-breakpoint
UPDATE "capsule_tier"
SET
  "reward_preview_slugs" = ARRAY['exec-black', 'measured-pace', 'briefing-tone']::text[],
  "updated_at" = now()
WHERE "id" = 'executive';
