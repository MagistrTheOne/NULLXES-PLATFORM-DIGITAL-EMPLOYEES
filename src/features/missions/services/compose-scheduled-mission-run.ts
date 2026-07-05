import { desc, eq } from "drizzle-orm";
import {
  employeeMission,
  type MissionLeadItem,
} from "@/entities/employee-mission";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { missionSchedule } from "@/entities/mission-schedule/schema";
import type { missionSchedule as MissionScheduleTable } from "@/entities/mission-schedule/schema";
import {
  defaultMissionBrief,
  defaultMissionGoal,
  defaultMissionTitle,
} from "@/features/missions/lib/prospecting-defaults";
import type { MissionType } from "@/features/missions/lib/mission-type";
import { db } from "@/shared/db/client";

const ROTATION_TYPES: MissionType[] = [
  "prospecting",
  "prospecting_en",
  "investor_base",
];

const RU_SECTOR_FOCUS = [
  "финтех",
  "ритейл",
  "промышленность",
  "телеком",
  "логистика",
  "медиа",
] as const;

const EN_SECTOR_FOCUS = [
  "fintech",
  "enterprise SaaS",
  "manufacturing",
  "telecom",
  "logistics",
  "healthcare",
] as const;

const INVESTOR_FOCUS = [
  "seed-stage AI funds",
  "enterprise SaaS investors",
  "B2B workflow automation angels",
  "corporate venture arms",
] as const;

export const LEGACY_SCHEDULE_BRIEF_PATTERN =
  /Find 10 B2B companies that could benefit from NULLXES Digital Employees/i;

type PastMissionRow = {
  id: string;
  status: string;
  type: MissionType;
  errorMessage: string | null;
  leads: MissionLeadItem[];
  createdAt: Date;
};

export type ScheduledMissionRunPayload = {
  title: string;
  brief: string;
  goal: string;
  type: MissionType;
  runNumber: number;
  excludedTargets: string[];
};

function sectorFocusForType(type: MissionType, runNumber: number): string {
  switch (type) {
    case "prospecting_en": {
      const sector = EN_SECTOR_FOCUS[runNumber % EN_SECTOR_FOCUS.length];
      return `Sector focus today: ${sector}.`;
    }
    case "investor_base": {
      const focus = INVESTOR_FOCUS[runNumber % INVESTOR_FOCUS.length];
      return `Investor focus today: ${focus}.`;
    }
    case "prospecting":
    default: {
      const sector = RU_SECTOR_FOCUS[runNumber % RU_SECTOR_FOCUS.length];
      return `Фокус сектора сегодня: ${sector}.`;
    }
  }
}

function collectExcludedTargets(pastMissions: PastMissionRow[]): string[] {
  const seen = new Set<string>();

  for (const mission of pastMissions) {
    for (const lead of mission.leads ?? []) {
      const company = lead.companyName?.trim();
      if (company) {
        seen.add(company);
      }

      const domain = lead.domain?.trim().toLowerCase();
      if (domain) {
        seen.add(domain);
      }
    }
  }

  return [...seen].slice(0, 40);
}

function summarizePastRuns(pastMissions: PastMissionRow[]): string {
  const failed = pastMissions.filter((row) => row.status === "failed").length;
  const completed = pastMissions.filter((row) => row.status === "completed").length;
  const waiting = pastMissions.filter(
    (row) => row.status === "waiting_approval",
  ).length;
  const last = pastMissions[0];

  const lines = [
    `Previous scheduled runs: failed=${failed}, completed=${completed}, waiting_approval=${waiting}.`,
  ];

  if (last?.errorMessage) {
    lines.push(`Last run error: ${last.errorMessage}`);
  }

  if (last?.status === "completed" || last?.status === "waiting_approval") {
    lines.push(`Last run produced ${last.leads.length} lead(s).`);
  }

  return lines.join("\n");
}

function pickMissionTypeForRun(pastMissions: PastMissionRow[]): MissionType {
  const runNumber = pastMissions.length;
  const recentFailures = pastMissions
    .slice(0, 3)
    .filter((row) => row.status === "failed");

  if (recentFailures.length >= 3) {
    const failedType = recentFailures[0]?.type ?? "prospecting";
    const failedIndex = ROTATION_TYPES.indexOf(failedType);
    if (failedIndex >= 0) {
      return (
        ROTATION_TYPES[(failedIndex + 1) % ROTATION_TYPES.length] ??
        "prospecting"
      );
    }
  }

  return ROTATION_TYPES[runNumber % ROTATION_TYPES.length] ?? "prospecting";
}

function buildExclusionBlock(excludedTargets: string[]): string {
  if (excludedTargets.length === 0) {
    return "Exclusion list: none yet — prioritize net-new targets.";
  }

  return [
    "Exclusion list (do NOT re-research these companies/funds/domains):",
    excludedTargets.join(", "),
  ].join("\n");
}

export async function loadPastScheduledMissions(
  scheduleId: string,
): Promise<PastMissionRow[]> {
  const rows = await db
    .select({
      id: employeeMission.id,
      status: employeeMission.status,
      type: employeeMission.type,
      errorMessage: employeeMission.errorMessage,
      leads: employeeMission.leads,
      createdAt: employeeMission.createdAt,
    })
    .from(employeeMission)
    .where(eq(employeeMission.scheduleId, scheduleId))
    .orderBy(desc(employeeMission.createdAt))
    .limit(30);

  return rows.map((row) => ({
    ...row,
    leads: row.leads ?? [],
  }));
}

export async function composeScheduledMissionRun(input: {
  schedule: typeof MissionScheduleTable.$inferSelect;
  employeeName: string;
}): Promise<ScheduledMissionRunPayload> {
  const pastMissions = await loadPastScheduledMissions(input.schedule.id);
  const runNumber = pastMissions.length;
  const type = pickMissionTypeForRun(pastMissions);
  const excludedTargets = collectExcludedTargets(pastMissions);

  const brief = [
    defaultMissionBrief(type),
    sectorFocusForType(type, runNumber),
    "",
    summarizePastRuns(pastMissions),
    "",
    buildExclusionBlock(excludedTargets),
    "",
    `Scheduled run #${runNumber + 1}. Target fresh companies/funds not in the exclusion list.`,
  ].join("\n");

  return {
    title: `${defaultMissionTitle(input.employeeName, type)} #${runNumber + 1}`,
    brief,
    goal: defaultMissionGoal(type),
    type,
    runNumber,
    excludedTargets,
  };
}

export async function syncLegacyScheduleIfNeeded(
  schedule: typeof MissionScheduleTable.$inferSelect,
  employeeName: string,
): Promise<void> {
  if (!LEGACY_SCHEDULE_BRIEF_PATTERN.test(schedule.brief)) {
    return;
  }

  await db
    .update(missionSchedule)
    .set({
      title: defaultMissionTitle(employeeName, "prospecting"),
      brief: defaultMissionBrief("prospecting"),
      type: "prospecting",
    })
    .where(eq(missionSchedule.id, schedule.id));
}

export async function getEmployeeName(employeeId: string): Promise<string> {
  const [employee] = await db
    .select({ name: digitalEmployee.name })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  return employee?.name ?? "Digital employee";
}
