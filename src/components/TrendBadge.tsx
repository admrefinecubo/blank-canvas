import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendBadgeProps {
  current: number;
  previous: number;
  suffix?: string;
}

export function TrendBadge({ current, previous, suffix = "vs ontem" }: TrendBadgeProps) {
  if (previous === 0 && current === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
        <Minus className="h-3 w-3" />
        {suffix}
      </span>
    );
  }

  const delta = previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium",
        isNeutral && "text-muted-foreground",
        isPositive && "text-emerald-600 dark:text-emerald-400",
        !isPositive && !isNeutral && "text-rose-600 dark:text-rose-400"
      )}
    >
      {isNeutral ? (
        <Minus className="h-3 w-3" />
      ) : isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isNeutral ? "" : `${delta > 0 ? "+" : ""}${delta}%`} {suffix}
    </span>
  );
}
