import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<"input">>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

