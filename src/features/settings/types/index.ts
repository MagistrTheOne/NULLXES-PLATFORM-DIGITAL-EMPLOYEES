import type { BrainProvider } from "@/entities/digital-employee";
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
};

export type SecuritySnapshot = {
  activeAuthSessions: number;
  apiKeysConfigured: boolean;
  twoFactorEnabled: boolean;
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
};
