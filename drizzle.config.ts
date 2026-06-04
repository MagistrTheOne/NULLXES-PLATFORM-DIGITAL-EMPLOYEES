import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./src/shared/db/schema.ts",
    "./src/features/auth/schema.ts",
    "./src/features/auth/relations.ts",
    "./src/entities/user/schema.ts",
    "./src/entities/user/relations.ts",
    "./src/entities/organization/schema.ts",
    "./src/entities/organization/relations.ts",
    "./src/entities/membership/schema.ts",
    "./src/entities/membership/relations.ts",
    "./src/entities/digital-employee/schema.ts",
    "./src/entities/digital-employee/relations.ts",
    "./src/entities/knowledge/schema.ts",
    "./src/entities/knowledge/relations.ts",
    "./src/entities/runtime/schema.ts",
    "./src/entities/runtime/relations.ts",
  ],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
});
