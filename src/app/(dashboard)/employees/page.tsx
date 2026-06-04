import { redirect } from "next/navigation";

export default function EmployeesRedirectPage() {
  redirect("/dashboard/employees");
}
