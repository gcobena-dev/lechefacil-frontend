import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listSires,
  getSire,
  createSire,
  updateSire,
  deleteSire,
  getSirePerformance,
  type CreateSirePayload,
  type UpdateSirePayload,
} from "@/services/sireCatalog";
import {
  listSemenStock,
  createSemenStock,
  updateSemenStock,
  deleteSemenStock,
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
  type CreateInseminationPayload,
  type PregnancyCheckPayload,
} from "@/services/inseminations";

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

export function useCreateSire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSirePayload) => createSire(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sires"] });
    },
  });
}

export function useUpdateSire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSirePayload }) =>
      updateSire(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sires"] });
    },
  });
}

export function useDeleteSire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSire(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sires"] });
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

export function useCreateSemenStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSemenStockPayload) => createSemenStock(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["semen-stock"] });
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
      qc.invalidateQueries({ queryKey: ["semen-stock"] });
    },
  });
}

export function useDeleteSemenStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSemenStock(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["semen-stock"] });
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
      qc.invalidateQueries({ queryKey: ["inseminations"] });
      qc.invalidateQueries({ queryKey: ["semen-stock"] });
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
      payload: { technician?: string; notes?: string; heat_detected?: boolean; protocol?: string };
    }) => updateInsemination(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inseminations"] });
    },
  });
}

export function useDeleteInsemination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInsemination(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inseminations"] });
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
      qc.invalidateQueries({ queryKey: ["inseminations"] });
      qc.invalidateQueries({ queryKey: ["pending-checks"] });
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
