import { Inngest } from "inngest";
import {
  getInngestEventKey,
  getInngestSigningKey,
  isInngestDevMode,
} from "@/shared/config/env";

// Local: INNGEST_DEV=1 + `npm run inngest:dev` (no event key required).
// Production: set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY; do not set INNGEST_DEV.
const inDevMode = isInngestDevMode();
const eventKey = inDevMode ? undefined : getInngestEventKey();
const signingKey = inDevMode ? undefined : getInngestSigningKey();

export const inngest = new Inngest({
  id: "nullxes-digital-employees",
  name: "NULLXES Digital Employees",
  isDev: inDevMode,
  ...(eventKey ? { eventKey } : {}),
  ...(signingKey ? { signingKey } : {}),
});

export function isInngestEnabledForSend(): boolean {
  return isInngestDevMode() || Boolean(getInngestEventKey());
}
