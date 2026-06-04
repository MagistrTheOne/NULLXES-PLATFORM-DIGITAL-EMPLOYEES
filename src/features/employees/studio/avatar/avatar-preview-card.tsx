import { cn } from "@/lib/utils";

export function AvatarPreviewCard({
  previewUrl,
  alt,
  className,
}: {
  previewUrl: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/10 bg-[#111111]",
        className,
      )}
    >
      <div className="relative aspect-4/3 w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={alt}
          className="size-full object-cover"
        />
      </div>
    </div>
  );
}
