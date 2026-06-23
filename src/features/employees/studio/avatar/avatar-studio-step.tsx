"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { generateEmployeeAvatarFromPrompt } from "@/features/employees/actions/generate-employee-avatar-from-prompt";
import { AvatarPreviewCard } from "./avatar-preview-card";
import { AvatarUpload } from "./avatar-upload";
import {
  base64ToImageFile,
  buildDefaultAvatarPrompt,
} from "./avatar-prompt-utils";

const PROMPT_SUGGESTIONS = [
  "businessFormal",
  "friendly",
  "studioPortrait",
] as const;

export function AvatarStudioStep({
  employeeName,
  employeeRole,
  photoFileName,
  localPreviewUrl,
  avatarPrompt,
  avatarSource,
  isGenerating,
  generationError,
  onPhotoSelected,
  onGeneratedPhoto,
  onPromptChange,
  onSourceChange,
  onGeneratingChange,
  onGenerationError,
}: {
  employeeName: string;
  employeeRole: string;
  photoFileName: string | null;
  localPreviewUrl: string | null;
  avatarPrompt: string;
  avatarSource: "upload" | "generate";
  isGenerating: boolean;
  generationError: string | null;
  onPhotoSelected: (file: File) => void;
  onGeneratedPhoto: (file: File, previewUrl: string) => void;
  onPromptChange: (prompt: string) => void;
  onSourceChange: (source: "upload" | "generate") => void;
  onGeneratingChange: (generating: boolean) => void;
  onGenerationError: (message: string | null) => void;
}) {
  const t = useTranslations("employees.create.avatar");
  const tStudio = useTranslations("employees.studio.avatar");
  const [promptTouched, setPromptTouched] = useState(false);

  useEffect(() => {
    if (avatarSource !== "generate" || promptTouched || avatarPrompt.trim()) {
      return;
    }

    const suggestion = buildDefaultAvatarPrompt(employeeName, employeeRole);
    if (suggestion) {
      onPromptChange(suggestion);
    }
  }, [
    avatarPrompt,
    avatarSource,
    employeeName,
    employeeRole,
    onPromptChange,
    promptTouched,
  ]);

  async function handleGenerate(): Promise<void> {
    const prompt = avatarPrompt.trim();
    if (!prompt) {
      onGenerationError(t("promptRequired"));
      return;
    }

    if (!employeeName.trim()) {
      onGenerationError(t("nameRequiredForGenerate"));
      return;
    }

    onGeneratingChange(true);
    onGenerationError(null);

    const result = await generateEmployeeAvatarFromPrompt({
      prompt,
      displayName: employeeName.trim(),
      role: employeeRole.trim() || undefined,
    });

    onGeneratingChange(false);

    if (result.status === "failed") {
      onGenerationError(result.message);
      return;
    }

    const file = base64ToImageFile({
      base64: result.base64,
      mimeType: result.mimeType,
      fileName: result.fileName,
    });
    const previewUrl = `data:${result.mimeType};base64,${result.base64}`;
    onGeneratedPhoto(file, previewUrl);
  }

  function appendSuggestion(key: (typeof PROMPT_SUGGESTIONS)[number]): void {
    const fragment = t(`suggestions.${key}`);
    const current = avatarPrompt.trim();
    onPromptChange(current ? `${current} ${fragment}` : fragment);
    setPromptTouched(true);
  }

  return (
    <Tabs
      value={avatarSource}
      onValueChange={(value) => onSourceChange(value as "upload" | "generate")}
      className="flex flex-col gap-4"
    >
      <TabsList className="grid h-10 w-full grid-cols-2 rounded-lg border border-white/10 bg-white/4 p-1">
        <TabsTrigger
          value="upload"
          className="rounded-md text-sm text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-white"
        >
          {t("tabUpload")}
        </TabsTrigger>
        <TabsTrigger
          value="generate"
          className="rounded-md text-sm text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-white"
        >
          {t("tabGenerate")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="mt-0 flex flex-col gap-4">
        <AvatarUpload
          photoFileName={photoFileName}
          localPreviewUrl={localPreviewUrl}
          disabled={isGenerating}
          onFileSelected={onPhotoSelected}
        />
      </TabsContent>

      <TabsContent value="generate" className="mt-0 flex flex-col gap-4">
        {localPreviewUrl ? (
          <AvatarPreviewCard
            previewUrl={localPreviewUrl}
            alt={employeeName || tStudio("upload")}
          />
        ) : (
          <div className="flex aspect-4/3 items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/2">
            <p className="px-6 text-center text-sm text-white/45">
              {t("previewPlaceholder")}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="avatar-prompt" className="text-white/80">
            {t("promptLabel")}
          </Label>
          <Textarea
            id="avatar-prompt"
            value={avatarPrompt}
            onChange={(event) => {
              setPromptTouched(true);
              onPromptChange(event.target.value);
            }}
            placeholder={t("promptPlaceholder")}
            className="min-h-24 border-white/10 bg-black/40 text-white"
            disabled={isGenerating}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {PROMPT_SUGGESTIONS.map((key) => (
            <Button
              key={key}
              type="button"
              variant="outline"
              size="sm"
              disabled={isGenerating}
              className="border-white/10 bg-transparent text-white/70 hover:bg-white/5 hover:text-white"
              onClick={() => appendSuggestion(key)}
            >
              {t(`suggestions.${key}`)}
            </Button>
          ))}
        </div>

        <Button
          type="button"
          disabled={isGenerating || !avatarPrompt.trim()}
          className="bg-white text-black hover:bg-white/90"
          onClick={() => {
            void handleGenerate();
          }}
        >
          {isGenerating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {tStudio("generating")}
            </>
          ) : localPreviewUrl && avatarSource === "generate" ? (
            tStudio("regenerate")
          ) : (
            <>
              <Sparkles className="size-4" />
              {tStudio("generate")}
            </>
          )}
        </Button>

        {generationError ? (
          <p className="text-sm text-white/70" role="alert">
            {generationError}
          </p>
        ) : null}
      </TabsContent>
    </Tabs>
  );
}
