import { HQ_DEPARTMENTS, type HqDepartment } from "../types";

export function isHqDepartment(value: string | null): value is HqDepartment {
  return value !== null && (HQ_DEPARTMENTS as readonly string[]).includes(value);
}

/**
 * Resolve an employee's department: prefer the explicitly assigned value
 * (set in the Design tab), fall back to the role heuristic.
 */
export function resolveEmployeeDepartment(
  stored: string | null,
  role: string,
): HqDepartment {
  if (isHqDepartment(stored)) {
    return stored;
  }
  return mapEmployeeDepartment(role);
}

const DEPARTMENT_PATTERNS: Array<{ department: HqDepartment; pattern: RegExp }> =
  [
    { department: "sales", pattern: /sales|account|revenue|growth|deal/i },
    {
      department: "support",
      pattern: /support|success|customer|help ?desk|service/i,
    },
    { department: "hr", pattern: /\bhr\b|recruit|people|talent|interview|hiring/i },
    {
      department: "analytics",
      pattern: /data|analyst|analytic|insight|report|finance|metric/i,
    },
    {
      department: "executive",
      pattern:
        /exec|chief|\bceo\b|\bcfo\b|\bcoo\b|director|head of|strateg|operation/i,
    },
    {
      department: "reception",
      pattern: /reception|front ?desk|greeter|concierge|intake|inbound/i,
    },
  ];

/**
 * Heuristic department assignment from an employee's role text.
 * Used as a fallback until a manual `department` is set in the Design tab.
 */
export function mapEmployeeDepartment(role: string): HqDepartment {
  for (const { department, pattern } of DEPARTMENT_PATTERNS) {
    if (pattern.test(role)) {
      return department;
    }
  }

  return "reception";
}
