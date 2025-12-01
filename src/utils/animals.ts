export const getStatusKeyFromCode = (code?: string) => {
  const c = (code ?? '').toUpperCase();
  if (["LACTATING", "DRY", "PREGNANT_DRY", "CALF", "HEIFER", "PREGNANT_HEIFER", "BULL"].includes(c)) return 'active';
  if (c === 'SOLD') return 'sold';
  if (c === 'CULLED') return 'culled';
  if (c === 'DEAD') return 'dead';
  return '';
};

type AnimalWithPhoto = {
  primary_photo_signed_url?: string | null;
  primary_photo_url?: string | null;
  photo_url?: string | null;
};

export const getAnimalImageUrl = (animal?: AnimalWithPhoto | null) => {
  if (!animal) return null;
  // Prefer signed URL (safe for private buckets)
  if (animal.primary_photo_signed_url) return animal.primary_photo_signed_url;
  // In some cases primary_photo_url may already be a full URL (public bucket)
  if (animal.primary_photo_url?.startsWith("http")) return animal.primary_photo_url;
  if (animal.photo_url?.startsWith("http")) return animal.photo_url;
  return null;
};
