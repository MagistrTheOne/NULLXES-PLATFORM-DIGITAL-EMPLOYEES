"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { composeMissionAction } from "../actions/compose-mission";
import { createMissionAction } from "../actions/create-mission";
import type { ComposedMissionDraft } from "../services/compose-mission-from-intent";
import type { MissionType } from "../lib/mission-type";
import {
  CreateMissionForm,
  type MissionSkillOption,
} from "./create-mission-form";

type EmployeeOption = {
  id: string;
  name: string;
  role: string;
};

type Step = "intent" | "preview" | "advanced";

const STARTER_KEYS = [
  "chipRuClients",
  "chipEnClients",
  "chipInvestors",
  "chipCustom",
] as const;

function typeLabel(
  type: MissionType,
  t: ReturnType<typeof useTranslations<"missions.wizard">>,
): string {
  switch (type) {
    case "prospecting":
      return t("typeRu");
    case "prospecting_en":
      return t("typeEn");
    case "investor_base":
      return t("typeInvestors");
    default:
      return t("typeCustom");
  }
}

export function CreateMissionWizard({
  employees,
  skillLibrary,
}: {
  employees: EmployeeOption[];
  skillLibrary: MissionSkillOption[];
}) {
  const t = useTranslations("missions.wizard");
  const router = useRouter();
  const [step, setStep] = useState<Step>("intent");
  const [intent, setIntent] = useState("");
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [draft, setDraft] = useState<ComposedMissionDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const starters = useMemo(
    () =>
      STARTER_KEYS.map((key) => ({
        key,
        label: t(key),
        fill: t(`${key}Fill`),
      })),
    [t],
  );

  const skillNames = useMemo(() => {
    if (!draft) return "";
    return draft.skillIds
      .map((id) => skillLibrary.find((skill) => skill.id === id)?.name)
      .filter((name): name is string => Boolean(name))
      .join(" · ");
  }, [draft, skillLibrary]);

  function handleCompose() {
    setError(null);
    startTransition(async () => {
      const result = await composeMissionAction({
        intent,
        preferredEmployeeId: employeeId || undefined,
        employees,
        skillLibrary: skillLibrary.map((skill) => ({
          id: skill.id,
          name: skill.name,
          slug: skill.slug,
        })),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDraft(result.draft);
      setEmployeeId(result.draft.employeeId);
      setStep("preview");
    });
  }

  function handleLaunch() {
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const result = await createMissionAction({
        employeeId: draft.employeeId,
        type: draft.type,
        title: draft.title,
        goal: draft.goal,
        brief: draft.brief,
        skillIds: draft.skillIds,
        skills: skillNames,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(`/dashboard/missions/${result.missionId}`);
      router.refresh();
    });
  }

  if (step === "advanced") {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          className="px-0 text-white/60 hover:bg-transparent hover:text-white"
          onClick={() => setStep(draft ? "preview" : "intent")}
        >
          {t("backToSimple")}
        </Button>
        <CreateMissionForm
          employees={employees}
          skillLibrary={skillLibrary}
          initialValues={
            draft
              ? {
                  employeeId: draft.employeeId,
                  type: draft.type,
                  title: draft.title,
                  goal: draft.goal,
                  brief: draft.brief,
                  skillIds: draft.skillIds,
                }
              : { employeeId }
          }
          submitLabel={t("launch")}
          submittingLabel={t("launching")}
        />
      </div>
    );
  }

  if (step === "preview" && draft) {
    return (
      <div className="space-y-5 rounded-2xl border border-white/8 bg-[#111111] p-6 text-white">
        <div>
          <h2 className="text-lg font-medium">{t("previewTitle")}</h2>
          <p className="mt-1 text-sm text-white/50">{t("previewHint")}</p>
        </div>

        <ul className="space-y-1.5 text-sm text-white/65">
          {draft.summaryBullets.map((bullet) => (
            <li key={bullet}>· {bullet}</li>
          ))}
        </ul>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="mission-preview-title">{t("fieldTitle")}</Label>
            <Input
              id="mission-preview-title"
              value={draft.title}
              onChange={(event) =>
                setDraft({ ...draft, title: event.target.value })
              }
              className="border-white/10 bg-black/40 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mission-preview-goal">{t("fieldGoal")}</Label>
            <Input
              id="mission-preview-goal"
              value={draft.goal}
              onChange={(event) =>
                setDraft({ ...draft, goal: event.target.value })
              }
              className="border-white/10 bg-black/40 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mission-preview-brief">{t("fieldBrief")}</Label>
            <Textarea
              id="mission-preview-brief"
              value={draft.brief}
              onChange={(event) =>
                setDraft({ ...draft, brief: event.target.value })
              }
              rows={7}
              className="border-white/10 bg-black/40 text-white"
            />
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/55">
            <p>
              {t("fieldEmployee")}:{" "}
              <span className="text-white/85">
                {employees.find((e) => e.id === draft.employeeId)?.name ?? "—"}
              </span>
            </p>
            <p className="mt-1">
              {t("fieldType")}:{" "}
              <span className="text-white/85">{typeLabel(draft.type, t)}</span>
            </p>
            {skillNames ? (
              <p className="mt-1">
                {t("fieldSkills")}:{" "}
                <span className="text-white/85">{skillNames}</span>
              </p>
            ) : null}
            <p className="mt-2 text-xs text-white/40">{t("approvalNote")}</p>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-white/80" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={pending || !draft.brief.trim()}
            onClick={handleLaunch}
            className="bg-white text-black hover:bg-white/90"
          >
            {pending ? t("launching") : t("launch")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setStep("intent")}
            className="border-white/15 bg-transparent text-white hover:bg-white/5"
          >
            {t("change")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => setStep("advanced")}
            className="text-white/55 hover:bg-white/5 hover:text-white"
          >
            {t("advanced")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border border-white/8 bg-[#111111] p-6 text-white">
      <div>
        <h2 className="text-lg font-medium">{t("intentTitle")}</h2>
        <p className="mt-1 text-sm text-white/50">{t("intentHint")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {starters.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => setIntent(chip.fill)}
            className={cn(
              "rounded-full border border-white/12 px-3 py-1.5 text-sm text-white/70 transition-colors",
              "hover:border-white/25 hover:bg-white/5 hover:text-white",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="mission-intent">{t("intentLabel")}</Label>
        <Textarea
          id="mission-intent"
          value={intent}
          onChange={(event) => setIntent(event.target.value)}
          rows={6}
          placeholder={t("intentPlaceholder")}
          className="border-white/10 bg-black/40 text-white placeholder:text-white/30"
        />
      </div>

      {employees.length > 1 ? (
        <div className="space-y-2">
          <Label>{t("employeeLabel")}</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="border-white/10 bg-black/40 text-white">
              <SelectValue />
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
      ) : null}

      {error ? (
        <p className="text-sm text-white/80" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending || !intent.trim() || !employeeId}
          onClick={handleCompose}
          className="bg-white text-black hover:bg-white/90"
        >
          {pending ? t("composing") : t("compose")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => setStep("advanced")}
          className="text-white/55 hover:bg-white/5 hover:text-white"
        >
          {t("advanced")}
        </Button>
      </div>
    </div>
  );
}
