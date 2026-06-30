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
import {
  defaultProspectingBrief,
  defaultProspectingTitle,
} from "../lib/prospecting-defaults";

type EmployeeOption = {
  id: string;
  name: string;
  role: string;
};

export function CreateMissionForm({
  employees,
}: {
  employees: EmployeeOption[];
}) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [type, setType] = useState<"prospecting" | "custom">("prospecting");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState(defaultProspectingBrief());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedEmployee = employees.find((employee) => employee.id === employeeId);

  function handleTypeChange(nextType: "prospecting" | "custom") {
    setType(nextType);
    if (nextType === "prospecting" && selectedEmployee) {
      setTitle(defaultProspectingTitle(selectedEmployee.name));
      setBrief(defaultProspectingBrief());
    }
  }

  function handleEmployeeChange(nextEmployeeId: string) {
    setEmployeeId(nextEmployeeId);
    const employee = employees.find((item) => item.id === nextEmployeeId);
    if (type === "prospecting" && employee) {
      setTitle(defaultProspectingTitle(employee.name));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await createMissionAction({
      employeeId,
      type,
      title,
      brief,
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
        <div className="grid gap-2">
          <Label htmlFor="mission-employee">Digital employee</Label>
          <Select value={employeeId} onValueChange={handleEmployeeChange}>
            <SelectTrigger
              id="mission-employee"
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
          <Label htmlFor="mission-type">Mission type</Label>
          <Select
            value={type}
            onValueChange={(value) =>
              handleTypeChange(value as "prospecting" | "custom")
            }
          >
            <SelectTrigger
              id="mission-type"
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
          <Label htmlFor="mission-title">Title</Label>
          <Input
            id="mission-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="border-white/10 bg-black/40 text-white"
            placeholder={
              selectedEmployee
                ? defaultProspectingTitle(selectedEmployee.name)
                : "Mission title"
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="mission-brief">Brief</Label>
          <Textarea
            id="mission-brief"
            value={brief}
            onChange={(event) => setBrief(event.target.value)}
            rows={6}
            className="border-white/10 bg-black/40 text-white"
          />
        </div>

        {error ? (
          <p className="text-sm text-white/80" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting || !employeeId || !brief.trim()}
          className="bg-white text-black hover:bg-white/90"
        >
          {isSubmitting ? "Assigning..." : "Assign mission"}
        </Button>
      </div>
    </form>
  );
}
