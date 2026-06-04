import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getDatabaseUrl } from "@/shared/config/env";
import * as schema from "./schema";

const sql = neon(getDatabaseUrl());

export const db = drizzle({ client: sql, schema });
