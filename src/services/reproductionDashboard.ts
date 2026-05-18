import { apiFetch } from "./client";

export interface ReproductiveStatusBreakdown {
  pregnant: number;
  open: number;
  pending: number;
  lost: number;
}

export interface ServicesDistribution {
  one_service: number;
  two_services: number;
  three_plus_services: number;
}

export interface MonthlyActivity {
  month: string;
  straws_used: number;
  cows_inseminated: number;
}

export interface MonthlyTrend {
  month: string;
  conception_rate: number;
  insemination_count: number;
  services_per_cow: number;
}

export interface PostpartumAlert {
  animal_id: string;
  animal_tag: string;
  animal_name: string | null;
  calving_date: string;
  days_postpartum: number;
  alert_level: "optimal" | "warning" | "critical";
}

export interface ReproductionPreviousPeriod {
  cows_inseminated: number;
  straws_used: number;
  services_per_cow: number;
  pregnant_pct: number;
  open_pct: number;
  pending_pct: number;
  conception_rate: number;
}

export interface ReproductionKPIsResponse {
  cows_inseminated: number;
  straws_used: number;
  services_per_cow: number;
  pregnant_pct: number;
  open_pct: number;
  pending_pct: number;
  conception_rate: number;
  status_breakdown: ReproductiveStatusBreakdown;
  services_distribution: ServicesDistribution;
  monthly_activity: MonthlyActivity[];
  monthly_trends: MonthlyTrend[];
  postpartum_alerts: PostpartumAlert[];
  previous_period: ReproductionPreviousPeriod | null;
}

export type ReproductiveBucket =
  | "alertas"
  | "inseminadas"
  | "prenadas"
  | "vacias"
  | "sin_inseminar"
  | "todas";

export interface ReproductiveAnimalRow {
  animal_id: string;
  tag: string;
  name: string | null;
  days_postpartum: number | null;
  last_calving_date: string | null;
  alert_level: "optimal" | "warning" | "critical" | "none";
  bucket: "prenadas" | "inseminadas" | "vacias" | "sin_inseminar";
  situation_label: string;
  last_event_type: "calving" | "insemination" | "check" | null;
  last_event_date: string | null;
  last_insemination_id: string | null;
  last_insemination_status: "PENDING" | "CONFIRMED" | "OPEN" | "LOST" | null;
}

export interface BucketCounts {
  alertas: number;
  inseminadas: number;
  prenadas: number;
  vacias: number;
  sin_inseminar: number;
  todas: number;
}

export interface ReproductiveAnimalsResponse {
  items: ReproductiveAnimalRow[];
  total: number;
  bucket_counts: BucketCounts;
  limit: number;
  offset: number;
}

export async function listReproductiveAnimals(params: {
  filter?: ReproductiveBucket;
  sort?: "postpartum" | "tag" | "name";
  sort_dir?: "asc" | "desc";
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiFetch<ReproductiveAnimalsResponse>(
    "/api/v1/dashboard/reproductive-animals",
    {
      withAuth: true,
      withTenant: true,
      query: {
        filter: params.filter,
        sort: params.sort,
        sort_dir: params.sort_dir,
        search: params.search,
        limit: params.limit,
        offset: params.offset,
      },
    }
  );
}

export async function getReproductionKPIs(dateFrom: string, dateTo: string) {
  return apiFetch<ReproductionKPIsResponse>(
    "/api/v1/dashboard/reproduction-kpis",
    {
      withAuth: true,
      withTenant: true,
      query: {
        date_from: dateFrom,
        date_to: dateTo,
      },
    }
  );
}
