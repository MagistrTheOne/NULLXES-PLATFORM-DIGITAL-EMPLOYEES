"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { scheduleEmployeeTaskAction } from "../actions/schedule-employee-task";

export function EmployeeScheduleTaskForm({
  employeeId,
  canManage,
}: {
  employeeId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("employees.tasks.schedule");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!canManage) {
    return null;
  }

  function handleSubmit(): void {
    setError(null);
    startTransition(async () => {
      const result = await scheduleEmployeeTaskAction({
        employeeId,
        title,
        description,
        dueAt,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setTitle("");
      setDescription("");
      setDueAt("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-sm font-medium text-white">{t("title")}</p>

      <div className="space-y-2">
        <Label htmlFor="schedule-task-title">{t("taskTitle")}</Label>
        <Input
          id="schedule-task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="border-white/10 bg-black/40 text-white"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="schedule-task-description">{t("description")}</Label>
        <Textarea
          id="schedule-task-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className="border-white/10 bg-black/40 text-white"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="schedule-task-due">{t("dueAt")}</Label>
        <Input
          id="schedule-task-due"
          type="datetime-local"
          value={dueAt}
          onChange={(event) => setDueAt(event.target.value)}
          className="border-white/10 bg-black/40 text-white"
          disabled={isPending}
        />
      </div>

      <Button
        type="button"
        className="self-start bg-white text-black hover:bg-white/90"
        disabled={isPending || !title.trim() || !description.trim() || !dueAt}
        onClick={handleSubmit}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t("scheduling")}
          </>
        ) : (
          t("submit")
        )}
      </Button>

      {error ? (
        <p className="text-sm text-white/60" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
