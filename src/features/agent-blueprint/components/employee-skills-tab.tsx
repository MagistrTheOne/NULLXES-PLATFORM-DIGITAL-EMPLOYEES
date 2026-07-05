"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-6 rounded-xl border border-white/10 bg-[#111111] p-5 text-white">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white/80">{t("assigned")}</h3>
        {assignments.length === 0 ? (
          <p className="text-sm text-white/50">{t("empty")}</p>
        ) : (
          <ul className="space-y-3">
            {assignments.map((assignment) => (
              <li
                key={assignment.skillId}
                className="flex flex-col gap-2 rounded-lg border border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{assignment.skillName}</p>
                  <p className="text-sm text-white/50">{assignment.skillSlug}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline">{assignment.proficiency}</Badge>
                    <Badge variant="secondary">#{assignment.priority}</Badge>
                    {!assignment.isActive ? (
                      <Badge variant="destructive">{t("inactive")}</Badge>
                    ) : null}
                  </div>
                </div>
                {canManage ? (
                  <div className="flex gap-2">
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
              </li>
            ))}
          </ul>
        )}
      </div>

      {canManage && available.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/80">{t("library")}</h3>
          <ul className="space-y-2">
            {available.map((skill) => (
              <li
                key={skill.id}
                className="flex items-center justify-between rounded-lg border border-white/10 p-3"
              >
                <div>
                  <p className="font-medium">{skill.name}</p>
                  <p className="text-sm text-white/50">{skill.slug}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
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
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
