import type { useTranslations } from "next-intl";

type OptionsTranslator = ReturnType<typeof useTranslations<"settings.options">>;

export function optionLabel(
  t: OptionsTranslator,
  labelKey: string,
): string {
  return t(labelKey as Parameters<OptionsTranslator>[0]);
}
