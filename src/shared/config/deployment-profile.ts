export type DeploymentRegion = "global" | "ru";

export function getDeploymentRegion(): DeploymentRegion {
  const value = process.env.DEPLOYMENT_REGION?.trim().toLowerCase();
  return value === "ru" ? "ru" : "global";
}

export function isRuDeployment(): boolean {
  return getDeploymentRegion() === "ru";
}

export function getDefaultDataRegion(): DeploymentRegion {
  return getDeploymentRegion();
}
