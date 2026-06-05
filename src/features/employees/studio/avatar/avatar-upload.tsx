"use client";

import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export function AvatarUpload({
  photoFileName,
  localPreviewUrl,
  disabled,
  onFileSelected,
}: {
  photoFileName: string | null;
  localPreviewUrl: string | null;
  disabled?: boolean;
  onFileSelected: (file: File) => void;
}) {
  const t = useTranslations("employees.studio.avatar");

  return (
    <label
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/2 hover:border-white/25 hover:bg-white/4",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <div className="relative flex aspect-4/3 w-full items-center justify-center">
        {localPreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={localPreviewUrl}
            alt={photoFileName ?? t("upload")}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-10">
            <Upload className="size-6 text-white/50" />
            <div className="text-center">
              <p className="text-sm font-medium text-white">{t("upload")}</p>
              <p className="mt-1 text-xs text-white/50">{t("formats")}</p>
            </div>
          </div>
        )}
        {localPreviewUrl ? (
          <div className="absolute inset-0 flex items-end justify-center bg-linear-to-t from-black/70 via-black/20 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
            <p className="text-sm font-medium text-white">{t("change")}</p>
          </div>
        ) : null}
      </div>
      {photoFileName ? (
        <p className="border-t border-white/10 px-4 py-2 text-center text-xs text-white/50">
          {photoFileName}
        </p>
      ) : null}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFileSelected(file);
          }
        }}
      />
    </label>
  );
}
