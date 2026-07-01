"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteMissionAction } from "../actions/manage-mission";

export function MissionDetailActions({
  missionId,
  canEdit,
}: {
  missionId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!canEdit) {
    return null;
  }

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);

    const result = await deleteMissionAction({ missionId });
    setIsDeleting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.push("/dashboard/missions");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        asChild
        variant="outline"
        className="border-white/10 bg-transparent text-white hover:bg-white/5"
      >
        <Link href={`/dashboard/missions/${missionId}/edit`}>
          <Pencil className="size-4" />
          Edit mission
        </Link>
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="border-white/10 bg-transparent text-white/70 hover:bg-white/5 hover:text-white"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="border-white/8 bg-[#111111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete mission?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This permanently removes the mission brief, timeline, and drafts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? (
            <p className="text-sm text-white/70" role="alert">
              {error}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/12 bg-transparent text-white/70 hover:bg-white/4 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-white text-black hover:bg-white/90"
              disabled={isDeleting}
              onClick={() => {
                void handleDelete();
              }}
            >
              {isDeleting ? "Deleting..." : "Delete mission"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
