import { apiFetch } from "./client";
import { AnimalResponse, AnimalsListResponse, AnimalStatusResponse, AnimalPhotoUploadResponse, AnimalPhotoResponse } from "./types";

export async function listAnimals(params?: { cursor?: string; limit?: number; q?: string; status_codes?: string }) {
  return apiFetch<AnimalsListResponse>("/api/v1/animals/", {
    withAuth: true,
    withTenant: true,
    query: {
      cursor: params?.cursor,
      limit: params?.limit,
      q: params?.q,
      status_codes: params?.status_codes,
    },
  });
}

export async function getAnimal(id: string) {
  return apiFetch<AnimalResponse>(`/api/v1/animals/${id}`, {
    withAuth: true,
    withTenant: true,
  });
}

export async function createAnimal(payload: {
  tag: string;
  name?: string | null;
  breed?: string | null;
  breed_variant?: string | null;
  breed_id?: string | null;
  birth_date?: string | null; // YYYY-MM-DD
  lot?: string | null;
  lot_id?: string | null;
  status_id?: string | null;
  photo_url?: string | null;
}) {
  return apiFetch<AnimalResponse>("/api/v1/animals/", {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function updateAnimal(id: string, payload: Partial<Omit<AnimalResponse, "id" | "tenant_id" | "created_at" | "updated_at">> & { version: number }) {
  return apiFetch<AnimalResponse>(`/api/v1/animals/${id}`, {
    method: "PUT",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function deleteAnimal(id: string) {
  return apiFetch<void>(`/api/v1/animals/${id}`, {
    method: "DELETE",
    withAuth: true,
    withTenant: true,
  });
}

export async function getAnimalStatuses(lang: string = 'es') {
  return apiFetch<AnimalStatusResponse[]>("/api/v1/animals/statuses/list", {
    withAuth: true,
    withTenant: true,
    query: {
      lang,
    },
  });
}

export async function getNextTag() {
  return apiFetch<{ next_tag: string }>("/api/v1/animals/next-tag", {
    withAuth: true,
    withTenant: true,
  });
}

// Photo upload functions
export async function getPhotoUploadUrl(animalId: string, contentType: string) {
  return apiFetch<AnimalPhotoUploadResponse>(`/api/v1/animals/${animalId}/photos/uploads`, {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: { content_type: contentType },
  });
}

export async function uploadPhotoToS3(uploadUrl: string, fields: Record<string, string>, file: File) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });
  formData.append('file', file);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.status}`);
  }
}

export async function confirmPhotoUpload(animalId: string, payload: {
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  title?: string;
  description?: string;
  is_primary: boolean;
  position: number;
}) {
  return apiFetch<AnimalPhotoResponse>(`/api/v1/animals/${animalId}/photos`, {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function listAnimalPhotos(animalId: string) {
  return apiFetch<AnimalPhotoResponse[]>(`/api/v1/animals/${animalId}/photos`, {
    withAuth: true,
    withTenant: true,
  });
}

export async function deleteAnimalPhoto(animalId: string, photoId: string) {
  return apiFetch<void>(`/api/v1/animals/${animalId}/photos/${photoId}`, {
    method: "DELETE",
    withAuth: true,
    withTenant: true,
  });
}

export async function uploadAnimalPhoto(animalId: string, file: File, options?: {
  position?: number;
  is_primary?: boolean;
  title?: string;
  description?: string;
}) {
  // Step 1: Get presigned URL
  const { upload_url, storage_key, fields } = await getPhotoUploadUrl(animalId, file.type);

  // Step 2: Upload to S3
  await uploadPhotoToS3(upload_url, fields, file);

  // Step 3: Confirm in backend
  return confirmPhotoUpload(animalId, {
    storage_key,
    mime_type: file.type,
    size_bytes: file.size,
    title: options?.title,
    description: options?.description,
    is_primary: options?.is_primary ?? false,
    position: options?.position ?? 0,
  });
}

export async function uploadMultiplePhotos(animalId: string, files: File[]) {
  const results: AnimalPhotoResponse[] = [];

  // Get existing photos to determine starting position
  let existingPhotos: AnimalPhotoResponse[] = [];
  try {
    existingPhotos = await listAnimalPhotos(animalId);
  } catch (error) {
    // If animal has no photos yet, start from 0
    existingPhotos = [];
  }

  // Find the highest position or start from 0
  const maxPosition = existingPhotos.length > 0
    ? Math.max(...existingPhotos.map(p => p.position))
    : -1;

  // Check if there's already a primary photo
  const hasPrimary = existingPhotos.some(p => p.is_primary);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadAnimalPhoto(animalId, file, {
      position: maxPosition + 1 + i,
      is_primary: !hasPrimary && i === 0, // Only set first as primary if no primary exists
      title: `Foto ${existingPhotos.length + i + 1}`,
    });
    results.push(result);
  }

  return results;
}
