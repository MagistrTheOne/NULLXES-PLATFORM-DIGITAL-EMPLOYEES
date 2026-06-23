"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Play, Search } from "lucide-react";
import { listElevenLabsStudioVoices } from "@/features/employees/actions/list-elevenlabs-studio-voices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  CUSTOM_ELEVENLABS_STUDIO_VOICE_ID,
  buildStudioVoiceCatalog,
  filterStudioVoices,
  getStudioVoiceById,
  type StudioVoiceOption,
  type StudioVoiceProvider,
} from "./voice-catalog";
import type { StudioVoiceGenderFilter } from "./normalize-studio-voice-gender";

function VoiceDetailPanel({
  voice,
  isCustomVoice,
  isPreviewing,
  onPreview,
}: {
  voice: StudioVoiceOption;
  isCustomVoice: boolean;
  isPreviewing: boolean;
  onPreview?: () => void;
}) {
  const t = useTranslations("employees.studio.voice");
  const canPreview = voice.provider === "ElevenLabs" && Boolean(onPreview);

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-wide text-white/40">{t("selectedVoice")}</p>
      <h3 className="mt-2 text-lg font-medium text-white">{voice.name}</h3>
      <dl className="mt-4 grid gap-2 text-sm">
        <div className="flex justify-between gap-4 border-b border-white/10 py-2">
          <dt className="text-white/50">{t("provider")}</dt>
          <dd className="text-white">{voice.provider}</dd>
        </div>
        {isCustomVoice && voice.elevenLabsVoiceId ? (
          <div className="flex flex-col gap-1 border-b border-white/10 py-2">
            <dt className="text-white/50">{t("voiceId")}</dt>
            <dd className="break-all font-mono text-xs text-white">
              {voice.elevenLabsVoiceId}
            </dd>
          </div>
        ) : (
          <>
            <div className="flex justify-between gap-4 border-b border-white/10 py-2">
              <dt className="text-white/50">{t("gender")}</dt>
              <dd className="text-white">{voice.gender}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-white/50">{t("language")}</dt>
              <dd className="text-white">{voice.language}</dd>
            </div>
          </>
        )}
      </dl>
      <div className="mt-4 border-t border-white/10 pt-4">
        {canPreview ? (
          <Button
            type="button"
            variant="outline"
            disabled={isPreviewing}
            onClick={onPreview}
            className="w-full border-white/10 bg-transparent text-white hover:bg-white/5"
          >
            {isPreviewing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            {t("listenPreview")}
          </Button>
        ) : (
          <p className="text-xs text-white/45">{t("anamPreviewNote")}</p>
        )}
      </div>
    </div>
  );
}

