import { Badge } from "@/components/ui/badge";
import type { AvatarProvider, BrainProvider } from "@/entities/digital-employee";

function formatProviderLabel(provider: string): string {
  if (provider === "openai") {
    return "OpenAI";
  }
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function EmployeeProviderBadges({
  avatarProvider,
  brainProvider,
}: {
  avatarProvider: AvatarProvider;
  brainProvider: BrainProvider;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant="outline"
        className="rounded-md border-white/10 bg-white/[0.02] font-normal text-white/70"
      >
        Avatar · {formatProviderLabel(avatarProvider)}
      </Badge>
      <Badge
        variant="outline"
        className="rounded-md border-white/10 bg-white/[0.02] font-normal text-white/70"
      >
        Brain · {formatProviderLabel(brainProvider)}
      </Badge>
    </div>
  );
}
