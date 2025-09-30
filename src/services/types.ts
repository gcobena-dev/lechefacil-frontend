// Types aligned with backend responses (subset)

export type UUID = string;

export interface Membership {
  tenant_id: UUID;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: UUID;
  email: string;
  must_change_password: boolean;
  memberships: Membership[];
}

export interface MeResponse {
  user_id: UUID;
  email: string;
  active_tenant: UUID;
  active_role: 'ADMIN' | 'WORKER' | 'VET' | 'MANAGER' | 'VETERINARIAN';
  memberships: Membership[];
  claims: Record<string, unknown>;
}

export interface AnimalResponse {
  id: UUID;
  tenant_id: UUID;
  tag: string;
  name: string | null;
  breed: string | null;
  breed_variant?: string | null;
  breed_id?: UUID | null;
  birth_date: string | null; // date
  lot: string | null;
  lot_id?: UUID | null;
  status_id?: UUID | null;
  status_code?: string | null;
  status?: string | null; // localized name
  status_desc?: string | null; // localized description
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  version: number;
  primary_photo_url?: string | null;
  photos_count?: number | null;
}

export interface AnimalsListResponse {
  items: AnimalResponse[];
  next_cursor?: string | null;
}

export interface AnimalStatusResponse {
  id: UUID;
  code: string;
  name: string;
  description: string;
  is_system_default: boolean;
}

export interface BuyerResponse {
  id: UUID;
  name: string;
  code?: string | null;
  contact?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MilkPriceResponse {
  id: UUID;
  date: string; // date
  price_per_l: string; // decimal as string
  currency: string;
  buyer_id?: UUID | null;
  created_at: string;
  updated_at: string;
}

export interface MilkDeliveryResponse {
  id: UUID;
  date_time: string; // ISO datetime
  volume_l: number;
  buyer_id: UUID;
  buyer_name?: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnimalPhotoUploadResponse {
  upload_url: string;
  storage_key: string;
  fields: {
    'Content-Type': string;
    key: string;
    AWSAccessKeyId: string;
    policy: string;
    signature: string;
  };
}

export interface AnimalPhotoResponse {
  id: UUID;
  animal_id: UUID;
  storage_key: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  title?: string | null;
  description?: string | null;
  is_primary: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}
