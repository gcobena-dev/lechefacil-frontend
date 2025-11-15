import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { createMilkProduction, createMilkProductionsBulk } from "@/services/milkProductions";
import { createMilkDelivery } from "@/services/milkDeliveries";
import { convertToLiters } from "@/lib/mock-data";
import type { MilkCollectionFormData, DeliveryFormData } from "./useMilkCollectionForm";
import { formatLocalDateShort, formatLocalTime, toLocalOffsetISO } from "@/utils/dateUtils";

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
    mutationFn: createMilkProduction,
  });

  const { mutateAsync: doCreateBulk, isPending: creatingBulk } = useMutation({
    mutationFn: createMilkProductionsBulk,
  });

  const { mutateAsync: doCreateDelivery, isPending: creatingDelivery } = useMutation({
    mutationFn: createMilkDelivery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milk-deliveries", deliveryDateFrom] });
      resetDeliveryForm();
    },
  });

  const handleSingleSubmit = async () => {
    // Disallow future dates
    const todayStr = new Date().toISOString().split('T')[0];
    if (formData.date > todayStr) {
      toast({ title: t("common.error"), description: t("common.futureDateNotAllowed"), variant: "destructive" });
      return;
    }
    if (!formData.animalId || !formData.inputValue) {
      toast({
        title: t("common.error"),
        description: t("common.completeRequiredFields"),
        variant: "destructive"
      });
      return;
    }

    const unitMap: Record<string, 'l' | 'kg' | 'lb'> = { L: 'l', KG: 'kg', LB: 'lb' };
    const calculatedLiters = convertToLiters(parseFloat(formData.inputValue), formData.inputUnit as any, parseFloat(formData.density));

    try {
      // Build a local datetime for the selected date using current local time
      const now = new Date();
      const [y, m, d] = formData.date.split('-').map(Number);
      const localDt = new Date(y, (m || 1) - 1, d || now.getDate(), now.getHours(), now.getMinutes());

      await doCreate({
        date: formData.date,
        shift: formData.shift as 'AM' | 'PM',
        animal_id: formData.animalId,
        input_unit: unitMap[formData.inputUnit as keyof typeof unitMap] ?? 'l',
        input_quantity: parseFloat(formData.inputValue),
        density: parseFloat(formData.density),
        buyer_id: formData.buyerId || null,
        notes: formData.notes || null,
      });

      await queryClient.invalidateQueries({ queryKey: ["milk-productions", formData.date] });
      toast({ title: t("common.recordSuccessful"), description: `${calculatedLiters.toFixed(1)}L registrados` });
      resetProductionForm();
    } catch (err: any) {
      console.error(err);
      toast({ title: t("common.error"), description: err?.details?.message || (t("common.recordError") + " la producción"), variant: "destructive" });
    }
  };

  const handleBulkSubmit = async () => {
    // Disallow future dates
    const todayStr = new Date().toISOString().split('T')[0];
    if (formData.date > todayStr) {
      toast({ title: t("common.error"), description: t("common.futureDateNotAllowed"), variant: "destructive" });
      return;
    }
    const animalsWithQuantities = selectedAnimals.filter(animalId => animalQuantities[animalId]);

    if (animalsWithQuantities.length === 0) {
      toast({
        title: t("common.error"),
        description: t("common.enterQuantityAtLeast"),
        variant: "destructive"
      });
      return;
    }

    const unitMap: Record<string, 'l' | 'kg' | 'lb'> = { L: 'l', KG: 'kg', LB: 'lb' };
    const bulkCalculatedTotal = Object.values(animalQuantities).reduce((sum, quantity) => {
      return sum + (quantity ? convertToLiters(parseFloat(quantity), formData.inputUnit as any, parseFloat(formData.density)) : 0);
    }, 0);

    try {
      const now = new Date();
      const [y, m, d] = formData.date.split('-').map(Number);
      const localDt = new Date(y, (m || 1) - 1, d || now.getDate(), now.getHours(), now.getMinutes());

      await doCreateBulk({
        date: formData.date,
        shift: formData.shift as 'AM' | 'PM',
        input_unit: unitMap[formData.inputUnit as keyof typeof unitMap] ?? 'l',
        density: parseFloat(formData.density),
        buyer_id: formData.buyerId || null,
        notes: formData.notes || null,
        items: animalsWithQuantities.map((animal_id) => ({
          animal_id,
          input_quantity: parseFloat(animalQuantities[animal_id]),
        })),
      });

      await queryClient.invalidateQueries({ queryKey: ["milk-productions", formData.date] });
      toast({
        title: t("common.bulkRecordSuccessful"),
        description: `${bulkCalculatedTotal.toFixed(1)}L ${t("milk.recordedFor")} ${animalsWithQuantities.length} ${t("milk.animals")}`,
      });

      // Clear quantities but keep selection for next shift
      resetProductionForm();
      // Notify UI to clear OCR widget/cards
      onBulkSuccess?.();
    } catch (err: any) {
      console.error("Bulk submission error:", err);

      // Check if this is a validation error with conflicts
      // The error structure from API client is: err.details.code and err.details.details.conflicts
      if (err?.details?.code === "validation_error" && err?.details?.details?.conflicts) {
        const conflicts = err.details.details.conflicts as Array<{
          animal_id: string;
          date: string;
          shift: string;
          input_quantity: string;
          existing_date_time?: string;
          existing_volume_l?: string;
        }>;

        const nameOf = (id: string) => {
          const a = animals.find(x => x.id === id);
          return a ? `${a.name ?? ''} (${a.tag ?? ''})`.trim() : id;
        };

        const lines = conflicts.map(c => {
          const animalName = nameOf(c.animal_id);
          const existingTime = c.existing_date_time
            ? `${formatLocalDateShort(c.existing_date_time)} ${formatLocalTime(c.existing_date_time)}`
            : `${c.shift} ${c.date}`;
          const existingVolume = c.existing_volume_l ? `${parseFloat(c.existing_volume_l).toFixed(1)}L` : '';

          return `${animalName}: Intentando registrar ${c.input_quantity} pero ya existe ${existingVolume} del ${existingTime}`;
        });

        // Always use popup for validation conflicts if callback is available
        if (onBulkConflicts) {
          onBulkConflicts({
            header: err.details.message || t("milk.bulkConflictsHeader"),
            lines
          });
          return; // Don't show toast
        }
      }

      // For any other errors or if no callback available, use toast
      toast({
        title: t("common.error"),
        description: err?.message || err?.details?.message || (t("common.recordError") + " el bulk"),
        variant: "destructive"
      });
    }
  };

  const handleDeliverySubmit = async () => {
    // Disallow future datetime
    const now = new Date();
    const dt = new Date(deliveryFormData.dateTime);
    if (dt.getTime() > now.getTime()) {
      toast({ title: t("common.error"), description: t("common.futureDateNotAllowed"), variant: "destructive" });
      return;
    }
    if (!deliveryFormData.buyerId || !deliveryFormData.volumeL) {
      toast({
        title: t("common.error"),
        description: t("common.completeRequiredFields"),
        variant: "destructive"
      });
      return;
    }

    try {
      const payload = {
        date_time: toLocalOffsetISO(new Date(deliveryFormData.dateTime)),
        volume_l: parseFloat(deliveryFormData.volumeL),
        buyer_id: deliveryFormData.buyerId,
        notes: deliveryFormData.notes || undefined
      };

      await doCreateDelivery(payload);
      toast({
        title: t("common.success"),
        description: t("milk.deliverMilk") + " registrada correctamente",
      });
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error?.details?.message || t("common.registrationError") + " la entrega",
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
    creatingDelivery
  };
}
