import { Loader2 } from 'lucide-react';

interface UpdateLoadingOverlayProps {
  message: string;
}

export const UpdateLoadingOverlay = ({ message }: UpdateLoadingOverlayProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-lg bg-background p-8 shadow-lg">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">{message}</p>
        <p className="text-sm text-muted-foreground">Por favor espera...</p>
      </div>
    </div>
  );
};
