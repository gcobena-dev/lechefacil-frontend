import { useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import clsx from "clsx";

type ImageLightboxProps = {
  /** URLs to show; navigation and thumbnails appear when there is more than one. */
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alt?: string;
  loading?: boolean;
  error?: string | null;
};

/**
 * Full screen viewer with zoom/pan for a list of images.
 *
 * Kept free of any fetching so the animal gallery and the certificate scans
 * can share the same viewer.
 */
export function ImageLightbox({
  images,
  index,
  onIndexChange,
  open,
  onOpenChange,
  alt = "",
  loading = false,
  error = null,
}: ImageLightboxProps) {
  const zoomRef = useRef<ReactZoomPanPinchRef>(null);
  const current = images[index];

  const step = (delta: number) => {
    if (images.length === 0) return;
    zoomRef.current?.resetTransform(0);
    onIndexChange((index + delta + images.length) % images.length);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl p-0 overflow-hidden"
        onInteractOutside={(e) => {
          // Stopped so the dialog never closes a parent link/row underneath.
          e.preventDefault();
          e.stopPropagation();
          onOpenChange(false);
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpenChange(false);
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpenChange(false);
        }}
      >
        {/* Superficie siempre oscura: los tokens de dentro resuelven en dark */}
        <div className="dark relative bg-black">
          <button
            type="button"
            className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1 text-black"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenChange(false);
            }}
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center justify-center min-h-[320px] bg-black">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            ) : (
              <TransformWrapper
                ref={zoomRef}
                initialScale={1}
                minScale={1}
                maxScale={5}
                doubleClick={{ mode: "toggle", step: 2 }}
                pinch={{ step: 5 }}
                key={current}
              >
                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100%" }}
                  contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}
                >
                  <img
                    src={current}
                    alt={alt}
                    className="max-h-[80vh] max-w-full object-contain"
                  />
                </TransformComponent>
              </TransformWrapper>
            )}
          </div>

          {error && (
            <div className="px-4 pb-3 text-center text-xs text-destructive">{error}</div>
          )}

          {images.length > 1 && (
            <div className="absolute inset-y-0 left-0 flex items-center">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => step(-1)}>
                <ChevronLeft className="h-6 w-6" />
              </Button>
            </div>
          )}
          {images.length > 1 && (
            <div className="absolute inset-y-0 right-0 flex items-center">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => step(1)}>
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 py-3">
            {images.map((image, i) => (
              <button
                key={image + i}
                type="button"
                className={clsx(
                  "h-12 w-12 rounded-md border border-border overflow-hidden",
                  i === index ? "ring-2 ring-primary" : ""
                )}
                onClick={() => {
                  zoomRef.current?.resetTransform(0);
                  onIndexChange(i);
                }}
              >
                <img src={image} alt={`${alt} ${i + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
