import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  to: string;
  className?: string;
  children?: React.ReactNode;
}

export function FloatingActionButton({ to, className, children }: FloatingActionButtonProps) {
  return (
    <Button 
      asChild 
      size="icon"
      className={cn(
        // Se apoya por encima del BottomNav (h-16) + safe area, sin taparlo
        "fixed right-5 bottom-[calc(5rem+env(safe-area-inset-bottom))]",
        "h-14 w-14 rounded-full shadow-strong",
        "md:hidden", // Only show on mobile
        "active:scale-95 transition-transform",
        className
      )}
    >
      <Link to={to}>
        {children || <Plus className="h-6 w-6" />}
      </Link>
    </Button>
  );
}
