import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { createMilkProduction, createMilkProductionsBulk } from "@/services/milkProductions";
import { createMilkDelivery } from "@/services/milkDeliveries";
import { convertToLiters } from "@/lib/mock-data";
import type { MilkCollectionFormData, DeliveryFormData } from "./useMilkCollectionForm";

export function useMilkCollectionActions(
  formData: MilkCollectionFormData,
  deliveryFormData: DeliveryFormData,
  selectedAnimals: string[],
  animalQuantities: Record<string, string>,
  deliveryDateFrom: string,
  resetProductionForm: () => void,
  resetDeliveryForm: () => void
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
        date_time: localDt.toISOString(),
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
      toast({ title: t("common.error"), description: t("common.recordError") + " la producción", variant: "destructive" });
    }
  };

  const handleBulkSubmit = async () => {
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
        date_time: localDt.toISOString(),
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
    } catch (err: any) {
      console.error(err);
      toast({ title: t("common.error"), description: t("common.recordError") + " el bulk", variant: "destructive" });
    }
  };

  const handleDeliverySubmit = async () => {
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
        date_time: new Date(deliveryFormData.dateTime).toISOString(),
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
