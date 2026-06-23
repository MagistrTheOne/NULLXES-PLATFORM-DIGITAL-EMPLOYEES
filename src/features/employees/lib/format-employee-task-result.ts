export type EmployeeTaskArtifact = {
  type: string;
  label: string;
  content: string;
};

export type EmployeeTaskResultPayload = {
  v: 1;
  summary: string;
  artifacts?: EmployeeTaskArtifact[];
};

export function serializeEmployeeTaskResult(
  payload: Omit<EmployeeTaskResultPayload, "v">,
): string {
  return JSON.stringify({
    v: 1 as const,
    summary: payload.summary,
    artifacts: payload.artifacts ?? [],
  });
}

export function parseEmployeeTaskResult(
  raw: string | null,
): EmployeeTaskResultPayload | null {
  if (!raw?.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<EmployeeTaskResultPayload>;
    if (typeof parsed.summary === "string" && parsed.v === 1) {
      return {
        v: 1,
        summary: parsed.summary,
        artifacts: Array.isArray(parsed.artifacts) ? parsed.artifacts : [],
      };
    }
  } catch {
    // Fall back to plain text legacy results.
  }

  return {
    v: 1,
    summary: raw,
    artifacts: [],
  };
}
