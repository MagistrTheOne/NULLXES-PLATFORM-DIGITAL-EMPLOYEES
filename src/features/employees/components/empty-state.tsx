import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export function EmployeesEmptyState() {
  return (
    <Empty className="rounded-2xl border border-dashed border-white/10 bg-[#111111] p-12">
      <EmptyHeader>
        <EmptyTitle className="text-white">No digital employees</EmptyTitle>
        <EmptyDescription className="text-white/60">
          Deploy your first digital employee to begin operating your workforce.
        </EmptyDescription>
      </EmptyHeader>
      <Button
        type="button"
        className="bg-white text-black hover:bg-white/90"
      >
        Create First Digital Employee
      </Button>
    </Empty>
  );
}
