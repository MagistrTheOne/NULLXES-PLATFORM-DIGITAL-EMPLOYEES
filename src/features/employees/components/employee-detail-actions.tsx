"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import type { BrainProvider, EmployeeStatus } from "@/entities/digital-employee";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  BrainModelSelect,
  BrainProviderCards,
} from "@/features/brain";
import type { BrainProviderReadinessMap } from "@/features/brain/lib/brain-provider-readiness";
import { getDefaultBrainModelForProvider } from "@/features/settings/lib/brain-model-defaults";
import { useWorkspacePermissions } from "@/features/workspace/components/workspace-permissions-provider";
import { deleteEmployeeAction } from "../actions/delete-employee";
import { provisionEmployeeAvatarStudio } from "../actions/provision-employee-avatar-studio";
import { updateEmployeeAction } from "../actions/update-employee";
import { getDefaultXaiVoiceInstructionsAction } from "@/features/xai-voice/actions/get-default-xai-voice-instructions";
import { MAX_AVATAR_UPLOAD_BYTES } from "../create/constants";
import { getInitialBrainModelForEdit } from "../lib/get-initial-brain-model-for-edit";
import { AvatarUpload } from "../studio/avatar/avatar-upload";
import type { EmployeeDetailShell } from "../types";

const DEFAULT_EDIT_STUDIO_VOICE_ID = "anam-lucy";

function resolveEditStudioVoiceId(employee: EmployeeDetailShell): string {
  return employee.studioVoiceId ?? DEFAULT_EDIT_STUDIO_VOICE_ID;
}

