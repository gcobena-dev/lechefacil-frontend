import { apiFetch } from "./client";

export type EventType =
  | "CALVING"
  | "DRY_OFF"
  | "SALE"
  | "DEATH"
  | "CULL"
  | "SERVICE"
  | "EMBRYO_TRANSFER"
  | "BIRTH"
  | "ABORTION"
  | "TRANSFER";

export interface AnimalEvent {
  id: string;
  tenant_id: string;
  animal_id: string;
  type: EventType;
  occurred_at: string;
  data?: Record<string, any>;
  parent_event_id?: string;
  new_status_id?: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface EventEffects {
  event: AnimalEvent;
  lactation_opened?: string;
  lactation_closed?: string;
  new_status_id?: string;
  new_status_code?: string;
  calf_created?: string;
  parentage_created?: string[];
  disposition_set?: boolean;
  message?: string;
}

export interface AnimalEventListResponse {
  items: AnimalEvent[];
  total: number;
  page: number;
  per_page: number;
}

export interface RegisterEventPayload {
  type: EventType;
  occurred_at: string;
  data?: Record<string, any>;
}

export interface BirthEventData {
  calf_tag: string;
  calf_sex: "MALE" | "FEMALE";
  calf_name?: string;
  birth_weight?: number;
  assisted?: boolean;
  notes?: string;
}

export interface ServiceEventData {
  sire_id?: string;
  external_sire_code?: string;
  external_sire_registry?: string;
  method?: "AI" | "NATURAL" | "ET";
  technician?: string;
  notes?: string;
}

export interface DispositionEventData {
  reason: string;
  buyer?: string;
  price?: number;
  cause?: string;
  notes?: string;
}

/**
 * Register a new event for an animal
 */
export const registerAnimalEvent = async (
  animalId: string,
  payload: RegisterEventPayload
): Promise<EventEffects> => {
  return apiFetch<EventEffects>(`/api/v1/animals/${animalId}/events`, {
    method: "POST",
    body: payload,
    withAuth: true,
    withTenant: true,
  });
};

/**
 * Get the timeline of events for an animal
 */
export const getAnimalEvents = async (
  animalId: string,
  page: number = 1,
  perPage: number = 10
): Promise<AnimalEventListResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  return apiFetch<AnimalEventListResponse>(
    `/api/v1/animals/${animalId}/events?${params.toString()}`,
    {
      method: "GET",
      withAuth: true,
      withTenant: true,
    }
  );
};

/**
 * Helper to get event type label
 */
export const getEventTypeLabel = (type: EventType): string => {
  // Return i18n key to translate in UI components
  const labels: Record<EventType, string> = {
    CALVING: "animals.event.calving",
    DRY_OFF: "animals.event.dryOff",
    SALE: "animals.event.sale",
    DEATH: "animals.event.death",
    CULL: "animals.event.cull",
    SERVICE: "animals.event.service",
    EMBRYO_TRANSFER: "animals.event.embryoTransfer",
    BIRTH: "animals.event.birth",
    ABORTION: "animals.event.abortion",
    TRANSFER: "animals.event.transfer",
  };
  return labels[type] || type;
};

/**
 * Helper to get event type color
 */
export const getEventTypeColor = (type: EventType): string => {
  const colors: Record<EventType, string> = {
    CALVING: "bg-green-100 text-green-800",
    DRY_OFF: "bg-blue-100 text-blue-800",
    SALE: "bg-yellow-100 text-yellow-800",
    DEATH: "bg-red-100 text-red-800",
    CULL: "bg-orange-100 text-orange-800",
    SERVICE: "bg-purple-100 text-purple-800",
    EMBRYO_TRANSFER: "bg-pink-100 text-pink-800",
    BIRTH: "bg-green-100 text-green-800",
    ABORTION: "bg-red-100 text-red-800",
    TRANSFER: "bg-gray-100 text-gray-800",
  };
  return colors[type] || "bg-gray-100 text-gray-800";
};
