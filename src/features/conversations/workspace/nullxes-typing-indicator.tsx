"use client";

import { useTranslations } from "next-intl";
import { useTypingContext } from "stream-chat-react";

export function NullxesTypingIndicator() {
  const t = useTranslations("conversations");
  const { typing } = useTypingContext();

  if (!typing || Object.keys(typing).length === 0) {
    return null;
  }

  return (
    <div className="px-6 pb-4">
      <p className="text-xs font-normal text-white/35">{t("typingIndicator")}</p>
    </div>
  );
}