export function EmployeeDetailActions({
  employee,
  brainProviderReadiness,
}: {
  employee: EmployeeDetailShell;
  brainProviderReadiness: BrainProviderReadinessMap;
}) {
  const router = useRouter();
  const t = useTranslations("employees.detail.actions");
  const tCreate = useTranslations("employees.create");
  const tCommon = useTranslations("common.actions");
  const tStatus = useTranslations("employees.status");
  const permissions = useWorkspacePermissions();
  const canManage = permissions.canManageEmployees;
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const STATUS_OPTIONS: EmployeeStatus[] = [
    "draft",
    "active",
    "paused",
    "archived",
  ];

  const [name, setName] = useState(employee.name);
  const [role, setRole] = useState(employee.role);
  const [description, setDescription] = useState(employee.description ?? "");
  const [status, setStatus] = useState<EmployeeStatus>(employee.status);
  const [systemPrompt, setSystemPrompt] = useState(employee.systemPrompt);
  const [xaiVoiceEnabled, setXaiVoiceEnabled] = useState(employee.xaiVoiceEnabled);
  const [xaiVoiceInstructions, setXaiVoiceInstructions] = useState(
    employee.xaiVoiceInstructions ?? "",
  );
  const [xaiVoiceBindConsoleAgent, setXaiVoiceBindConsoleAgent] = useState(
    employee.xaiVoiceBindConsoleAgent,
  );
  const [xaiVoiceAgentId, setXaiVoiceAgentId] = useState(
    employee.xaiVoiceAgentId ?? "",
  );
  const [brainProvider, setBrainProvider] = useState<BrainProvider>(
    employee.brainProvider,
  );
  const [brainModel, setBrainModel] = useState(() =>
    getInitialBrainModelForEdit(employee.brainProvider, employee.brainModel),
  );
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

  function clearLocalPhotoPreview(): void {
    if (localPreviewUrlRef.current) {
      URL.revokeObjectURL(localPreviewUrlRef.current);
      localPreviewUrlRef.current = null;
    }
    setLocalPreviewUrl(null);
  }

  function resetPhotoSelection(): void {
    clearLocalPhotoPreview();
    setPhotoFile(null);
    setPhotoFileName(null);
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

  function resetForm(): void {
    setName(employee.name);
    setRole(employee.role);
    setDescription(employee.description ?? "");
    setStatus(employee.status);
    setSystemPrompt(employee.systemPrompt);
    setXaiVoiceEnabled(employee.xaiVoiceEnabled);
    setXaiVoiceInstructions(employee.xaiVoiceInstructions ?? "");
    setXaiVoiceBindConsoleAgent(employee.xaiVoiceBindConsoleAgent);
    setXaiVoiceAgentId(employee.xaiVoiceAgentId ?? "");
    setBrainProvider(employee.brainProvider);
    setBrainModel(
      getInitialBrainModelForEdit(employee.brainProvider, employee.brainModel),
    );
    resetPhotoSelection();
    setErrorMessage(null);
  }

  function handleEditOpenChange(open: boolean): void {
    setEditOpen(open);
    if (open) {
      resetForm();
    }
  }

  function handleSave(): void {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await updateEmployeeAction({
        employeeId: employee.id,
        name,
        role,
        description,
        status,
        systemPrompt,
        brainProvider,
        brainModel,
        xaiVoiceEnabled: employee.xaiVoiceConfigured ? xaiVoiceEnabled : undefined,
        xaiVoiceInstructions: employee.xaiVoiceConfigured
          ? xaiVoiceInstructions
          : undefined,
        xaiVoiceBindConsoleAgent: employee.xaiVoiceConfigured
          ? xaiVoiceBindConsoleAgent
          : undefined,
        xaiVoiceAgentId: employee.xaiVoiceConfigured
          ? xaiVoiceAgentId.trim() || null
          : undefined,
      });

      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }

      if (photoFile && employee.avatarProvider === "anam") {
        const avatarPayload = new FormData();
        avatarPayload.append("file", photoFile);
        avatarPayload.append("name", name.trim());
        avatarPayload.append("role", role.trim());
        avatarPayload.append("studioVoiceId", resolveEditStudioVoiceId(employee));
        if (photoFileName) {
          avatarPayload.append("photoFileName", photoFileName);
        }
        avatarPayload.append("photoFileSize", String(photoFile.size));

        const provisioned = await provisionEmployeeAvatarStudio(
          employee.id,
          avatarPayload,
        );

        if (!provisioned.ok) {
          setErrorMessage(provisioned.message);
          return;
        }
      }

      setEditOpen(false);
      router.refresh();
    });
  }

  function handleDelete(): void {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteEmployeeAction(employee.id);

      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }

      setDeleteOpen(false);
      router.push("/dashboard/employees");
      router.refresh();
    });
  }

  if (!canManage) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="border-white/12 bg-transparent text-white hover:bg-white/5"
          onClick={() => handleEditOpenChange(true)}
        >
          <Pencil className="size-4" />
          {t("edit")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/12 bg-transparent text-white/70 hover:border-white/20 hover:bg-white/5 hover:text-white"
          onClick={() => {
            setErrorMessage(null);
            setDeleteOpen(true);
          }}
        >
          <Trash2 className="size-4" />
          {t("delete")}
        </Button>
      </div>

      <Sheet open={editOpen} onOpenChange={handleEditOpenChange}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto border-white/10 bg-[#0a0a0a] text-white sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>{t("editTitle")}</SheetTitle>
            <SheetDescription className="text-white/50">
              {t("editDescription")}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4">
            <div className="space-y-2">
              <Label htmlFor="employee-name">{t("name")}</Label>
              <Input
                id="employee-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="border-white/12 bg-[#111111] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-role">{t("role")}</Label>
              <Input
                id="employee-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="border-white/12 bg-[#111111] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-description">{t("description")}</Label>
              <Textarea
                id="employee-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="border-white/12 bg-[#111111] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("status")}</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as EmployeeStatus)}
              >
                <SelectTrigger className="border-white/12 bg-[#111111] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/12 bg-[#111111] text-white">
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {tStatus(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-system-prompt">{t("systemPrompt")}</Label>
              <Textarea
                id="employee-system-prompt"
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                rows={6}
                className="border-white/12 bg-[#111111] text-white"
              />
            </div>
            {employee.xaiVoiceConfigured ? (
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/2 p-4">
                <div className="space-y-1">
                  <Label className="text-white/85">{t("xaiVoiceTitle")}</Label>
                  <p className="text-xs text-white/45">{t("xaiVoiceHint")}</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={xaiVoiceEnabled}
                    onChange={(event) => setXaiVoiceEnabled(event.target.checked)}
                    disabled={isPending}
                    className="size-4 rounded border-white/20"
                  />
                  {t("xaiVoiceEnabled")}
                </label>
                <label className="flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={xaiVoiceBindConsoleAgent}
                    onChange={(event) =>
                      setXaiVoiceBindConsoleAgent(event.target.checked)
                    }
                    disabled={isPending || !xaiVoiceEnabled}
                    className="size-4 rounded border-white/20"
                  />
                  {t("xaiVoiceBindConsole")}
                </label>
                {xaiVoiceBindConsoleAgent ? (
                  <div className="space-y-2">
                    <Label htmlFor="xai-voice-agent-id">{t("xaiVoiceAgentId")}</Label>
                    <Input
                      id="xai-voice-agent-id"
                      value={xaiVoiceAgentId}
                      onChange={(event) => setXaiVoiceAgentId(event.target.value)}
                      placeholder="agent_..."
                      disabled={isPending || !xaiVoiceEnabled}
                      className="border-white/12 bg-[#111111] text-white"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="xai-voice-instructions">
                        {t("xaiVoiceInstructions")}
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-white/12 text-white"
                        disabled={isPending || !xaiVoiceEnabled}
                        onClick={() => {
                          startTransition(async () => {
                            const result = await getDefaultXaiVoiceInstructionsAction(
                              employee.id,
                            );
                            if (result.ok) {
                              setXaiVoiceInstructions(result.instructions);
                              setErrorMessage(null);
                            } else {
                              setErrorMessage(result.message);
                            }
                          });
                        }}
                      >
                        {t("xaiVoiceResetPrompt")}
                      </Button>
                    </div>
                    <Textarea
                      id="xai-voice-instructions"
                      value={xaiVoiceInstructions}
                      onChange={(event) =>
                        setXaiVoiceInstructions(event.target.value)
                      }
                      rows={8}
                      disabled={isPending || !xaiVoiceEnabled}
                      className="border-white/12 bg-[#111111] text-white"
                    />
                  </div>
                )}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label className="text-white/80">{t("brainProvider")}</Label>
              <BrainProviderCards
                variant="settings"
                selectedProvider={brainProvider}
                providerReadiness={brainProviderReadiness}
                disabled={isPending}
                onProviderChange={(provider) => {
                  setBrainProvider(provider);
                  setBrainModel(getDefaultBrainModelForProvider(provider));
                }}
              />
            </div>
            <div className="space-y-2">
              <BrainModelSelect
                variant="settings"
                provider={brainProvider}
                value={brainModel}
                disabled={isPending}
                label={t("brainModel")}
                onValueChange={setBrainModel}
              />
              <p className="text-xs text-white/45">{t("reprovisionHint")}</p>
            </div>
            {employee.avatarProvider === "anam" ? (
              <div className="space-y-2">
                <Label className="text-white/80">{t("avatarPhoto")}</Label>
                <p className="text-xs text-white/45">{t("avatarPhotoHint")}</p>
                {employee.anamApiKeySlot ? (
                  <p className="text-xs text-white/45">
                    {t("avatarPinnedSlot", { slot: employee.anamApiKeySlot })}
                  </p>
                ) : null}
                <AvatarUpload
                  photoFileName={photoFileName}
                  localPreviewUrl={localPreviewUrl ?? employee.avatarPreviewUrl}
                  disabled={isPending}
                  onFileSelected={handlePhotoSelected}
                />
              </div>
            ) : null}
            {errorMessage ? (
              <p className="text-sm text-white/65" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>

          <SheetFooter className="border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              className="border-white/12 text-white"
              disabled={isPending}
              onClick={() => setEditOpen(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              className="bg-white text-black hover:bg-white/90"
              disabled={isPending}
              onClick={handleSave}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                tCommon("saveChanges")
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-white/10 bg-[#111111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteTitle", { name: employee.name })}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/55">
              {t("deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorMessage ? (
            <p className="text-sm text-white/65" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/12 bg-transparent text-white hover:bg-white/5">
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-white text-black hover:bg-white/90"
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
            >
              {isPending ? t("deleting") : t("deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
