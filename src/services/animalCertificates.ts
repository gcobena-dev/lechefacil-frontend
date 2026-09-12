import { apiFetch, ApiError } from "./client";
import { uploadPhotoToS3 } from "./animals";
import type { AnimalPhotoUploadResponse } from "./types";

export interface AnimalCertificate {
  id: string;
  tenant_id: string;
  animal_id: string;
  registry_number?: string;
  bolus_id?: string;
  tattoo_left?: string;
  tattoo_right?: string;
  issue_date?: string;
  breeder?: string;
  owner?: string;
  farm?: string;
  certificate_name?: string;
  association_code?: string;
  notes?: string;
  data?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
  // Enriched fields
  animal_tag?: string;
  animal_name?: string;
}

export interface CertificateCreatePayload {
  animal_id: string;
  registry_number?: string;
  bolus_id?: string;
  tattoo_left?: string;
  tattoo_right?: string;
  issue_date?: string;
  breeder?: string;
  owner?: string;
  farm?: string;
  certificate_name?: string;
  association_code?: string;
  notes?: string;
  data?: Record<string, any>;
}

export interface CertificateUpdatePayload {
  version: number;
  registry_number?: string;
  bolus_id?: string;
  tattoo_left?: string;
  tattoo_right?: string;
  issue_date?: string;
  breeder?: string;
  owner?: string;
  farm?: string;
  certificate_name?: string;
  association_code?: string;
  notes?: string;
  data?: Record<string, any>;
}

/**
 * Get the certificate for an animal
 */
export const getAnimalCertificate = async (
  animalId: string
): Promise<AnimalCertificate | null> => {
  try {
    return await apiFetch<AnimalCertificate>(
      `/api/v1/animals/${animalId}/certificate`,
      {
        method: "GET",
        withAuth: true,
        withTenant: true,
      }
    );
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Create a certificate for an animal
 */
export const createCertificate = async (
  animalId: string,
  payload: Omit<CertificateCreatePayload, "animal_id">
): Promise<AnimalCertificate> => {
  return apiFetch<AnimalCertificate>(
    `/api/v1/animals/${animalId}/certificate`,
    {
      method: "POST",
      body: { ...payload, animal_id: animalId },
      withAuth: true,
      withTenant: true,
    }
  );
};

/**
 * Update an animal's certificate
 */
export const updateCertificate = async (
  animalId: string,
  payload: CertificateUpdatePayload
): Promise<AnimalCertificate> => {
  return apiFetch<AnimalCertificate>(
    `/api/v1/animals/${animalId}/certificate`,
    {
      method: "PUT",
      body: payload,
      withAuth: true,
      withTenant: true,
    }
  );
};

/**
 * Delete an animal's certificate
 */
export const deleteCertificate = async (animalId: string): Promise<void> => {
  await apiFetch<void>(`/api/v1/animals/${animalId}/certificate`, {
    method: "DELETE",
    withAuth: true,
    withTenant: true,
  });
};

// --- Certificate files ------------------------------------------------------
// Scans of the paper certificate: images or PDFs. Same three steps as the
// animal photos — ask for a presigned URL, POST the file to the bucket, then
// tell the API about it — reusing `uploadPhotoToS3` rather than a second copy
// of the multipart dance.

/** What the API accepts; anything else is rejected with a 415. */
export const CERTIFICATE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";

export interface CertificateFile {
  id: string;
  url: string;
  title?: string | null;
  description?: string | null;
  is_primary: boolean;
  position: number;
  mime_type: string;
  size_bytes?: number | null;
  created_at: string;
}

export const listCertificateFiles = async (
  animalId: string
): Promise<CertificateFile[]> => {
  return apiFetch<CertificateFile[]>(
    `/api/v1/animals/${animalId}/certificate/files`,
    { withAuth: true, withTenant: true }
  );
};

export const deleteCertificateFile = async (
  animalId: string,
  fileId: string
): Promise<void> => {
  await apiFetch<void>(
    `/api/v1/animals/${animalId}/certificate/files/${fileId}`,
    { method: "DELETE", withAuth: true, withTenant: true }
  );
};

/**
 * Upload one file and register it.
 *
 * `position` orders the files; pass the next free one so two uploads do not
 * collide on the attachments' unique (owner, position) index.
 */
export const uploadCertificateFile = async (
  animalId: string,
  file: File,
  position = 0
): Promise<CertificateFile> => {
  const presigned = await apiFetch<AnimalPhotoUploadResponse>(
    `/api/v1/animals/${animalId}/certificate/files/uploads`,
    {
      method: "POST",
      withAuth: true,
      withTenant: true,
      body: { content_type: file.type },
    }
  );

  await uploadPhotoToS3(presigned.upload_url, presigned.fields, file);

  return apiFetch<CertificateFile>(
    `/api/v1/animals/${animalId}/certificate/files`,
    {
      method: "POST",
      withAuth: true,
      withTenant: true,
      body: {
        storage_key: presigned.storage_key,
        mime_type: file.type,
        size_bytes: file.size,
        title: file.name,
        is_primary: false,
        position,
      },
    }
  );
};

/** Upload several files, continuing the existing numbering. */
export const uploadCertificateFiles = async (
  animalId: string,
  files: File[]
): Promise<CertificateFile[]> => {
  let existing: CertificateFile[] = [];
  try {
    existing = await listCertificateFiles(animalId);
  } catch {
    existing = [];
  }
  const nextPosition =
    existing.length > 0 ? Math.max(...existing.map((f) => f.position)) + 1 : 0;

  const uploaded: CertificateFile[] = [];
  for (let i = 0; i < files.length; i++) {
    uploaded.push(
      await uploadCertificateFile(animalId, files[i], nextPosition + i)
    );
  }
  return uploaded;
};
