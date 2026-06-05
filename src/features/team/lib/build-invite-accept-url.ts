import { getPublicAppUrl } from "@/shared/config/env";

export function buildInviteAcceptUrl(token: string): string {
  return `${getPublicAppUrl()}/accept-invite?invite=${encodeURIComponent(token)}`;
}
