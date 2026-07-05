"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createMissionAction } from "../actions/create-mission";
import { updateMissionAction } from "../actions/manage-mission";
import { formatMissionSkills } from "../lib/parse-mission-skills";
import {
  defaultMissionBrief,
  defaultMissionGoal,
  defaultMissionTitle,
} from "../lib/prospecting-defaults";
import type { MissionType } from "../lib/mission-type";
import { isQualifiedMissionType } from "../lib/mission-type";
import {
  qualificationProfileForMissionType,
  skillSlugForProfile,
} from "../lib/resolve-mission-qualification-profile";
import type { MissionDetail } from "../queries/get-mission-detail";

type EmployeeOption = {
  id: string;
  name: string;
  role: string;
};

export type MissionSkillOption = {
  id: string;
  name: string;
  category: string;
  slug: string;
};

type MissionFormValues = {
  employeeId: string;
  type: MissionType;
  title: string;
  goal: string;
  skillIds: string[];
  brief: string;
};

function defaultSkillIdsForType(
  type: MissionType,
  library: MissionSkillOption[],
): string[] {
  const profile = qualificationProfileForMissionType(type);
  if (profile === "generic") {
    return [];
  }

  const slug = skillSlugForProfile(profile);
  const skill = library.find((item) => item.slug === slug);
  return skill ? [skill.id] : [];
}

function qualifiedDefaults(
  employeeName: string,
  type: MissionType,
  library: MissionSkillOption[],
): Pick<MissionFormValues, "title" | "goal" | "brief" | "skillIds"> {
  return {
    title: defaultMissionTitle(employeeName, type),
    goal: defaultMissionGoal(type),
    brief: defaultMissionBrief(type),
    skillIds: defaultSkillIdsForType(type, library),
  };
}

