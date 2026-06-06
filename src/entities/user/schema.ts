import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { dataRegionEnum } from "@/entities/organization/schema";

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "invited",
  "suspended",
  "deleted",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  status: userStatusEnum("status").notNull().default("active"),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  dataRegion: dataRegionEnum("data_region"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
