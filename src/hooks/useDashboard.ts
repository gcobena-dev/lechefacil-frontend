import { useQuery } from '@tanstack/react-query';
import { getTodayLocalDateString } from '@/utils/dateUtils';
import {
  getDailyKPIs,
  getTopProducers,
  getDailyProgress,
  getAlerts,
  getWorkerProgress,
  getVetAlerts,
  getAdminOverview,
  type DailyKPIs,
  type TopProducersResponse,
  type DailyProgress,
  type AlertsResponse,
  type WorkerProgress,
  type VetAlerts,
  type AdminOverview
} from '@/services/dashboard';

export function useDailyKPIs(date: string) {
  return useQuery<DailyKPIs>({
    queryKey: ['dashboard', 'daily-kpis', date],
    queryFn: () => getDailyKPIs(date),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

export function useTopProducers(date: string, limit: number = 5) {
  return useQuery<TopProducersResponse>({
    queryKey: ['dashboard', 'top-producers', date, limit],
    queryFn: () => getTopProducers(date, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useDailyProgress(date: string) {
  return useQuery<DailyProgress>({
    queryKey: ['dashboard', 'daily-progress', date],
    queryFn: () => getDailyProgress(date),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
}

export function useAlerts(priority: string = 'all') {
  return useQuery<AlertsResponse>({
    queryKey: ['dashboard', 'alerts', priority],
    queryFn: () => getAlerts(priority),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute for alerts
  });
}

export function useWorkerProgress(userId: string, date: string, enabled: boolean = true) {
  return useQuery<WorkerProgress>({
    queryKey: ['dashboard', 'worker-progress', userId, date],
    queryFn: () => getWorkerProgress(userId, date),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    enabled: enabled && !!userId, // Only fetch if enabled and userId is provided
  });
}

export function useVetAlerts(date: string, enabled: boolean = true) {
  return useQuery<VetAlerts>({
    queryKey: ['dashboard', 'vet-alerts', date],
    queryFn: () => getVetAlerts(date),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    enabled: enabled,
  });
}

export function useAdminOverview(date: string, enabled: boolean = true) {
  return useQuery<AdminOverview>({
    queryKey: ['dashboard', 'admin-overview', date],
    queryFn: () => getAdminOverview(date),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: enabled,
  });
}

// Combined hook for dashboard data based on user role
export function useDashboardData(userRole: 'ADMIN' | 'WORKER' | 'VET', userId?: string) {
  const today = getTodayLocalDateString();

  // Common data for all roles
  const dailyKPIs = useDailyKPIs(today);
  const topProducers = useTopProducers(today);
  const dailyProgress = useDailyProgress(today);
  const alerts = useAlerts();

  // Role-specific data - ALWAYS call hooks, but conditionally enable them
  const workerProgress = useWorkerProgress(userId || '', today, userRole === 'WORKER');
  const vetAlerts = useVetAlerts(today, userRole === 'VET');
  const adminOverview = useAdminOverview(today, userRole === 'ADMIN');

  return {
    // Common data
    dailyKPIs,
    topProducers,
    dailyProgress,
    alerts,

    // Role-specific data - now always include the hook result
    workerProgress,
    vetAlerts,
    adminOverview,

    // Loading states
    isLoading: dailyKPIs.isLoading || topProducers.isLoading || dailyProgress.isLoading,

    // Error states
    hasError: dailyKPIs.error || topProducers.error || dailyProgress.error,

    // Combined errors
    errors: {
      dailyKPIs: dailyKPIs.error,
      topProducers: topProducers.error,
      dailyProgress: dailyProgress.error,
      alerts: alerts.error,
      workerProgress: workerProgress.error,
      vetAlerts: vetAlerts.error,
      adminOverview: adminOverview.error,
    }
  };
}