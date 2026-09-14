import { useEffect, useMemo, useState } from "react";
import { ImageLightbox } from "@/components/ui/image-lightbox";
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

      <ImageLightbox
        images={photos.length > 0 ? photos : [initialUrl || fallbackUrl]}
        index={index}
        onIndexChange={setIndex}
        open={open}
        onOpenChange={setOpen}
        alt={alt}
        loading={loading}
        error={error}
      />
    </>
  );
}
