import * as digitalEmployeeRelations from "@/entities/digital-employee/relations";
import * as digitalEmployeeSchema from "@/entities/digital-employee/schema";
import * as employeeLifecycleRelations from "@/entities/employee-lifecycle/relations";
import * as employeeLifecycleSchema from "@/entities/employee-lifecycle/schema";
import * as providerConfigRelations from "@/entities/provider-config/relations";
import * as providerConfigSchema from "@/entities/provider-config/schema";
import * as knowledgeRelations from "@/entities/knowledge/relations";
import * as knowledgeSchema from "@/entities/knowledge/schema";
import * as runtimeRelations from "@/entities/runtime/relations";
import * as runtimeSchema from "@/entities/runtime/schema";
import * as employeeSessionRelations from "@/entities/session/relations";
import * as employeeSessionSchema from "@/entities/session/schema";
import * as apiKeyRelations from "@/entities/api-key/relations";
import * as apiKeySchema from "@/entities/api-key/schema";
import * as exportJobRelations from "@/entities/export-job/relations";
import * as exportJobSchema from "@/entities/export-job/schema";
import * as integrationConnectionRelations from "@/entities/integration-connection/relations";
import * as integrationConnectionSchema from "@/entities/integration-connection/schema";
import * as membershipRelations from "@/entities/membership/relations";
import * as membershipSchema from "@/entities/membership/schema";
import * as organizationInviteRelations from "@/entities/organization-invite/relations";
import * as organizationInviteSchema from "@/entities/organization-invite/schema";
import * as organizationRelations from "@/entities/organization/relations";
import * as organizationSchema from "@/entities/organization/schema";
import * as organizationSettingsRelations from "@/entities/organization-settings/relations";
import * as organizationSettingsSchema from "@/entities/organization-settings/schema";
import * as userRelations from "@/entities/user/relations";
import * as userSchema from "@/entities/user/schema";
import * as authRelations from "@/features/auth/relations";
import * as authSchema from "@/features/auth/schema";
import * as sharedSchema from "./schema";

export const drizzleSchema = {
  ...sharedSchema,
  ...authSchema,
  ...authRelations,
  ...userSchema,
  ...userRelations,
  ...organizationSchema,
  ...organizationRelations,
  ...organizationInviteSchema,
  ...organizationInviteRelations,
  ...apiKeySchema,
  ...apiKeyRelations,
  ...exportJobSchema,
  ...exportJobRelations,
  ...integrationConnectionSchema,
  ...integrationConnectionRelations,
  ...organizationSettingsSchema,
  ...organizationSettingsRelations,
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
  ...providerConfigSchema,
  ...providerConfigRelations,
};
