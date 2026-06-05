"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import type { EmployeeStatus } from "@/entities/digital-employee";
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
import { deleteEmployeeAction } from "../actions/delete-employee";
import { updateEmployeeAction } from "../actions/update-employee";
import type { EmployeeDetail } from "../types";

const STATUS_OPTIONS: EmployeeStatus[] = [
  "draft",
  "active",
  "paused",
  "archived",
];

export function EmployeeDetailActions({ employee }: { employee: EmployeeDetail }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(employee.name);
  const [role, setRole] = useState(employee.role);
  const [description, setDescription] = useState(employee.description ?? "");
  const [status, setStatus] = useState<EmployeeStatus>(employee.status);
  const [systemPrompt, setSystemPrompt] = useState(employee.systemPrompt);

  function resetForm(): void {
    setName(employee.name);
    setRole(employee.role);
    setDescription(employee.description ?? "");
    setStatus(employee.status);
    setSystemPrompt(employee.systemPrompt);
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
          Edit
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
          Delete
        </Button>
      </div>

      <Sheet open={editOpen} onOpenChange={handleEditOpenChange}>
        <SheetContent
          side="right"
          className="w-full border-white/10 bg-[#0a0a0a] text-white sm:max-w-md"
        >
          <SheetHeader>
            <SheetTitle>Edit employee</SheetTitle>
            <SheetDescription className="text-white/50">
              Changes are saved to your organization workspace immediately.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4">
            <div className="space-y-2">
              <Label htmlFor="employee-name">Name</Label>
              <Input
                id="employee-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="border-white/12 bg-[#111111] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-role">Role</Label>
              <Input
                id="employee-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="border-white/12 bg-[#111111] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-description">Description</Label>
              <Textarea
                id="employee-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="border-white/12 bg-[#111111] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
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
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-system-prompt">System prompt</Label>
              <Textarea
                id="employee-system-prompt"
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                rows={6}
                className="border-white/12 bg-[#111111] text-white"
              />
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
              Cancel
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
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-white/10 bg-[#111111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {employee.name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/55">
              This permanently removes the employee, runtime config, knowledge
              sources, and lifecycle history from your workspace. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorMessage ? (
            <p className="text-sm text-white/65" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/12 bg-transparent text-white hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-white text-black hover:bg-white/90"
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
            >
              {isPending ? "Deleting…" : "Delete employee"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
