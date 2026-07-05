import { listOrganizationCharacterPresets } from "../queries/list-organization-character-presets";
import { listOrganizationSkills } from "../queries/list-organization-skills";
import { listOrganizationTools } from "../queries/list-organization-tools";
import { SettingsCharactersTab } from "./settings-characters-tab";
import { SettingsSkillsTab } from "./settings-skills-tab";
import { SettingsToolsTab } from "./settings-tools-tab";

export async function AgentBlueprintSettingsTabs({
  organizationId,
  canManage,
  tab,
}: {
  organizationId: string;
  canManage: boolean;
  tab: "characters" | "skills" | "tools";
}) {
  const [presets, skills, tools] = await Promise.all([
    listOrganizationCharacterPresets(organizationId),
    listOrganizationSkills(organizationId),
    listOrganizationTools(organizationId),
  ]);

  if (tab === "characters") {
    return <SettingsCharactersTab presets={presets} canManage={canManage} />;
  }
  if (tab === "skills") {
    return <SettingsSkillsTab skills={skills} canManage={canManage} />;
  }
  return <SettingsToolsTab tools={tools} />;
}
