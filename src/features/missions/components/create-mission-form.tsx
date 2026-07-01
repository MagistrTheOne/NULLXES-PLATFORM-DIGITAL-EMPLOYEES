"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { createMissionAction } from "../actions/create-mission";
import { updateMissionAction } from "../actions/manage-mission";
import { formatMissionSkills } from "../lib/parse-mission-skills";
import {
  defaultProspectingBrief,
  defaultProspectingGoal,
  defaultProspectingTitle,
} from "../lib/prospecting-defaults";
import type { MissionDetail } from "../queries/get-mission-detail";

type EmployeeOption = {
  id: string;
  name: string;
  role: string;
};

type MissionFormValues = {
  employeeId: string;
  type: "prospecting" | "custom";
  title: string;
  goal: string;
  skills: string;
  brief: string;
};

function MissionFields({
  employees,
  values,
  onChange,
  idPrefix = "mission",
}: {
  employees: EmployeeOption[];
  values: MissionFormValues;
  onChange: (patch: Partial<MissionFormValues>) => void;
  idPrefix?: string;
}) {
  const selectedEmployee = employees.find(
    (employee) => employee.id === values.employeeId,
  );

  function handleTypeChange(nextType: "prospecting" | "custom") {
    if (nextType === "prospecting" && selectedEmployee) {
      onChange({
        type: nextType,
        title: defaultProspectingTitle(selectedEmployee.name),
        goal: defaultProspectingGoal(),
        brief: defaultProspectingBrief(),
      });
      return;
    }

    onChange({ type: nextType });
  }

  function handleEmployeeChange(nextEmployeeId: string) {
    const employee = employees.find((item) => item.id === nextEmployeeId);
    if (values.type === "prospecting" && employee) {
      onChange({
        employeeId: nextEmployeeId,
        title: defaultProspectingTitle(employee.name),
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
          onValueChange={(value) =>
            handleTypeChange(value as "prospecting" | "custom")
          }
        >
          <SelectTrigger
            id={`${idPrefix}-type`}
            className="border-white/10 bg-black/40 text-white"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prospecting">Prospecting</SelectItem>
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
              ? defaultProspectingTitle(selectedEmployee.name)
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
        <Label htmlFor={`${idPrefix}-skills`}>Skills</Label>
        <Input
          id={`${idPrefix}-skills`}
          value={values.skills}
          onChange={(event) => onChange({ skills: event.target.value })}
          className="border-white/10 bg-black/40 text-white"
          placeholder="B2B research, outbound drafting, qualification (comma-separated)"
        />
        <p className="text-xs text-white/40">
          Comma or line separated. These guide how the employee executes the
          brief.
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

export function CreateMissionForm({
  employees,
}: {
  employees: EmployeeOption[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<MissionFormValues>(() => ({
    employeeId: employees[0]?.id ?? "",
    type: "prospecting",
    title: employees[0]
      ? defaultProspectingTitle(employees[0].name)
      : "",
    goal: defaultProspectingGoal(),
    skills: "",
    brief: defaultProspectingBrief(),
  }));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await createMissionAction(values);

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
}: {
  mission: MissionDetail;
  employees: EmployeeOption[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<MissionFormValues>({
    employeeId: mission.employeeId,
    type: mission.type,
    title: mission.title,
    goal: mission.goal ?? "",
    skills: formatMissionSkills(mission.skills),
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
          disabled={isSubmitting || !values.brief.trim() || !values.title.trim()}
          className="bg-white text-black hover:bg-white/90"
        >
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
