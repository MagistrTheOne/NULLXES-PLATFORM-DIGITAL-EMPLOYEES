"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Play, Search } from "lucide-react";
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
  STUDIO_VOICES,
  filterStudioVoices,
  getStudioVoiceById,
  type StudioVoiceOption,
  type StudioVoiceProvider,
} from "./voice-catalog";

const PROVIDER_FILTER_OPTIONS: Array<{
  value: "all" | StudioVoiceProvider;
  label: string;
}> = [
  { value: "all", label: "All providers" },
  { value: "Anam", label: "Anam" },
  { value: "ElevenLabs", label: "ElevenLabs" },
];

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
  const canPreview = voice.provider === "ElevenLabs" && Boolean(onPreview);

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-wide text-white/40">Selected voice</p>
      <h3 className="mt-2 text-lg font-medium text-white">{voice.name}</h3>
      <dl className="mt-4 grid gap-2 text-sm">
        <div className="flex justify-between gap-4 border-b border-white/10 py-2">
          <dt className="text-white/50">Provider</dt>
          <dd className="text-white">{voice.provider}</dd>
        </div>
        {isCustomVoice && voice.elevenLabsVoiceId ? (
          <div className="flex flex-col gap-1 border-b border-white/10 py-2">
            <dt className="text-white/50">Voice ID</dt>
            <dd className="break-all font-mono text-xs text-white">
              {voice.elevenLabsVoiceId}
            </dd>
          </div>
        ) : (
          <>
            <div className="flex justify-between gap-4 border-b border-white/10 py-2">
              <dt className="text-white/50">Gender</dt>
              <dd className="text-white">{voice.gender}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-white/50">Language</dt>
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
            Listen to preview
          </Button>
        ) : (
          <p className="text-xs text-white/45">
            Anam voices are verified when you create the employee.
          </p>
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
  }) => void;
  onApplyCustomVoice: (elevenLabsVoiceId: string) => void;
  onPreviewVoice: (elevenLabsVoiceId: string) => void;
}) {
  const [providerFilter, setProviderFilter] = useState<"all" | StudioVoiceProvider>(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredVoices = useMemo(
    () => filterStudioVoices({ query: searchQuery, provider: providerFilter }),
    [searchQuery, providerFilter],
  );

  const selectedVoice = useMemo(
    () =>
      selectedVoiceId
        ? getStudioVoiceById(selectedVoiceId, customElevenLabsVoiceId)
        : undefined,
    [selectedVoiceId, customElevenLabsVoiceId],
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

    const voice = STUDIO_VOICES.find((item) => item.id === voiceId);
    if (!voice) {
      return;
    }

    onSelectVoice({
      studioVoiceId: voice.id,
      voiceName: voice.name,
      provider: voice.provider,
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
        <p className="text-xs uppercase tracking-wide text-white/40">1 · Find a voice</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, language, provider…"
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
              className="w-full border-white/10 bg-black/40 text-white sm:w-44"
              aria-label="Filter by provider"
            >
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#111111] text-white">
              {PROVIDER_FILTER_OPTIONS.map((option) => (
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
                No catalog voices match. Try another filter or use a custom ElevenLabs
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
          Select a voice from the list or add a custom ElevenLabs voice ID.
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
            Custom ElevenLabs voice ID
            <span className="text-xs text-white/40">{customOpen ? "Hide" : "Show"}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-3 pt-2">
          <p className="text-xs text-white/45">
            Paste an ElevenLabs voice ID from your account if it is not in the catalog.
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
            Use custom voice
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
