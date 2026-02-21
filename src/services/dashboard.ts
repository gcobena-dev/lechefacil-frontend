import { apiFetch } from "./client";

// Types for Dashboard API responses
export interface DailyKPIs {
  date: string;
  total_liters: number;
  total_revenue: number;
  average_per_animal: number;
  active_animals_count: number;
  trends: {
    liters_vs_yesterday: string;
    revenue_vs_yesterday: string;
    average_vs_yesterday: string;
  };
}

export interface TopProducer {
  animal_id: string;
  name: string;
  tag: string;
  today_liters: number;
  trend: "up" | "down" | "stable";
  trend_percentage: string;
  primary_photo_url?: string | null;
  primary_photo_signed_url?: string | null;
  photos?: Array<{
    url?: string | null;
    signed_url?: string | null;
    is_primary?: boolean;
  }> | null;
}

export interface TopProducersResponse {
  top_producers: TopProducer[];
}

export interface DailyProgress {
  date: string;
  shifts: {
    morning: {
      status: "completed" | "in_progress" | "pending";
      completed_at: string | null;
      scheduled_at: string;
      liters: number;
    };
    evening: {
      status: "completed" | "in_progress" | "pending";
      completed_at: string | null;
      scheduled_at: string;
      liters: number;
    };
  };
  daily_goal: {
    target_liters: number;
    current_liters: number;
    completion_percentage: number;
  };
}

export interface Alert {
  id: string;
  type: "health" | "production" | "price";
  message: string;
  priority: "high" | "medium" | "low";
  animal_id?: string;
  created_at: string;
}

export interface AlertsResponse {
  alerts: Alert[];
}

export interface WorkerProgress {
  today_progress: {
    animals_milked: number;
    total_animals_assigned: number;
    liters_recorded: number;
    current_shift: "AM" | "PM";
    shift_start_time: string;
  };
}

export interface UrgentAlert {
  animal_id: string;
  animal_name: string;
  animal_tag: string;
  alert_type: string;
  message: string;
  details: string;
  priority: "high" | "medium" | "low";
}

export interface VetAlerts {
  health_summary: {
    animals_in_treatment: number;
    active_milk_withdrawals: number;
    upcoming_vaccinations: number;
  };
  urgent_alerts: UrgentAlert[];
}

export interface AdminOverview {
  management_overview: {
    monthly_profitability: string;
    production_vs_goal: string;
    pending_alerts: number;
    upcoming_tasks: number;
  };
}

// Dashboard API service functions
export async function getDailyKPIs(date: string): Promise<DailyKPIs> {
  return apiFetch<DailyKPIs>(`/api/v1/dashboard/daily-kpis`, {
    method: "GET",
    query: { date },
    withAuth: true,
    withTenant: true,
  });
}

export async function getTopProducers(
  date: string,
  limit: number = 5
): Promise<TopProducersResponse> {
  return apiFetch<TopProducersResponse>(`/api/v1/dashboard/top-producers`, {
    method: "GET",
    query: { date, limit },
    withAuth: true,
    withTenant: true,
  });
}

export async function getDailyProgress(date: string): Promise<DailyProgress> {
  return apiFetch<DailyProgress>(`/api/v1/dashboard/daily-progress`, {
    method: "GET",
    query: { date },
    withAuth: true,
    withTenant: true,
  });
}

export async function getAlerts(
  priority: string = "all"
): Promise<AlertsResponse> {
  return apiFetch<AlertsResponse>(`/api/v1/dashboard/alerts`, {
    method: "GET",
    query: { priority },
    withAuth: true,
    withTenant: true,
  });
}

export async function getWorkerProgress(
  userId: string,
  date: string
): Promise<WorkerProgress> {
  return apiFetch<WorkerProgress>(`/api/v1/dashboard/worker-progress`, {
    method: "GET",
    query: { user_id: userId, date },
    withAuth: true,
    withTenant: true,
  });
}

export async function getVetAlerts(date: string): Promise<VetAlerts> {
  return apiFetch<VetAlerts>(`/api/v1/dashboard/vet-alerts`, {
    method: "GET",
    query: { date },
    withAuth: true,
    withTenant: true,
  });
}

export async function getAdminOverview(date: string): Promise<AdminOverview> {
  return apiFetch<AdminOverview>(`/api/v1/dashboard/admin-overview`, {
    method: "GET",
    query: { date },
    withAuth: true,
    withTenant: true,
  });
}
