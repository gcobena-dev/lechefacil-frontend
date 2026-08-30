import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listSires,
  getSire,
  createSire,
  updateSire,
  deleteSire,
  getSirePerformance,
  getSirePerformanceSummary,
  type CreateSirePayload,
  type UpdateSirePayload,
} from "@/services/sireCatalog";
import {
  listSemenStock,
  getSemenStock,
  createSemenStock,
  updateSemenStock,
  deleteSemenStock,
  getSemenAutocompleteValues,
  type CreateSemenStockPayload,
  type UpdateSemenStockPayload,
} from "@/services/semenInventory";
import {
  listInseminations,
  createInsemination,
  updateInsemination,
  deleteInsemination,
  recordPregnancyCheck,
  getPendingPregnancyChecks,
  getDistinctTechnicians,
  type CreateInseminationPayload,
  type PregnancyCheckPayload,
} from "@/services/inseminations";
import { invalidateReproductionQueries } from "@/lib/queryInvalidation";

// --- Sires ---

export function useSires(params?: {
  active_only?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["sires", params],
    queryFn: () => listSires(params),
  });
}

export function useSire(id: string | undefined) {
  return useQuery({
    queryKey: ["sires", id],
    queryFn: () => getSire(id!),
    enabled: !!id,
  });
}

export function useSirePerformance(id: string | undefined) {
  return useQuery({
    queryKey: ["sires", id, "performance"],
    queryFn: () => getSirePerformance(id!),
    enabled: !!id,
  });
}

export function useSirePerformanceSummary(params: {
  date_from: string;
  date_to: string;
  include_inactive?: boolean;
}) {
  return useQuery({
    queryKey: ["sires", "performance-summary", params],
    queryFn: () => getSirePerformanceSummary(params),
    enabled: !!params.date_from && !!params.date_to,
  });
}

export function useCreateSire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSirePayload) => createSire(payload),
    onSuccess: () => {
      void invalidateReproductionQueries(qc);
    },
  });
}

export function useUpdateSire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSirePayload }) =>
      updateSire(id, payload),
    onSuccess: () => {
      void invalidateReproductionQueries(qc);
    },
  });
}

export function useDeleteSire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSire(id),
    onSuccess: () => {
      void invalidateReproductionQueries(qc);
    },
  });
}

// --- Semen Inventory ---

export function useSemenStock(params?: {
  sire_catalog_id?: string;
  in_stock_only?: boolean;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["semen-stock", params],
    queryFn: () => listSemenStock(params),
  });
}

export function useSemenStockById(id: string | undefined) {
  return useQuery({
    queryKey: ["semen-stock", "by-id", id],
    queryFn: () => getSemenStock(id!),
    enabled: !!id,
  });
}

export function useCreateSemenStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSemenStockPayload) => createSemenStock(payload),
    onSuccess: () => {
      void invalidateReproductionQueries(qc);
    },
  });
}

export function useUpdateSemenStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSemenStockPayload;
    }) => updateSemenStock(id, payload),
    onSuccess: () => {
      void invalidateReproductionQueries(qc);
    },
  });
}

export function useSemenAutocompleteValues() {
  return useQuery({
    queryKey: ["semen-autocomplete"],
    queryFn: () => getSemenAutocompleteValues(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteSemenStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSemenStock(id),
    onSuccess: () => {
      void invalidateReproductionQueries(qc);
    },
  });
}

// --- Inseminations ---

export function useInseminations(params?: {
  animal_id?: string;
  sire_catalog_id?: string;
  pregnancy_status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_dir?: string;
}) {
  return useQuery({
    queryKey: ["inseminations", params],
    queryFn: () => listInseminations(params),
  });
}

export function useCreateInsemination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInseminationPayload) =>
      createInsemination(payload),
    onSuccess: () => {
      // A service consumes a straw and moves the animal into the
      // reproductive buckets, so stock, lists and dashboards all shift.
      void invalidateReproductionQueries(qc);
    },
  });
}

export function useUpdateInsemination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        service_date?: string;
        technician?: string;
        notes?: string;
        heat_detected?: boolean;
        protocol?: string;
        sire_catalog_id?: string | null;
      };
    }) => updateInsemination(id, payload),
    onSuccess: () => {
      // The service date drives the reproductive buckets and the animal
      // timeline, so those views have to refetch too.
      void invalidateReproductionQueries(qc);
    },
  });
}

export function useDeleteInsemination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInsemination(id),
    onSuccess: () => {
      void invalidateReproductionQueries(qc);
    },
  });
}

export function useRecordPregnancyCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      inseminationId,
      payload,
    }: {
      inseminationId: string;
      payload: PregnancyCheckPayload;
    }) => recordPregnancyCheck(inseminationId, payload),
    onSuccess: () => {
      // A confirmed pregnancy changes the animal's status.
      void invalidateReproductionQueries(qc);
    },
  });
}

export function usePendingPregnancyChecks(params?: {
  min_days?: number;
  max_days?: number;
}) {
  return useQuery({
    queryKey: ["pending-checks", params],
    queryFn: () => getPendingPregnancyChecks(params),
  });
}

export function useTechnicians() {
  return useQuery({
    queryKey: ["insemination-technicians"],
    queryFn: () => getDistinctTechnicians(),
    staleTime: 5 * 60 * 1000,
  });
}
