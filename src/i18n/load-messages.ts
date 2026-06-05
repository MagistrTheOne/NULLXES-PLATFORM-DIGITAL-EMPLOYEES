import type { AppLocale } from "./config";
import en from "./messages/en.json";
import ru from "./messages/ru.json";

const MESSAGES = {
  en,
  ru,
} as const;

export function loadMessages(locale: AppLocale) {
  return MESSAGES[locale];
}
