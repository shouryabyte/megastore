import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRealtimeStore } from "@/store/realtime";

export function RealtimeNotices() {
  const notices = useRealtimeStore((s) => s.notices);
  const remove = useRealtimeStore((s) => s.remove);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 w-[min(420px,calc(100vw-2rem))] space-y-2">
      <AnimatePresence initial={false}>
        {notices.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className={cn(
              "pointer-events-auto rounded-xl border border-border bg-card/80 p-3 shadow-soft backdrop-blur",
              n.kind === "warning" && "border-amber-500/30",
              n.kind === "success" && "border-emerald-500/30"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{n.title}</div>
                {n.message ? <div className="mt-0.5 text-sm text-muted-foreground">{n.message}</div> : null}
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(n.id)} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