export function VoiceStudioPicker({
  selectedVoiceId,
  customElevenLabsVoiceId,
  previewingVoiceId,
  onSelectVoice,
  onApplyCustomVoice,
  onPreviewVoice,
}: {
  selectedVoiceId: string | null;
  customElevenLabsVoiceId: string;
  previewingVoiceId: string | null;
  onSelectVoice: (input: {
    studioVoiceId: string;
    voiceName: string;
    provider: StudioVoiceProvider;
    elevenLabsVoiceId?: string;
  }) => void;
  onApplyCustomVoice: (elevenLabsVoiceId: string) => void;
  onPreviewVoice: (elevenLabsVoiceId: string) => void;
}) {
  const t = useTranslations("employees.studio.voice");
  const providerFilterOptions: Array<{
    value: "all" | StudioVoiceProvider;
    label: string;
  }> = [
    { value: "all", label: t("allProviders") },
    { value: "Anam", label: "Anam" },
    { value: "ElevenLabs", label: "ElevenLabs" },
  ];
  const genderFilterOptions: Array<{
    value: StudioVoiceGenderFilter;
    label: string;
  }> = [
    { value: "all", label: t("allGenders") },
    { value: "female", label: t("female") },
    { value: "male", label: t("male") },
  ];
  const [providerFilter, setProviderFilter] = useState<"all" | StudioVoiceProvider>(
    "all",
  );
  const [genderFilter, setGenderFilter] =
    useState<StudioVoiceGenderFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiElevenLabsVoices, setApiElevenLabsVoices] = useState<
    StudioVoiceOption[]
  >([]);
  const [voicesLoadError, setVoicesLoadError] = useState<string | null>(null);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [customDraftId, setCustomDraftId] = useState(customElevenLabsVoiceId);
  const [customOpen, setCustomOpen] = useState(
    selectedVoiceId === CUSTOM_ELEVENLABS_STUDIO_VOICE_ID,
  );

  const isCustomSelected = selectedVoiceId === CUSTOM_ELEVENLABS_STUDIO_VOICE_ID;

  useEffect(() => {
    setCustomDraftId(customElevenLabsVoiceId);
  }, [customElevenLabsVoiceId]);

  useEffect(() => {
    if (isCustomSelected) {
      setCustomOpen(true);
    }
  }, [isCustomSelected]);

  useEffect(() => {
    let cancelled = false;

    void listElevenLabsStudioVoices()
      .then((result) => {
        if (cancelled) {
          return;
        }

        if (result.ok) {
          setApiElevenLabsVoices(result.voices);
          setVoicesLoadError(null);
          return;
        }

        setVoicesLoadError(result.message);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingVoices(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const catalogVoices = useMemo(
    () => buildStudioVoiceCatalog(apiElevenLabsVoices),
    [apiElevenLabsVoices],
  );

  const filteredVoices = useMemo(
    () =>
      filterStudioVoices({
        query: searchQuery,
        provider: providerFilter,
        gender: genderFilter,
        voices: catalogVoices,
      }),
    [catalogVoices, genderFilter, providerFilter, searchQuery],
  );

  const selectedVoice = useMemo(
    () =>
      selectedVoiceId
        ? getStudioVoiceById(selectedVoiceId, customElevenLabsVoiceId) ??
          catalogVoices.find((voice) => voice.id === selectedVoiceId)
        : undefined,
    [catalogVoices, customElevenLabsVoiceId, selectedVoiceId],
  );

  const catalogGroups = useMemo(() => {
    const anam = filteredVoices.filter((voice) => voice.provider === "Anam");
    const eleven = filteredVoices.filter(
      (voice) => voice.provider === "ElevenLabs",
    );
    return { anam, eleven };
  }, [filteredVoices]);

  function handleSelectCatalogVoice(voiceId: string): void {
    if (voiceId === CUSTOM_ELEVENLABS_STUDIO_VOICE_ID) {
      return;
    }

    const voice = catalogVoices.find((item) => item.id === voiceId);
    if (!voice) {
      return;
    }

    onSelectVoice({
      studioVoiceId: voice.id,
      voiceName: voice.name,
      provider: voice.provider,
      elevenLabsVoiceId: voice.elevenLabsVoiceId,
    });
  }

  function handleApplyCustom(): void {
    const trimmed = customDraftId.trim();
    if (!trimmed) {
      return;
    }
    onApplyCustomVoice(trimmed);
    setCustomOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wide text-white/40">{t("findVoice")}</p>
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("search")}
              className="border-white/10 bg-black/40 pl-9 text-white placeholder:text-white/40"
              aria-label="Search voices"
            />
          </div>
          <Select
            value={providerFilter}
            onValueChange={(value) =>
              setProviderFilter(value as "all" | StudioVoiceProvider)
            }
          >
            <SelectTrigger
              className="w-full border-white/10 bg-black/40 text-white lg:w-40"
              aria-label="Filter by provider"
            >
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#111111] text-white">
              {providerFilterOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-white focus:bg-white/10 focus:text-white"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={genderFilter}
            onValueChange={(value) =>
              setGenderFilter(value as StudioVoiceGenderFilter)
            }
          >
            <SelectTrigger
              className="w-full border-white/10 bg-black/40 text-white lg:w-36"
              aria-label="Filter by gender"
            >
              <SelectValue placeholder={t("gender")} />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#111111] text-white">
              {genderFilterOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-white focus:bg-white/10 focus:text-white"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isLoadingVoices ? (
          <p className="flex items-center gap-2 text-xs text-white/45">
            <Loader2 className="size-3 animate-spin" />
            {t("loadingVoices")}
          </p>
        ) : null}
        {voicesLoadError ? (
          <p className="text-xs text-white/45">{t("voicesLoadFallback")}</p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wide text-white/40">2 · Choose from list</p>
        <Select
          value={selectedVoiceId ?? ""}
          onValueChange={handleSelectCatalogVoice}
        >
          <SelectTrigger
            className="h-auto min-h-10 w-full border-white/10 bg-black/40 py-2 text-white"
            aria-label="Voice"
          >
            <SelectValue
              placeholder={
                isCustomSelected && selectedVoice?.elevenLabsVoiceId
                  ? `Custom · ${selectedVoice.elevenLabsVoiceId}`
                  : "Select a catalog voice"
              }
            />
          </SelectTrigger>
          <SelectContent className="max-h-72 border-white/10 bg-[#111111] text-white">
            {isCustomSelected && selectedVoice?.elevenLabsVoiceId ? (
              <SelectGroup>
                <SelectLabel className="text-white/50">Active custom voice</SelectLabel>
                <SelectItem
                  value={CUSTOM_ELEVENLABS_STUDIO_VOICE_ID}
                  className="font-mono text-xs text-white focus:bg-white/10 focus:text-white"
                >
                  {selectedVoice.elevenLabsVoiceId}
                </SelectItem>
              </SelectGroup>
            ) : null}
            {filteredVoices.length === 0 ? (
              <p className="px-3 py-4 text-sm text-white/50">
                No catalog voices match. Try another filter or use a custom 
                voice ID below.
              </p>
            ) : null}
            {catalogGroups.anam.length > 0 ? (
              <SelectGroup>
                <SelectLabel className="text-white/50">Anam</SelectLabel>
                {catalogGroups.anam.map((voice) => (
                  <SelectItem
                    key={voice.id}
                    value={voice.id}
                    className="text-white focus:bg-white/10 focus:text-white"
                  >
                    {voice.name} · {voice.gender}
                  </SelectItem>
                ))}
              </SelectGroup>
            ) : null}
            {catalogGroups.eleven.length > 0 ? (
              <SelectGroup>
                <SelectLabel className="text-white/50">ElevenLabs</SelectLabel>
                {catalogGroups.eleven.map((voice) => (
                  <SelectItem
                    key={voice.id}
                    value={voice.id}
                    className="text-white focus:bg-white/10 focus:text-white"
                  >
                    {voice.name} · {voice.gender}
                  </SelectItem>
                ))}
              </SelectGroup>
            ) : null}
          </SelectContent>
        </Select>
      </section>

      {selectedVoice ? (
        <section className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-wide text-white/40">3 · Preview</p>
          <VoiceDetailPanel
            voice={selectedVoice}
            isCustomVoice={isCustomSelected}
            isPreviewing={
              selectedVoice.provider === "ElevenLabs" &&
              Boolean(selectedVoice.elevenLabsVoiceId) &&
              previewingVoiceId === selectedVoice.elevenLabsVoiceId
            }
            onPreview={
              selectedVoice.elevenLabsVoiceId
                ? () => onPreviewVoice(selectedVoice.elevenLabsVoiceId!)
                : undefined
            }
          />
        </section>
      ) : (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-white/45">
          Select a voice from the list or add a custom  voice ID.
        </p>
      )}

      <Collapsible open={customOpen} onOpenChange={setCustomOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "h-auto w-full justify-between px-0 text-sm text-white/60 hover:bg-transparent hover:text-white",
            )}
          >
            Custom  voice ID
            <span className="text-xs text-white/40">{customOpen ? "Hide" : "Show"}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-3 pt-2">
          <p className="text-xs text-white/45">
            Paste an  voice ID from your account if it is not in the catalog.
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="custom-elevenlabs-voice-id" className="text-white/80">
              Voice ID
            </Label>
            <Input
              id="custom-elevenlabs-voice-id"
              value={customDraftId}
              onChange={(event) => setCustomDraftId(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleApplyCustom();
                }
              }}
              placeholder="e.g. FGY2WhTYpPnrIDTdsKH5"
              className="border-white/10 bg-black/40 font-mono text-sm text-white placeholder:text-white/35"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleApplyCustom}
            disabled={!customDraftId.trim()}
            className="border-white/10 bg-transparent text-white hover:bg-white/5"
          >
            Use custom voice ID
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
