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
  if (tab === "characters") {
    const presets = await listOrganizationCharacterPresets(organizationId);
    return <SettingsCharactersTab presets={presets} canManage={canManage} />;
  }
  if (tab === "skills") {
    const skills = await listOrganizationSkills(organizationId);
    return <SettingsSkillsTab skills={skills} canManage={canManage} />;
  }
  const tools = await listOrganizationTools(organizationId);
  return <SettingsToolsTab tools={tools} />;
}
