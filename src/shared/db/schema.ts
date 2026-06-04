import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const platformMetadata = pgTable("platform_metadata", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
