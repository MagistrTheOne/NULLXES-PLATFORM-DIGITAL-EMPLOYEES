"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateMissionLeadProposalAction } from "../actions/manage-mission";

export function MissionProposalEditor({
  missionId,
  leadIndex,
  initialDraft,
  canEdit,
}: {
  missionId: string;
  leadIndex: number;
  initialDraft: string;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialDraft);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!canEdit) {
    return (
      <div className="mt-4 rounded-lg border border-white/6 bg-[#0a0a0a] p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
          Proposal draft
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/75">
          {initialDraft}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-white/6 bg-[#0a0a0a] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
          Proposal draft
        </p>
        {!editing ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-white/60 hover:text-white"
            onClick={() => {
              setDraft(initialDraft);
              setError(null);
              setEditing(true);
            }}
          >
            Edit
          </Button>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={10}
            className="min-h-[160px] border-white/10 bg-black/40 text-sm text-white"
          />
          <p className="text-[11px] text-white/40">
            Sign-off should be «С уважением, NULLXES» / «Best regards, NULLXES».
            Placeholders like [Ваше имя] are normalized on save.
          </p>
          {error ? <p className="text-xs text-white/70">{error}</p> : null}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const result = await updateMissionLeadProposalAction({
                    missionId,
                    leadIndex,
                    proposalDraft: draft,
                  });
                  if (!result.ok) {
                    setError(result.message);
                    return;
                  }
                  setEditing(false);
                  setError(null);
                });
              }}
            >
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isPending}
              className="text-white/60"
              onClick={() => {
                setDraft(initialDraft);
                setEditing(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/75">
          {initialDraft}
        </p>
      )}
    </div>
  );
}
