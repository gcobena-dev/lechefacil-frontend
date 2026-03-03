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
