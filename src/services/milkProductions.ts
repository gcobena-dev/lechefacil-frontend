import { apiFetch } from "./client";

export interface MilkProductionItem {
  id: string;
  animal_id?: string | null;
  buyer_id?: string | null;
  date_time: string;
  shift: string;
  input_unit: string;
  input_quantity: string; // decimal
  density: string; // decimal
  volume_l: string; // decimal
  price_snapshot?: string | null;
  currency: string;
  amount?: string | null;
  notes?: string | null;
  version: number;
}

export interface MilkProductionListResponse {
  items: MilkProductionItem[];
  total: number;
  limit: number;
  offset: number;
}

export async function listMilkProductions(params: {
  date_from?: string;
  date_to?: string;
  animal_id?: string;
  order_by?: "recent" | "volume" | "name" | "code";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}) {
  // Backward-compatible helper that returns only items
  const resp = await apiFetch<MilkProductionListResponse>(
    "/api/v1/milk-productions/",
    {
      withAuth: true,
      withTenant: true,
      query: {
        date_from: params.date_from,
        date_to: params.date_to,
        animal_id: params.animal_id,
        order_by: params.order_by,
        order: params.order,
        limit: params.limit,
        offset: params.offset,
      },
    }
  );
  return resp.items;
}

export async function createMilkProduction(payload: {
  date?: string; // YYYY-MM-DD
  shift?: "AM" | "PM";
  date_time?: string; // ISO
  animal_id: string;
  input_unit: "l" | "kg" | "lb";
  input_quantity: number | string;
  density?: number | string | null;
  buyer_id?: string | null;
  notes?: string | null;
}) {
  return apiFetch<MilkProductionItem>("/api/v1/milk-productions/", {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function createMilkProductionsBulk(payload: {
  date?: string; // YYYY-MM-DD
  shift?: "AM" | "PM";
  date_time?: string; // ISO
  input_unit?: "l" | "kg" | "lb";
  density?: number | string | null;
  buyer_id?: string | null;
  notes?: string | null;
  items: { animal_id: string; input_quantity: number | string }[];
}) {
  return apiFetch<MilkProductionItem[]>("/api/v1/milk-productions/bulk", {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function updateMilkProduction(
  id: string,
  payload: { version: number; input_quantity?: string; notes?: string }
) {
  return apiFetch<MilkProductionItem>(`/api/v1/milk-productions/${id}`, {
    method: "PUT",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}

export async function listMilkProductionsPaginated(params: {
  date_from?: string;
  date_to?: string;
  animal_id?: string;
  limit?: number;
  offset?: number;
}) {
  return apiFetch<MilkProductionListResponse>("/api/v1/milk-productions/", {
    withAuth: true,
    withTenant: true,
    query: {
      date_from: params.date_from,
      date_to: params.date_to,
      animal_id: params.animal_id,
      limit: params.limit,
      offset: params.offset,
    },
  });
}

// OCR endpoints
export interface PresignUploadResponse {
  upload_url: string;
  storage_key: string;
  fields?: Record<string, string>;
}

export interface OcrMatchedResult {
  animal_id: string;
  animal_name: string;
  animal_tag: string;
  liters: number;
  match_confidence: number;
  extracted_name: string;
}

export interface OcrUnmatchedResult {
  extracted_name: string;
  liters: number;
  suggestions?: Array<{
    animal_id: string;
    name: string;
    similarity: number;
  }>;
}

export interface ProcessOcrResponse {
  image_url: string;
  attachment_id: string;
  matched: OcrMatchedResult[];
  unmatched: OcrUnmatchedResult[];
  total_extracted: number;
}

export async function getOcrUploadUrl(contentType: string) {
  return apiFetch<PresignUploadResponse>(
    "/api/v1/milk-productions/ocr/uploads",
    {
      method: "POST",
      withAuth: true,
      withTenant: true,
      body: {
        content_type: contentType,
      },
    }
  );
}

export async function uploadToS3(
  presignedData: PresignUploadResponse,
  file: File
) {
  const formData = new FormData();

  // Add fields if present (for some S3 configurations)
  if (presignedData.fields) {
    Object.entries(presignedData.fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  formData.append("file", file);

  const response = await fetch(presignedData.upload_url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.statusText}`);
  }

  return presignedData.storage_key;
}

export async function processOcrImage(payload: {
  storage_key: string;
  mime_type: string;
  size_bytes: number;
}) {
  return apiFetch<ProcessOcrResponse>("/api/v1/milk-productions/ocr/process", {
    method: "POST",
    withAuth: true,
    withTenant: true,
    body: payload,
  });
}
