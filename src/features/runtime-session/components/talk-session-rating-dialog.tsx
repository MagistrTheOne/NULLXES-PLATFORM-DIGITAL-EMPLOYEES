"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function TalkSessionRatingDialog({
  open,
  employeeName,
  isSubmitting,
  onSubmit,
  onSkip,
}: {
  open: boolean;
  employeeName: string;
  isSubmitting: boolean;
  onSubmit: (rating: number) => void;
  onSkip: () => void;
}) {
  const t = useTranslations("employees.talk.rating");
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedRating(null);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSubmitting) {
          onSkip();
        }
      }}
    >
      <DialogContent
        className="max-w-md border-white/10 bg-[#111111] text-white"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">{t("title")}</DialogTitle>
          <DialogDescription className="text-white/60">
            {t("description", { name: employeeName })}
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex items-center justify-center gap-2 py-2"
          role="radiogroup"
          aria-label={t("starsLabel")}
        >
          {[1, 2, 3, 4, 5].map((value) => {
            const active = selectedRating !== null && value <= selectedRating;

            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selectedRating === value}
                aria-label={t("star", { value })}
                disabled={isSubmitting}
                onClick={() => setSelectedRating(value)}
                className={cn(
                  "rounded-full p-2 transition-colors",
                  "hover:bg-white/5 disabled:pointer-events-none disabled:opacity-40",
                )}
              >
                <Star
                  className={cn(
                    "size-8 stroke-[1.5]",
                    active
                      ? "fill-white text-white"
                      : "fill-transparent text-white/35",
                  )}
                />
              </button>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-white/60 hover:bg-white/5 hover:text-white"
            disabled={isSubmitting}
            onClick={onSkip}
          >
            {t("skip")}
          </Button>
          <Button
            type="button"
            className="bg-white text-black hover:bg-white/90"
            disabled={selectedRating === null || isSubmitting}
            onClick={() => {
              if (selectedRating !== null) {
                onSubmit(selectedRating);
              }
            }}
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
