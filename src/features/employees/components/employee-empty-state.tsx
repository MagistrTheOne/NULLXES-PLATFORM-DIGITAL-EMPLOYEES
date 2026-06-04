import { Button } from "@/components/ui/button";

export function EmployeeEmptyState({
  onCreateClick,
}: {
  onCreateClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <p className="text-sm text-white/60">No digital employees in this workspace.</p>
      <Button
        type="button"
        size="sm"
        onClick={onCreateClick}
        className="bg-white text-black hover:bg-white/90"
      >
        Create Employee
      </Button>
    </div>
  );
}
