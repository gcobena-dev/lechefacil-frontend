import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

type SwitchSize = "sm" | "md" | "lg";

type RootProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
  size?: SwitchSize;
};

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  RootProps
>(({ className, size = "md", ...props }, ref) => {
  const rootSize =
    size === "sm"
      ? "h-5 w-9"
      : size === "lg"
      ? "h-7 w-14"
      : "h-6 w-11";
  const thumbSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const translateX = size === "sm" ? "data-[state=checked]:translate-x-4" : size === "lg" ? "data-[state=checked]:translate-x-7" : "data-[state=checked]:translate-x-5";
  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        rootSize,
        className,
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0",
          thumbSize,
          translateX,
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
