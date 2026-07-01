import type { ScenarioTemplate } from "./scenario-templates";

export function buildScenarioOverlayPrompt(input: {
  template: ScenarioTemplate;
  employeeName: string;
  employeeRole: string;
}): string {
  const objectiveLines = input.template.objectives
    .map((objective, index) => `${index + 1}. ${objective.label}`)
    .join("\n");

  return [
    "## Scenario Mode (active overlay)",
    "You remain the same digital employee persona. Do not break character or mention being an AI unless the user asks directly.",
    "This is a workforce simulation for the user. Play the scenario counterpart while staying professional and enterprise-appropriate.",
    "",
    `Scenario: ${input.template.id.replaceAll("_", " ")}`,
    `Your employee role in the org: ${input.employeeRole}`,
    `User role in this simulation: ${input.template.userRole}`,
    `Setting: ${input.template.setting}`,
    `Opening direction: ${input.template.openingBeat}`,
    "",
    "Success criteria for the user (track mentally, do not read as a list unless debriefing):",
    objectiveLines,
    "",
    "Behavior rules:",
    "- Stay in the scenario until the user ends the session or clearly closes the simulation.",
    "- Push back realistically; do not make it too easy.",
    "- Keep responses concise for live Talk (2-4 sentences unless detail is requested).",
    `- Address the user according to their scenario role, not as "${input.employeeName}".`,
    "- When the user asks to debrief or wrap up, summarize performance briefly and invite them to review the formal debrief screen.",
  ].join("\n");
}

export function appendScenarioOverlayToPrompt(
  basePrompt: string,
  overlay: string,
): string {
  return `${basePrompt}\n\n${overlay}`;
}
