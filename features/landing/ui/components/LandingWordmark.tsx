import Link from "next/link";

import { Badge } from "@/shared/ui/components/Badge";
import { cn } from "@/shared/lib/utils";

export function LandingWordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/home"
      aria-label="Discovery Home"
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap",
        className
      )}
    >
      <span className="font-mono text-base font-medium">Discovery</span>
      <Badge variant="outline-strong">v4 beta</Badge>
    </Link>
  );
}
