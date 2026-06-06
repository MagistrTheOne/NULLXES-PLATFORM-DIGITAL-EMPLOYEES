import { Inngest } from "inngest";
import { getInngestEventKey, isInngestDevMode } from "@/shared/config/env";

// Local: INNGEST_DEV=1 + `npm run inngest:dev` (no event key required).
// Production: set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY; do not set INNGEST_DEV.
const eventKey = isInngestDevMode() ? undefined : getInngestEventKey();

export const inngest = new Inngest({
  id: "nullxes-digital-employees",
  name: "NULLXES Digital Employees",
  ...(eventKey ? { eventKey } : {}),
});

export function isInngestEnabledForSend(): boolean {
  return isInngestDevMode() || Boolean(getInngestEventKey());
}
