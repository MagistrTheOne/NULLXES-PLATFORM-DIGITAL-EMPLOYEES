"use client";

import { useTranslations } from "next-intl";
import { EmployeeMaterializationPortrait } from "./employee-materialization-portrait";

type EmployeeMaterializationCardPreviewProps = {
  portraitUrl: string | null;
  name: string;
  label: string;
};

export function EmployeeMaterializationCardPreview({
  portraitUrl,
  name,
  label,
}: EmployeeMaterializationCardPreviewProps) {
  const t = useTranslations("employees.card");

  return (
    <div className="absolute inset-0">
      <EmployeeMaterializationPortrait
        src={portraitUrl}
        alt={name}
        indeterminate
        sizes="(max-width: 768px) 100vw, 320px"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-white/8 bg-black/45 px-3 py-2 backdrop-blur-[2px]">
        <p className="text-center text-[10px] tracking-wide text-white/65 uppercase">
          {label || t("materializing")}
        </p>
        <div className="mt-2 h-px overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 bg-white/80 animate-employee-materialize-indeterminate" />
        </div>
      </div>
    </div>
  );
}
