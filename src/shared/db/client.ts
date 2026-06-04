import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getDatabaseUrl } from "@/shared/config/env";
import * as digitalEmployeeRelations from "@/entities/digital-employee/relations";
import * as digitalEmployeeSchema from "@/entities/digital-employee/schema";
import * as employeeLifecycleRelations from "@/entities/employee-lifecycle/relations";
import * as employeeLifecycleSchema from "@/entities/employee-lifecycle/schema";
import * as knowledgeRelations from "@/entities/knowledge/relations";
import * as knowledgeSchema from "@/entities/knowledge/schema";
import * as runtimeRelations from "@/entities/runtime/relations";
import * as runtimeSchema from "@/entities/runtime/schema";
import * as employeeSessionRelations from "@/entities/session/relations";
import * as employeeSessionSchema from "@/entities/session/schema";
import * as membershipRelations from "@/entities/membership/relations";
import * as membershipSchema from "@/entities/membership/schema";
import * as organizationRelations from "@/entities/organization/relations";
import * as organizationSchema from "@/entities/organization/schema";
import * as userRelations from "@/entities/user/relations";
import * as userSchema from "@/entities/user/schema";
import * as authRelations from "@/features/auth/relations";
import * as authSchema from "@/features/auth/schema";
import * as sharedSchema from "./schema";

const sql = neon(getDatabaseUrl());

export const db = drizzle({
  client: sql,
  schema: {
    ...sharedSchema,
    ...authSchema,
    ...authRelations,
    ...userSchema,
    ...userRelations,
    ...organizationSchema,
    ...organizationRelations,
    ...membershipSchema,
    ...membershipRelations,
    ...digitalEmployeeSchema,
    ...digitalEmployeeRelations,
    ...knowledgeSchema,
    ...knowledgeRelations,
    ...runtimeSchema,
    ...runtimeRelations,
    ...employeeSessionSchema,
    ...employeeSessionRelations,
    ...employeeLifecycleSchema,
    ...employeeLifecycleRelations,
  },
});
