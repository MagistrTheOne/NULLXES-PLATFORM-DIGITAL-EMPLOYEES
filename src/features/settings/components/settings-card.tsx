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
    <Card size="sm" className={cn("gap-0 py-0 ring-foreground/8", className)}>
      <CardHeader className="border-b border-border/80 px-5 py-4">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-xs">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="px-5 py-5">{children}</CardContent>
      {footer ? (
        <CardFooter className="justify-end gap-3 border-t border-border/80 px-5 py-4">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}
