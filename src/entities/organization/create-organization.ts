import { db } from "@/shared/db/client";
import { getDefaultDataRegion } from "@/shared/config/deployment-profile";
import {
  organization,
  type organizationStatusEnum,
  type organizationTypeEnum,
} from "./schema";

export type CreateOrganizationInput = {
  name: string;
  slug: string;
  type: (typeof organizationTypeEnum.enumValues)[number];
  status?: (typeof organizationStatusEnum.enumValues)[number];
};

export async function createOrganization(input: CreateOrganizationInput) {
  const [created] = await db
    .insert(organization)
    .values({
      name: input.name,
      slug: input.slug,
      type: input.type,
      status: input.status ?? "active",
      dataRegion: getDefaultDataRegion(),
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create organization");
  }

  return created;
}
