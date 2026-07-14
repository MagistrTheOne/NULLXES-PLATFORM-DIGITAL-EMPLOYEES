import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SettingsCard({
  title,
  description,
  className,
  children,
  footer,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card
      size="sm"
      className={cn(
        "h-full gap-0 border-white/10 bg-white/5 py-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-0 backdrop-blur-xl",
        className,
      )}
    >
      <CardHeader className="border-b border-white/8 px-5 py-4">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-xs">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-5 py-5">{children}</CardContent>
      {footer ? (
        <CardFooter className="justify-end gap-3 border-t border-white/8 px-5 py-4">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}
