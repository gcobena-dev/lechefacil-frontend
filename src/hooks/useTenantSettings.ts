import { useQuery } from '@tanstack/react-query';
import { getTenantSettings, type TenantSettings } from '@/services/tenantSettings';

export function useTenantSettings() {
  return useQuery<TenantSettings>({
    queryKey: ['tenant', 'settings'],
    queryFn: getTenantSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes - settings don't change often
  });
}