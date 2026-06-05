import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  isAppLocale,
  LOCALE_COOKIE,
  type AppLocale,
} from "./config";

export async function getRequestLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  if (isAppLocale(cookieLocale)) {
    return cookieLocale;
  }

  return DEFAULT_LOCALE;
}
