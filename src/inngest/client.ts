import { Inngest } from "inngest";
import { getInngestEventKey, isInngestDevMode } from "@/shared/config/env";

const eventKey = isInngestDevMode() ? undefined : getInngestEventKey();

export const inngest = new Inngest({
  id: "nullxes-digital-employees",
  name: "NULLXES Digital Employees",
  ...(eventKey ? { eventKey } : {}),
});

export function isInngestEnabledForSend(): boolean {
  return isInngestDevMode() || Boolean(getInngestEventKey());
}
