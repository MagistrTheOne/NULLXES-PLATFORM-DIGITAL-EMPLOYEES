import { Inngest } from "inngest";
import { getInngestEventKey } from "@/shared/config/env";

export const inngest = new Inngest({
  id: "nullxes-digital-employees",
  name: "NULLXES Digital Employees",
  eventKey: getInngestEventKey(),
});