function skillLabels(
  skillIds: string[],
  library: MissionSkillOption[],
): string {
  const names = skillIds
    .map((id) => library.find((skill) => skill.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  return formatMissionSkills(names);
}

function MissionSkillPicker({
  idPrefix,
  library,
  selectedIds,
  onChange,
}: {
  idPrefix: string;
  library: MissionSkillOption[];
  selectedIds: string[];
  onChange: (skillIds: string[]) => void;
}) {
  const selected = new Set(selectedIds);

  function toggleSkill(skillId: string, checked: boolean) {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(skillId);
    } else {
      next.delete(skillId);
    }
    onChange([...next]);
  }

  if (library.length === 0) {
    return (
      <p className="text-xs text-white/40">
        No skills in the library yet. Add skills in Settings → Skills.
      </p>
    );
  }

  return (
    <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-white/10 p-3">
      {library.map((skill) => {
        const checkboxId = `${idPrefix}-skill-${skill.id}`;
        return (
          <label
            key={skill.id}
            htmlFor={checkboxId}
            className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-white/5"
          >
            <Checkbox
              id={checkboxId}
              checked={selected.has(skill.id)}
              onCheckedChange={(value) => toggleSkill(skill.id, value === true)}
              className="mt-0.5 border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-white">{skill.name}</span>
              <span className="block text-xs text-white/45">
                {skill.category} · {skill.slug}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

function MissionFields({
  employees,
  skillLibrary,
  values,
  onChange,
  idPrefix = "mission",
}: {
  employees: EmployeeOption[];
  skillLibrary: MissionSkillOption[];
  values: MissionFormValues;
  onChange: (patch: Partial<MissionFormValues>) => void;
  idPrefix?: string;
}) {
  const selectedEmployee = employees.find(
    (employee) => employee.id === values.employeeId,
  );

  function handleTypeChange(nextType: MissionType) {
    if (isQualifiedMissionType(nextType) && selectedEmployee) {
      onChange({
        type: nextType,
        ...qualifiedDefaults(selectedEmployee.name, nextType, skillLibrary),
      });
      return;
    }

    onChange({ type: nextType, skillIds: [] });
  }

  function handleEmployeeChange(nextEmployeeId: string) {
    const employee = employees.find((item) => item.id === nextEmployeeId);
    if (isQualifiedMissionType(values.type) && employee) {
      onChange({
        employeeId: nextEmployeeId,
        title: defaultMissionTitle(employee.name, values.type),
      });
      return;
    }

    onChange({ employeeId: nextEmployeeId });
  }

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-employee`}>Digital employee</Label>
        <Select value={values.employeeId} onValueChange={handleEmployeeChange}>
          <SelectTrigger
            id={`${idPrefix}-employee`}
            className="border-white/10 bg-black/40 text-white"
          >
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.name} · {employee.role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-type`}>Mission type</Label>
        <Select
          value={values.type}
          onValueChange={(value) => handleTypeChange(value as MissionType)}
        >
          <SelectTrigger
            id={`${idPrefix}-type`}
            className="border-white/10 bg-black/40 text-white"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prospecting">Prospecting RU</SelectItem>
            <SelectItem value="prospecting_en">Prospecting EN</SelectItem>
            <SelectItem value="investor_base">Investor base</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-title`}>Title</Label>
        <Input
          id={`${idPrefix}-title`}
          value={values.title}
          onChange={(event) => onChange({ title: event.target.value })}
          className="border-white/10 bg-black/40 text-white"
          placeholder={
            selectedEmployee
              ? defaultMissionTitle(selectedEmployee.name, values.type)
              : "Mission title"
          }
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-goal`}>Goal</Label>
        <Input
          id={`${idPrefix}-goal`}
          value={values.goal}
          onChange={(event) => onChange({ goal: event.target.value })}
          className="border-white/10 bg-black/40 text-white"
          placeholder="What outcome should this mission achieve?"
        />
      </div>

      <div className="grid gap-2">
        <Label>Skills</Label>
        <MissionSkillPicker
          idPrefix={idPrefix}
          library={skillLibrary}
          selectedIds={values.skillIds}
          onChange={(skillIds) => onChange({ skillIds })}
        />
        <p className="text-xs text-white/40">
          Selected skills inject procedure blocks into mission execution.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-brief`}>Brief</Label>
        <Textarea
          id={`${idPrefix}-brief`}
          value={values.brief}
          onChange={(event) => onChange({ brief: event.target.value })}
          rows={6}
          className="border-white/10 bg-black/40 text-white"
        />
      </div>
    </>
  );
}

function CreateMissionFormInitialValues(
  employees: EmployeeOption[],
  skillLibrary: MissionSkillOption[],
): MissionFormValues {
  const type: MissionType = "prospecting";
  const employee = employees[0];
  return {
    employeeId: employee?.id ?? "",
    type,
    title: employee ? defaultMissionTitle(employee.name, type) : "",
    goal: defaultMissionGoal(type),
    skillIds: defaultSkillIdsForType(type, skillLibrary),
    brief: defaultMissionBrief(type),
  };
}

export function CreateMissionForm({
  employees,
  skillLibrary,
}: {
  employees: EmployeeOption[];
  skillLibrary: MissionSkillOption[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<MissionFormValues>(() =>
    CreateMissionFormInitialValues(employees, skillLibrary),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await createMissionAction({
      ...values,
      skills: skillLabels(values.skillIds, skillLibrary),
      skillIds: values.skillIds,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.push(`/dashboard/missions/${result.missionId}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/8 bg-[#111111] p-6"
    >
      <div className="grid gap-5">
        <MissionFields
          employees={employees}
          skillLibrary={skillLibrary}
          values={values}
          onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
        />

        {error ? (
          <p className="text-sm text-white/80" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting || !values.employeeId || !values.brief.trim()}
          className="bg-white text-black hover:bg-white/90"
        >
          {isSubmitting ? "Assigning..." : "Assign mission"}
        </Button>
      </div>
    </form>
  );
}

export function EditMissionForm({
  mission,
  employees,
  skillLibrary,
}: {
  mission: MissionDetail;
  employees: EmployeeOption[];
  skillLibrary: MissionSkillOption[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<MissionFormValues>({
    employeeId: mission.employeeId,
    type: mission.type,
    title: mission.title,
    goal: mission.goal ?? "",
    skillIds: mission.skillIds,
    brief: mission.brief,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await updateMissionAction({
      missionId: mission.id,
      ...values,
      skills: skillLabels(values.skillIds, skillLibrary),
      skillIds: values.skillIds,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.push(`/dashboard/missions/${mission.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/8 bg-[#111111] p-6"
    >
      <div className="grid gap-5">
        <MissionFields
          idPrefix="edit-mission"
          employees={employees}
          skillLibrary={skillLibrary}
          values={values}
          onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
        />

        {mission.skillIds.length === 0 && mission.skills.length > 0 ? (
          <p className="text-xs text-white/45">
            Legacy skill labels on this mission: {mission.skills.join(", ")}
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-white/80" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting || !values.brief.trim() || !values.title.trim()}
          className="bg-white text-black hover:bg-white/90"
        >
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
