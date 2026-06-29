"use client";

import { useState, useTransition } from "react";
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
import { updateEmployeeAction } from "../actions/update-employee";
import { getInitialBrainModelForEdit } from "../services/update-employee";
import type { EmployeeDetailShell } from "../types";

export function EmployeeDetailActions({
  employee,
  brainProviderReadiness,
}: {
  employee: EmployeeDetailShell;
  brainProviderReadiness: BrainProviderReadinessMap;
}) {
  const router = useRouter();
  const t = useTranslations("employees.detail.actions");
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
  const [brainProvider, setBrainProvider] = useState<BrainProvider>(
    employee.brainProvider,
  );
  const [brainModel, setBrainModel] = useState(() =>
    getInitialBrainModelForEdit(employee.brainProvider, employee.brainModel),
  );

  function resetForm(): void {
    setName(employee.name);
    setRole(employee.role);
    setDescription(employee.description ?? "");
    setStatus(employee.status);
    setSystemPrompt(employee.systemPrompt);
    setBrainProvider(employee.brainProvider);
    setBrainModel(
      getInitialBrainModelForEdit(employee.brainProvider, employee.brainModel),
    );
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
      });

      if (!result.ok) {
        setErrorMessage(result.message);
        return;
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
