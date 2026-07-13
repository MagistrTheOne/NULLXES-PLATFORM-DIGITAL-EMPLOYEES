import { redirect } from "next/navigation";
import { FOUNDING_PARTNERS_PATH } from "@/features/founding-partners/access";

/** Legacy Design Partners URL → Founding Partners. */
export default function DesignPartnersRedirectPage() {
  redirect(FOUNDING_PARTNERS_PATH);
}
