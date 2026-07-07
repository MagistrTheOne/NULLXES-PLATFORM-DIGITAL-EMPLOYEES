"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { provisionEmployeeAvatarStudio } from "@/features/employees/actions/provision-employee-avatar-studio";
import { MAX_AVATAR_UPLOAD_BYTES } from "@/features/employees/create/constants";
import { AvatarUpload } from "@/features/employees/studio/avatar/avatar-upload";
import { useWorkspacePermissions } from "@/features/workspace/components/workspace-permissions-provider";

const DEFAULT_STUDIO_VOICE_ID = "anam-lucy";

export function InspectorAvatarSetup({
  employeeId,
  name,
  role,
  studioVoiceId,
}: {
  employeeId: string;
  name: string;
  role: string;
  studioVoiceId?: string | null;
}) {
  const t = useTranslations("conversations.avatarSetup");
  const tCreate = useTranslations("employees.create");
  const permissions = useWorkspacePermissions();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const localPreviewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreviewUrlRef.current) {
        URL.revokeObjectURL(localPreviewUrlRef.current);
      }
    };
  }, []);

  if (!permissions.canManageEmployees) {
    return (
      <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-3 text-xs leading-5 text-amber-100/85">
        <p>{t("message")}</p>
      </div>
    );
  }

  function clearLocalPhotoPreview(): void {
    if (localPreviewUrlRef.current) {
      URL.revokeObjectURL(localPreviewUrlRef.current);
      localPreviewUrlRef.current = null;
    }
    setLocalPreviewUrl(null);
  }

  function handlePhotoSelected(file: File): void {
    if (!file.type.startsWith("image/")) {
      setErrorMessage(tCreate("errors.invalidImage"));
      return;
    }

    if (file.size > MAX_AVATAR_UPLOAD_BYTES) {
      setErrorMessage(tCreate("errors.imageTooLarge"));
      return;
    }

    clearLocalPhotoPreview();
    const previewUrl = URL.createObjectURL(file);
    localPreviewUrlRef.current = previewUrl;
    setLocalPreviewUrl(previewUrl);
    setPhotoFile(file);
    setPhotoFileName(file.name);
    setErrorMessage(null);
  }

  function handleUpload(): void {
    if (!photoFile) {
      setErrorMessage(t("pickPhoto"));
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const avatarPayload = new FormData();
      avatarPayload.append("file", photoFile);
      avatarPayload.append("name", name.trim());
      avatarPayload.append("role", role.trim());
      avatarPayload.append(
        "studioVoiceId",
        studioVoiceId?.trim() || DEFAULT_STUDIO_VOICE_ID,
      );
      if (photoFileName) {
        avatarPayload.append("photoFileName", photoFileName);
      }
      avatarPayload.append("photoFileSize", String(photoFile.size));

      const provisioned = await provisionEmployeeAvatarStudio(
        employeeId,
        avatarPayload,
      );

      if (!provisioned.ok) {
        setErrorMessage(provisioned.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-3 text-xs leading-5 text-amber-100/85">
      <p>{t("messageInline")}</p>
      <div className="mt-3">
        <AvatarUpload
          photoFileName={photoFileName}
          localPreviewUrl={localPreviewUrl}
          disabled={isPending}
          onFileSelected={handlePhotoSelected}
        />
      </div>
      {errorMessage ? (
        <p className="mt-3 text-sm text-red-200/90" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 border-amber-200/20 text-amber-50 hover:bg-amber-400/10"
        disabled={isPending || !photoFile}
        onClick={handleUpload}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            {t("uploading")}
          </>
        ) : (
          t("action")
        )}
      </Button>
    </div>
  );
}
