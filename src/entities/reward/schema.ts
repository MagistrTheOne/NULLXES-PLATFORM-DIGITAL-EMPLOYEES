import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";

export const rewardRarityEnum = pgEnum("reward_rarity", [
  "core",
  "professional",
  "premium",
  "executive",
  "founders",
]);

// "idle" retained in PG enum for migration compatibility; catalog no longer seeds it.
export const rewardTypeEnum = pgEnum("reward_type", [
  "skill_chip",
  "appearance",
  "voice",
  "idle",
  "background",
  "frame",
]);

export const capsulePriceKeyEnum = pgEnum("capsule_price_key", [
  "free",
  "99",
  "4999",
]);

export const capsuleTierIdEnum = pgEnum("capsule_tier_id", [
  "daily",
  "standard",
  "executive",
]);

export const capsuleOpenSourceEnum = pgEnum("capsule_open_source", [
  "daily",
  "purchase",
  "holding",
]);

/** Platform reward catalog (organization_id null). */
export const rewardDefinition = pgTable(
  "reward_definition",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    type: rewardTypeEnum("type").notNull(),
    rarity: rewardRarityEnum("rarity").notNull(),
    description: text("description").notNull(),
    compatible: text("compatible").notNull().default("All Employees"),
    boostLabel: text("boost_label"),
    featured: boolean("featured").notNull().default(false),
    comingSoon: boolean("coming_soon").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("reward_definition_slug_uidx").on(table.slug)],
);

/** Platform capsule store tiers. */
export const capsuleTier = pgTable("capsule_tier", {
  id: capsuleTierIdEnum("id").primaryKey(),
  name: text("name").notNull(),
  priceKey: capsulePriceKeyEnum("price_key").notNull(),
  priceLabel: text("price_label").notNull(),
  blurb: text("blurb").notNull(),
  activateLabel: text("activate_label").notNull().default("Activate"),
  rewardPreviewSlugs: text("reward_preview_slugs")
    .array()
    .notNull()
    .default([]),
  isStore: boolean("is_store").notNull().default(false),
  isDaily: boolean("is_daily").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** Org-owned reward quantities. */
export const organizationRewardItem = pgTable(
  "organization_reward_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    rewardSlug: text("reward_slug").notNull(),
    ownedCount: integer("owned_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("organization_reward_item_org_slug_uidx").on(
      table.organizationId,
      table.rewardSlug,
    ),
  ],
);

/** Per-org capsule owned counts (non-daily inventory holds). */
export const organizationCapsuleHolding = pgTable(
  "organization_capsule_holding",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    tierId: capsuleTierIdEnum("tier_id").notNull(),
    ownedCount: integer("owned_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("organization_capsule_holding_org_tier_uidx").on(
      table.organizationId,
      table.tierId,
    ),
  ],
);

/** Daily Base Capsule claim window per org. */
export const organizationDailyCapsule = pgTable(
  "organization_daily_capsule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    lastClaimedAt: timestamp("last_claimed_at", { withTimezone: true }),
    nextAvailableAt: timestamp("next_available_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("organization_daily_capsule_org_uidx").on(table.organizationId),
  ],
);

/** Per-employee equipped rewards. */
export const employeeRewardLoadout = pgTable(
  "employee_reward_loadout",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => digitalEmployee.id, { onDelete: "cascade" }),
    appearanceSlug: text("appearance_slug"),
    voiceSlug: text("voice_slug"),
    backgroundSlug: text("background_slug"),
    frameSlug: text("frame_slug"),
    skillChipSlugs: text("skill_chip_slugs").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("employee_reward_loadout_employee_uidx").on(table.employeeId),
  ],
);

/** Capsule open / drop history. */
export const capsuleOpenEvent = pgTable("capsule_open_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  tierId: capsuleTierIdEnum("tier_id").notNull(),
  source: capsuleOpenSourceEnum("source").notNull(),
  rewardSlug: text("reward_slug").notNull(),
  paymentOrderId: text("payment_order_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
