import { useEffect, useState } from "react";
import { listAnimals } from "@/services/animals";
import { Milk, Truck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/useTranslation";
import { useMilkCollectionData } from "@/hooks/useMilkCollectionData";
import { useMilkCollectionForm } from "@/hooks/useMilkCollectionForm";
import { useMilkCollectionActions } from "@/hooks/useMilkCollectionActions";
import MilkProductionForm from "@/components/milk/MilkProductionForm";
import MilkDeliveryForm from "@/components/milk/MilkDeliveryForm";
import MilkCollectionSidebar from "@/components/milk/MilkCollectionSidebar";
import { getTodayLocalDateString } from "@/utils/dateUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function MilkCollect() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("production");
  const [ocrResetKey, setOcrResetKey] = useState<number>(0);

  // Get initial form data and billing
  const initialFormData = { date: getTodayLocalDateString(), buyerId: '' };
  const initialData = useMilkCollectionData(initialFormData);

  // Pass billing to form hook
  const {
    formData,
    setFormData,
    deliveryFormData,
    setDeliveryFormData,
    isBulkMode,
    setIsBulkMode,
    selectedAnimals,
    setSelectedAnimals,
    animalQuantities,
    toggleAnimalSelection,
    updateAnimalQuantity,
    resetDeliveryForm,
    resetProductionForm
  } = useMilkCollectionForm(initialData.billing);

  // Get updated data based on current form values
  const {
    animals,
    activeAnimals,
    animalsPagination,
    buyers,
    billing,
    productions,
    productionsOrder,
    effectivePrice,
    recentEntries,
    recentDeliveries,
    deliveryDateFrom
  } = useMilkCollectionData(formData);

  // Dialog for bulk conflicts
  const [conflictsOpen, setConflictsOpen] = useState(false);
  const [conflictsHeader, setConflictsHeader] = useState("");
  const [conflictsLines, setConflictsLines] = useState<string[]>([]);
  const openConflictsDialog = (payload: { header: string; lines: string[] }) => {
    setConflictsHeader(payload.header);
    setConflictsLines(payload.lines);
    setConflictsOpen(true);
  };

  const {
    handleSingleSubmit,
    handleBulkSubmit,
    handleDeliverySubmit,
    creating,
    creatingBulk,
    creatingDelivery
  } = useMilkCollectionActions(
    formData,
    deliveryFormData,
    selectedAnimals,
    animalQuantities,
    deliveryDateFrom,
    animals,
    resetProductionForm,
    resetDeliveryForm,
    openConflictsDialog,
    () => setOcrResetKey((k) => k + 1)
  );

  // Auto-select all active animals when list loads for bulk mode
  useEffect(() => {
    const autoSelectAll = async () => {
      if (selectedAnimals.length > 0) return;
      // If we know the total from server and page size, fetch all pages to collect IDs
      const total = animalsPagination.total;
      const pageSize = animalsPagination.pageSize;
      if (!total || total <= 0) {
        // Fallback: select whatever is currently loaded
        if (activeAnimals.length > 0) setSelectedAnimals(activeAnimals.map(a => a.id));
        return;
      }
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const ids: string[] = [];
      for (let p = 1; p <= totalPages; p++) {
        const res = await listAnimals({ status_codes: "LACTATING", page: p, limit: pageSize });
        res.items?.forEach(a => ids.push(a.id));
      }
      if (ids.length > 0) setSelectedAnimals(ids);
    };
    autoSelectAll();
  }, [activeAnimals, selectedAnimals.length, animalsPagination.total, animalsPagination.pageSize]);

  // Handle form data changes
  const handleFormDataChange = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleDeliveryFormDataChange = (data: Partial<typeof deliveryFormData>) => {
    setDeliveryFormData(prev => ({ ...prev, ...data }));
  };

  // Handle submissions
  const handleProductionSubmit = () => {
    if (isBulkMode) {
      handleBulkSubmit();
    } else {
      handleSingleSubmit();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center mb-4">
          <Milk className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("milk.milkCollectionTitle")}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{t("milk.managePricesAndBuyers")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="production" className="flex items-center gap-2">
            <Milk className="h-4 w-4" />
            {t("milk.production")}
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            {t("milk.delivery")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="mt-6">
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <MilkProductionForm
                formData={formData}
                isBulkMode={isBulkMode}
                selectedAnimals={selectedAnimals}
                animalQuantities={animalQuantities}
                activeAnimals={activeAnimals}
                animalsTotal={animalsPagination.total}
                animalsPage={animalsPagination.page}
                animalsPageSize={animalsPagination.pageSize}
                onAnimalsPageChange={animalsPagination.setPage}
                animalsSearch={animalsPagination.search}
                onAnimalsSearchChange={animalsPagination.setSearch}
                buyers={buyers}
                effectivePrice={effectivePrice}
                creating={creating}
                creatingBulk={creatingBulk}
                onFormDataChange={handleFormDataChange}
                onBulkModeChange={setIsBulkMode}
                onToggleAnimalSelection={toggleAnimalSelection}
                onUpdateAnimalQuantity={updateAnimalQuantity}
                onSubmit={handleProductionSubmit}
                ocrResetKey={ocrResetKey}
              />
            </div>
            <div>
              <MilkCollectionSidebar
                activeTab={activeTab}
                recentEntries={recentEntries}
                recentDeliveries={recentDeliveries}
                productions={productions}
                animals={animals as any}
                formData={formData}
                effectivePrice={effectivePrice}
                productionsOrder={productionsOrder}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="mt-6">
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <MilkDeliveryForm
                deliveryFormData={deliveryFormData}
                buyers={buyers}
                defaultPricePerL={billing?.default_price_per_l ? Number(billing.default_price_per_l) : undefined}
                creatingDelivery={creatingDelivery}
                onFormDataChange={handleDeliveryFormDataChange}
                onSubmit={handleDeliverySubmit}
              />
            </div>
            <div>
              <MilkCollectionSidebar
                activeTab={activeTab}
                recentEntries={recentEntries}
                recentDeliveries={recentDeliveries}
                productions={productions}
                animals={animals as any}
                formData={formData}
                productionsOrder={productionsOrder}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bulk conflicts dialog */}
      <Dialog open={conflictsOpen} onOpenChange={setConflictsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">{conflictsHeader}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {conflictsLines.map((line, index) => (
              <div key={index} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-foreground">{line}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setConflictsOpen(false)}>{t('common.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
