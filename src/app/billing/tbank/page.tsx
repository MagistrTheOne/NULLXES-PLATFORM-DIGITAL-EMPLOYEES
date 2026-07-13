import { redirect } from "next/navigation";

/**
 * Legacy auditor test cart removed — checkout is Settings → Billing (real plans).
 * Success/fail callbacks stay under /billing/tbank/{success,fail}.
 */
export default function TbankPayPage() {
  redirect("/settings?tab=billing");
}
