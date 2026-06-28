import type { BrainProvider } from "@/entities/digital-employee";
import type { BrainProviderReadinessMap } from "@/features/brain/lib/brain-provider-readiness";
import type { PendingApprovalRow } from "@/features/agent-approval/queries/list-pending-approvals";
import type { MembershipRole } from "@/features/workspace/types";
import type { SystemStatusItem } from "@/features/overview/types";

export type OrganizationSettingsDto = {
  website: string | null;
  industry: string;
  timezone: string;
  theme: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  defaultTimeRangeDays: number;
  compactMode: boolean;
  defaultBrainProvider: BrainProvider;
  defaultBrainModel: string;
  knowledgeProcessing: string;
  sessionRetentionDays: number;
  retentionPolicyDays: number;
  notifySessionCompleted: boolean;
  notifyEmployeeCreated: boolean;
  notifyKnowledgeFailed: boolean;
  notifyWeeklyDigest: boolean;
  requireTwoFactorForAdmins: boolean;
  outboundWebhookUrl: string | null;
  outboundWebhookConfigured: boolean;
  apiIpAllowlist: string | null;
  lastRetentionRunAt: Date | null;
};

export type ApiKeyListItem = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
};

export type SecuritySnapshot = {
  activeAuthSessions: number;
  apiKeysConfigured: boolean;
  twoFactorEnabled: boolean;
  requireTwoFactorForAdmins: boolean;
  outboundWebhookUrl: string | null;
  outboundWebhookConfigured: boolean;
  apiIpAllowlist: string | null;
  apiKeys: ApiKeyListItem[];
};

export type OrganizationProfileDto = {
  id: string;
  name: string;
  type: string;
  billingPlan: string;
  createdAt: Date;
};

export type TeamMemberRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: MembershipRole;
  createdAt: Date;
};

export type TeamInviteRow = {
  id: string;
  email: string;
  role: MembershipRole;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  invitedByName: string;
};

export type SettingsUsageSnapshot = {
  totalSessions: number;
  totalConversationSeconds: number;
  totalMessages: number;
  totalKnowledgeSources: number;
  sessionTrendPercent: number | null;
  conversationTrendPercent: number | null;
  messagesTrendPercent: number | null;
  knowledgeTrendPercent: number | null;
};

export type SettingsContextPanel = {
  memberCount: number;
  employeeCount: number;
  activeEmployees: number;
  activeNow: number;
  totalChunks: number;
  usage: SettingsUsageSnapshot;
  teamMembers: TeamMemberRow[];
};

export type AuditEventListItem = {
  id: string;
  action: string;
  actorUserId: string | null;
  actorRole: string | null;
  resourceType: string | null;
  resourceId: string | null;
  createdAt: Date;
};

export type SettingsPageData = {
  canManageOrganization: boolean;
  canManageMembers: boolean;
  currentUserId: string;
  actorRole: MembershipRole;
  organization: OrganizationProfileDto;
  settings: OrganizationSettingsDto;
  context: SettingsContextPanel;
  pendingInvites: TeamInviteRow[];
  integrations: SystemStatusItem[];
  security: SecuritySnapshot;
  auditEvents: AuditEventListItem[];
  pendingApprovals: PendingApprovalRow[];
  brainProviderReadiness: BrainProviderReadinessMap;
};
