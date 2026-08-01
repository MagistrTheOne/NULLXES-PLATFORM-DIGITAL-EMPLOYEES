import { redirect } from "next/navigation";

export default function CapsulesPage() {
  redirect("/dashboard/collection?tab=capsules");
}
