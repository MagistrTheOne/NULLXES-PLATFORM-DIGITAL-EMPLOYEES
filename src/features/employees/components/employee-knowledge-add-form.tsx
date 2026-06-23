"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addEmployeeKnowledgeTextAction,
  addEmployeeKnowledgeUrlAction,
} from "../actions/add-employee-knowledge";

export function EmployeeKnowledgeAddForm({
  employeeId,
  canManage,
}: {
  employeeId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("employees.knowledge.add");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!canManage) {
    return null;
  }

  function handleAddText(): void {
    setError(null);
    startTransition(async () => {
      const result = await addEmployeeKnowledgeTextAction({
        employeeId,
        content: text,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setText("");
      router.refresh();
    });
  }

  function handleAddUrl(): void {
    setError(null);
    startTransition(async () => {
      const result = await addEmployeeKnowledgeUrlAction({
        employeeId,
        url,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setUrl("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-sm font-medium text-white">{t("title")}</p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="knowledge-add-url" className="text-white/70">
          {t("urlLabel")}
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="knowledge-add-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder={t("urlPlaceholder")}
            className="border-white/10 bg-black/40 text-white"
            disabled={isPending}
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0 border-white/12 text-white"
            disabled={isPending || !url.trim()}
            onClick={handleAddUrl}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : t("addUrl")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="knowledge-add-text" className="text-white/70">
          {t("textLabel")}
        </Label>
        <Textarea
          id="knowledge-add-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("textPlaceholder")}
          rows={4}
          className="border-white/10 bg-black/40 text-white"
          disabled={isPending}
        />
        <Button
          type="button"
          className="self-start bg-white text-black hover:bg-white/90"
          disabled={isPending || !text.trim()}
          onClick={handleAddText}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("adding")}
            </>
          ) : (
            t("addText")
          )}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-white/60" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
