import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { listAnimalPhotos } from "@/services/animals";
import { getAnimalImageUrl } from "@/utils/animals";
import clsx from "clsx";

type AnimalPhotoLightboxProps = {
  animalId: string;
  primaryUrl?: string | null;
  primarySignedUrl?: string | null;
  fallbackUrl?: string;
  alt?: string;
  className?: string;
  thumbClassName?: string;
};

export function AnimalPhotoLightbox({
  animalId,
  primaryUrl,
  primarySignedUrl,
  fallbackUrl = "/logo.png",
  alt = "Animal",
  className,
  thumbClassName,
}: AnimalPhotoLightboxProps) {
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const initialUrl = useMemo(() => {
    return primarySignedUrl || primaryUrl || fallbackUrl;
  }, [primarySignedUrl, primaryUrl, fallbackUrl]);

  useEffect(() => {
    if (open && photos.length === 0 && !loading) {
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await listAnimalPhotos(animalId);
          const urls = res
            .map((p) => p.url || p.storage_key)
            .filter(Boolean) as string[];
          const unique = Array.from(new Set([initialUrl, ...urls].filter(Boolean)));
          setPhotos(unique.length > 0 ? unique : [fallbackUrl]);
        } catch (err) {
          setError("No se pudieron cargar las fotos");
          setPhotos([initialUrl].filter(Boolean) as string[] || [fallbackUrl]);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [animalId, open, photos.length, loading, initialUrl, fallbackUrl]);

  const current = photos[index] || initialUrl;

  const next = () => setIndex((prev) => (prev + 1) % photos.length);
  const prev = () => setIndex((prev) => (prev - 1 + photos.length) % photos.length);

  return (
    <>
      <div
        className={clsx("overflow-hidden rounded-md border border-border bg-muted", className)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        onMouseDown={(e) => {
          // Avoid parent Link onMouseDown navigation
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <img
          src={
            getAnimalImageUrl({
              primary_photo_signed_url: primarySignedUrl,
              primary_photo_url: primaryUrl,
            }) ?? fallbackUrl
          }
          alt={alt}
          className={clsx("h-full w-full object-cover cursor-zoom-in", thumbClassName)}
          loading="lazy"
          onMouseUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          // Prevent the dialog from bubbling close events to parents (links)
          if (!next) {
            setOpen(false);
          } else {
            setOpen(true);
          }
        }}
      >
        <DialogContent
          className="sm:max-w-3xl p-0 overflow-hidden"
          onInteractOutside={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }}
          onPointerDownOutside={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }}
        >
          <div className="relative bg-black">
            <button
              type="button"
              className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1 text-black"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
              }}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-center min-h-[320px] bg-black">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              ) : (
                <img
                  src={current || fallbackUrl}
                  alt={alt}
                  className="max-h-[80vh] max-w-full object-contain"
                />
              )}
            </div>

            {error && (
              <div className="px-4 pb-3 text-center text-xs text-red-200">{error}</div>
            )}

            {photos.length > 1 && (
              <div className="absolute inset-y-0 left-0 flex items-center">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={prev}>
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              </div>
            )}
            {photos.length > 1 && (
              <div className="absolute inset-y-0 right-0 flex items-center">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={next}>
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            )}
          </div>

          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 py-3">
              {photos.map((p, i) => (
                <button
                  key={p + i}
                  type="button"
                  className={clsx(
                    "h-12 w-12 rounded-md border border-border overflow-hidden",
                    i === index ? "ring-2 ring-primary" : ""
                  )}
                  onClick={() => setIndex(i)}
                >
                  <img src={p} alt={`${alt} ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
