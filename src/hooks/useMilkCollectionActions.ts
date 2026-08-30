import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import {
  createMilkProduction,
  createMilkProductionsBulk,
  type CreateMilkProductionPayload,
  type CreateMilkProductionsBulkPayload,
} from "@/services/milkProductions";
import {
  createMilkDelivery,
  type CreateMilkDeliveryPayload,
} from "@/services/milkDeliveries";
import { isNetworkError } from "@/services/client";
import { getConnectivityState } from "@/services/connectivity";
import {
  enqueue,
  getPendingProductionEntries,
  type OutboxMeta,
} from "@/services/outbox";
import { convertToLiters } from "@/lib/mock-data";
import { uuid } from "@/utils/uuid";
import type {
  MilkCollectionFormData,
  DeliveryFormData,
} from "./useMilkCollectionForm";
import {
  formatLocalDateShort,
  formatLocalTime,
  toLocalOffsetISO,
} from "@/utils/dateUtils";

const UNIT_MAP: Record<string, "l" | "kg" | "lb"> = {
  L: "l",
  KG: "kg",
  LB: "lb",
};

export function useMilkCollectionActions(
  formData: MilkCollectionFormData,
  deliveryFormData: DeliveryFormData,
  selectedAnimals: string[],
  animalQuantities: Record<string, string>,
  deliveryDateFrom: string,
  animals: Array<{ id: string; name?: string | null; tag?: string | null }>,
  resetProductionForm: () => void,
  resetDeliveryForm: () => void,
  onBulkConflicts?: (payload: { header: string; lines: string[] }) => void,
  onBulkSuccess?: () => void
) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutateAsync: doCreate, isPending: creating } = useMutation({
    mutationFn: (payload: CreateMilkProductionPayload) =>
      createMilkProduction(payload),
  });

  const { mutateAsync: doCreateBulk, isPending: creatingBulk } = useMutation({
    mutationFn: (payload: CreateMilkProductionsBulkPayload) =>
      createMilkProductionsBulk(payload),
  });

  const { mutateAsync: doCreateDelivery, isPending: creatingDelivery } =
    useMutation({
      mutationFn: (payload: CreateMilkDeliveryPayload) =>
        createMilkDelivery(payload),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["milk-deliveries", deliveryDateFrom],
        });
        resetDeliveryForm();
      },
    });

  /**
   * Saves the record on the device so the milking is never lost, and tells the
   * user plainly that it is stored but not sent yet.
   */
  const queueOffline = async (
    kind: "production.create" | "production.bulk" | "delivery.create",
    payload: Record<string, unknown>,
    meta: OutboxMeta,
    description: string
  ) => {
    await enqueue({ id: payload.client_request_id as string, kind, payload, meta });
    toast({
      title: t("offline.savedOnDevice"),
      description,
    });
  };

  /**
   * The same rule the server enforces, applied to what is still on the device:
   * without it a farmer with no signal could register the same cow twice and
   * only find out at sync time.
   */
  const findPendingDuplicates = (animalIds: string[]): string[] => {
    const pending = getPendingProductionEntries(
      formData.date,
      formData.shift as "AM" | "PM"
    );
    const pendingIds = new Set(pending.map((p) => p.animalId));
    return animalIds.filter((id) => pendingIds.has(id));
  };

  const nameOf = (id: string) => {
    const a = animals.find((x) => x.id === id);
    return a ? `${a.name ?? ""} (${a.tag ?? ""})`.trim() : id;
  };

  const handleSingleSubmit = async () => {
    // Disallow future dates
    const todayStr = new Date().toISOString().split("T")[0];
    if (formData.date > todayStr) {
      toast({
        title: t("common.error"),
        description: t("common.futureDateNotAllowed"),
        variant: "destructive",
      });
      return;
    }
    if (!formData.animalId || !formData.inputValue) {
      toast({
        title: t("common.error"),
        description: t("common.completeRequiredFields"),
        variant: "destructive",
      });
      return;
    }

    const dupes = findPendingDuplicates([formData.animalId]);
    if (dupes.length > 0) {
      toast({
        title: t("common.error"),
        description: t("offline.alreadyQueued", { animal: nameOf(dupes[0]) }),
        variant: "destructive",
      });
      return;
    }

    const calculatedLiters = convertToLiters(
      parseFloat(formData.inputValue),
      formData.inputUnit as any,
      parseFloat(formData.density)
    );

    const payload = {
      client_request_id: uuid(),
      date: formData.date,
      shift: formData.shift as "AM" | "PM",
      animal_id: formData.animalId,
      input_unit: UNIT_MAP[formData.inputUnit as keyof typeof UNIT_MAP] ?? "l",
      input_quantity: parseFloat(formData.inputValue),
      density: parseFloat(formData.density),
      buyer_id: formData.buyerId || null,
      notes: formData.notes || null,
    };
    const meta: OutboxMeta = {
      date: formData.date,
      shift: formData.shift as "AM" | "PM",
      buyerId: formData.buyerId || null,
      totalVolumeL: calculatedLiters,
      entries: [
        {
          animalId: formData.animalId,
          inputQuantity: parseFloat(formData.inputValue),
          volumeL: calculatedLiters,
        },
      ],
    };

    // Known to be offline: skip the doomed request and queue straight away.
    if (!getConnectivityState().online) {
      await queueOffline(
        "production.create",
        payload,
        meta,
        `${calculatedLiters.toFixed(1)}L · ${nameOf(formData.animalId)}`
      );
      resetProductionForm();
      return;
    }

    try {
      await doCreate(payload);

      await queryClient.invalidateQueries({
        queryKey: ["milk-productions", formData.date],
      });
      toast({
        title: t("common.recordSuccessful"),
        description: `${calculatedLiters.toFixed(1)}L registrados`,
      });
      resetProductionForm();
    } catch (err: any) {
      // The connection dropped between the check and the send: queue it rather
      // than making the user retype the milking.
      if (isNetworkError(err)) {
        await queueOffline(
          "production.create",
          payload,
          meta,
          `${calculatedLiters.toFixed(1)}L · ${nameOf(formData.animalId)}`
        );
        resetProductionForm();
        return;
      }
      console.error(err);
      toast({
        title: t("common.error"),
        description:
          err?.details?.message || t("common.recordError") + " la producción",
        variant: "destructive",
      });
    }
  };

  const handleBulkSubmit = async () => {
    // Disallow future dates
    const todayStr = new Date().toISOString().split("T")[0];
    if (formData.date > todayStr) {
      toast({
        title: t("common.error"),
        description: t("common.futureDateNotAllowed"),
        variant: "destructive",
      });
      return;
    }
    const animalsWithQuantities = selectedAnimals.filter(
      (animalId) => animalQuantities[animalId]
    );

    if (animalsWithQuantities.length === 0) {
      toast({
        title: t("common.error"),
        description: t("common.enterQuantityAtLeast"),
        variant: "destructive",
      });
      return;
    }

    const dupes = findPendingDuplicates(animalsWithQuantities);
    if (dupes.length > 0) {
      toast({
        title: t("common.error"),
        description: t("offline.alreadyQueuedMany", {
          count: dupes.length,
          animals: dupes.slice(0, 3).map(nameOf).join(", "),
        }),
        variant: "destructive",
      });
      return;
    }

    const litersOf = (quantity: string) =>
      convertToLiters(
        parseFloat(quantity),
        formData.inputUnit as any,
        parseFloat(formData.density)
      );
    const bulkCalculatedTotal = animalsWithQuantities.reduce(
      (sum, id) => sum + litersOf(animalQuantities[id]),
      0
    );

    const opId = uuid();
    const payload = {
      client_request_id: opId,
      date: formData.date,
      shift: formData.shift as "AM" | "PM",
      input_unit: UNIT_MAP[formData.inputUnit as keyof typeof UNIT_MAP] ?? "l",
      density: parseFloat(formData.density),
      buyer_id: formData.buyerId || null,
      notes: formData.notes || null,
      items: animalsWithQuantities.map((animal_id) => ({
        animal_id,
        input_quantity: parseFloat(animalQuantities[animal_id]),
        // Per-row id: a partially applied batch resumes exactly where it stopped.
        client_request_id: uuid(),
      })),
    };
    const meta: OutboxMeta = {
      date: formData.date,
      shift: formData.shift as "AM" | "PM",
      buyerId: formData.buyerId || null,
      totalVolumeL: bulkCalculatedTotal,
      entries: animalsWithQuantities.map((animalId) => ({
        animalId,
        inputQuantity: parseFloat(animalQuantities[animalId]),
        volumeL: litersOf(animalQuantities[animalId]),
      })),
    };

    if (!getConnectivityState().online) {
      await queueOffline(
        "production.bulk",
        // Queued batches skip rows the server already has instead of aborting.
        { ...payload, on_conflict: "skip" },
        meta,
        `${bulkCalculatedTotal.toFixed(1)}L · ${animalsWithQuantities.length} ${t(
          "milk.animals"
        )}`
      );
      resetProductionForm();
      onBulkSuccess?.();
      return;
    }

    try {
      await doCreateBulk(payload);

      await queryClient.invalidateQueries({
        queryKey: ["milk-productions", formData.date],
      });
      toast({
        title: t("common.bulkRecordSuccessful"),
        description: `${bulkCalculatedTotal.toFixed(1)}L ${t(
          "milk.recordedFor"
        )} ${animalsWithQuantities.length} ${t("milk.animals")}`,
      });

      // Clear quantities but keep selection for next shift
      resetProductionForm();
      // Notify UI to clear OCR widget/cards
      onBulkSuccess?.();
    } catch (err: any) {
      if (isNetworkError(err)) {
        await queueOffline(
          "production.bulk",
          { ...payload, on_conflict: "skip" },
          meta,
          `${bulkCalculatedTotal.toFixed(1)}L · ${animalsWithQuantities.length} ${t(
            "milk.animals"
          )}`
        );
        resetProductionForm();
        onBulkSuccess?.();
        return;
      }

      console.error("Bulk submission error:", err);

      // Check if this is a validation error with conflicts
      // The error structure from API client is: err.details.code and err.details.details.conflicts
      if (
        err?.details?.code === "validation_error" &&
        err?.details?.details?.conflicts
      ) {
        const conflicts = err.details.details.conflicts as Array<{
          animal_id: string;
          date: string;
          shift: string;
          input_quantity: string;
          existing_date_time?: string;
          existing_volume_l?: string;
        }>;

        const lines = conflicts.map((c) => {
          const animalName = nameOf(c.animal_id);
          const existingTime = c.existing_date_time
            ? `${formatLocalDateShort(c.existing_date_time)} ${formatLocalTime(
                c.existing_date_time
              )}`
            : `${c.shift} ${c.date}`;
          const existingVolume = c.existing_volume_l
            ? `${parseFloat(c.existing_volume_l).toFixed(1)}L`
            : "";

          return `${animalName}: Intentando registrar ${c.input_quantity} pero ya existe ${existingVolume} del ${existingTime}`;
        });

        // Always use popup for validation conflicts if callback is available
        if (onBulkConflicts) {
          onBulkConflicts({
            header: err.details.message || t("milk.bulkConflictsHeader"),
            lines,
          });
          return; // Don't show toast
        }
      }

      // For any other errors or if no callback available, use toast
      toast({
        title: t("common.error"),
        description:
          err?.message ||
          err?.details?.message ||
          t("common.recordError") + " el bulk",
        variant: "destructive",
      });
    }
  };

  const handleDeliverySubmit = async () => {
    // Disallow future datetime
    const now = new Date();
    const dt = new Date(deliveryFormData.dateTime);
    if (dt.getTime() > now.getTime()) {
      toast({
        title: t("common.error"),
        description: t("common.futureDateNotAllowed"),
        variant: "destructive",
      });
      return;
    }
    if (!deliveryFormData.buyerId || !deliveryFormData.volumeL) {
      toast({
        title: t("common.error"),
        description: t("common.completeRequiredFields"),
        variant: "destructive",
      });
      return;
    }

    const volumeL = parseFloat(deliveryFormData.volumeL);
    const payload = {
      client_request_id: uuid(),
      date_time: toLocalOffsetISO(new Date(deliveryFormData.dateTime)),
      volume_l: volumeL,
      buyer_id: deliveryFormData.buyerId,
      notes: deliveryFormData.notes || undefined,
    };
    const meta: OutboxMeta = {
      buyerId: deliveryFormData.buyerId,
      totalVolumeL: volumeL,
    };

    if (!getConnectivityState().online) {
      await queueOffline(
        "delivery.create",
        payload,
        meta,
        `${volumeL.toFixed(1)}L · ${t("milk.delivery")}`
      );
      resetDeliveryForm();
      return;
    }

    try {
      await doCreateDelivery(payload);
      toast({
        title: t("common.success"),
        description: t("milk.deliverMilk") + " registrada correctamente",
      });
    } catch (error: any) {
      if (isNetworkError(error)) {
        await queueOffline(
          "delivery.create",
          payload,
          meta,
          `${volumeL.toFixed(1)}L · ${t("milk.delivery")}`
        );
        resetDeliveryForm();
        return;
      }
      toast({
        title: t("common.error"),
        description:
          error?.details?.message ||
          t("common.registrationError") + " la entrega",
        variant: "destructive",
      });
    }
  };

  return {
    handleSingleSubmit,
    handleBulkSubmit,
    handleDeliverySubmit,
    creating,
    creatingBulk,
    creatingDelivery,
  };
}
