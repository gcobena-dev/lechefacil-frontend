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
        // Lift above BottomNav (h-14) and safe area className=
        "fixed bottom-16 right-6 h-14 w-14 rounded-full shadow-lg",
        "md:hidden", // Only show on mobile
        "hover:scale-110 transition-transform",
        className
      )}
    >
      <Link to={to}>
        {children || <Plus className="h-6 w-6" />}
      </Link>
    </Button>
  );
}
