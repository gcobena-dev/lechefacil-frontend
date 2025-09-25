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
  birth_date: string | null; // date
  lot: string | null;
  status: string;
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

