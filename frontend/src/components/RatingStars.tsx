import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({ value, count, className }: { value: number; count?: number; className?: string }) {
  const v = Math.max(0, Math.min(5, value || 0));
  const full = Math.floor(v);
  const half = v - full >= 0.5;
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return <Star key={i} className={cn("h-4 w-4", filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/50")} />;
      })}
      {typeof count === "number" && <span className="ml-1 text-xs text-muted-foreground">({count})</span>}
    </div>
  );
}
