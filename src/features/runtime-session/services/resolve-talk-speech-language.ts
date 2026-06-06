import { getOrganizationDisplayPreferences } from "@/features/workspace/services/get-organization-display-preferences";
import { getRequestLocale } from "@/i18n/request";
import {
  DEFAULT_LOCALE,
  isAppLocale,
  type AppLocale,
} from "@/i18n/config";

/** Anam STT language — user UI locale first, then org settings, then English. */
export async function resolveTalkSpeechLanguageCode(
  organizationId: string,
): Promise<AppLocale> {
  const [userLocale, orgPreferences] = await Promise.all([
    getRequestLocale(),
    getOrganizationDisplayPreferences(organizationId),
  ]);

  if (isAppLocale(userLocale)) {
    return userLocale;
  }

  if (isAppLocale(orgPreferences.language)) {
    return orgPreferences.language;
  }

  return DEFAULT_LOCALE;
}
