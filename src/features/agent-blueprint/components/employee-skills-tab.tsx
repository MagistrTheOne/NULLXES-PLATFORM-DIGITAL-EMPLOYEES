"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InferSelectModel } from "drizzle-orm";
import { skill } from "@/entities/skill/schema";
import {
  assignEmployeeSkillsAction,
  removeEmployeeSkillAction,
  updateEmployeeSkillMetaAction,
} from "../actions/manage-blueprint";

type Assignment = {
  skillId: string;
  skillName: string;
  skillSlug: string;
  proficiency: "basic" | "standard" | "expert";
  priority: number;
  isActive: boolean;
};

type SkillRow = InferSelectModel<typeof skill>;

type Props = {
  employeeId: string;
  library: SkillRow[];
  assignments: Assignment[];
  canManage: boolean;
};

const PROFICIENCY_CLASS: Record<Assignment["proficiency"], string> = {
  basic: "border-white/15 bg-white/4 text-white/65",
  standard: "border-sky-500/25 bg-sky-500/10 text-sky-100",
  expert: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
};

export function EmployeeSkillsTab({
  employeeId,
  library,
  assignments,
  canManage,
}: Props) {
  const t = useTranslations("agentBlueprint.employeeSkills");
  const [pending, startTransition] = useTransition();
  const assignedIds = new Set(assignments.map((item) => item.skillId));
  const available = library.filter((skill) => !assignedIds.has(skill.id));

  return (
    <div className="space-y-6 text-white">
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-white/85">{t("assigned")}</h3>
          <p className="mt-1 text-sm text-white/45">{t("assignedHint")}</p>
        </div>
        {assignments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 bg-[#111111] px-5 py-8 text-center text-sm text-white/50">
            {t("empty")}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {assignments.map((assignment) => (
              <article
                key={assignment.skillId}
                className={cn(
                  "flex flex-col rounded-xl border border-white/10 bg-[#111111] p-4",
                  !assignment.isActive && "opacity-60",
                )}
              >
                <div className="min-h-0 flex-1">
                  <p className="font-medium">{assignment.skillName}</p>
                  <p className="mt-1 text-sm text-white/45">{assignment.skillSlug}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-md font-normal capitalize",
                        PROFICIENCY_CLASS[assignment.proficiency],
                      )}
                    >
                      {assignment.proficiency}
                    </Badge>
                    <Badge variant="outline" className="border-white/10 text-white/55">
                      {t("priority", { value: assignment.priority })}
                    </Badge>
                    {!assignment.isActive ? (
                      <Badge variant="destructive">{t("inactive")}</Badge>
                    ) : null}
                  </div>
                </div>
                {canManage ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await updateEmployeeSkillMetaAction({
                            employeeId,
                            skillId: assignment.skillId,
                            proficiency: assignment.proficiency,
                            priority: assignment.priority,
                            isActive: !assignment.isActive,
                          });
                        })
                      }
                    >
                      {assignment.isActive ? t("deactivate") : t("activate")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await removeEmployeeSkillAction({
                            employeeId,
                            skillId: assignment.skillId,
                          });
                        })
                      }
                    >
                      {t("remove")}
                    </Button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>

      {canManage && available.length > 0 ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-white/85">{t("library")}</h3>
            <p className="mt-1 text-sm text-white/45">{t("libraryHint")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {available.map((skill) => (
              <article
                key={skill.id}
                className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#111111] p-4"
              >
                <div>
                  <p className="font-medium">{skill.name}</p>
                  <p className="mt-1 text-sm text-white/45">{skill.slug}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="mt-4 w-full sm:w-auto"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await assignEmployeeSkillsAction({
                        employeeId,
                        skillIds: [
                          ...assignments.map((item) => item.skillId),
                          skill.id,
                        ],
                      });
                    })
                  }
                >
                  {t("assign")}
                </Button>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
