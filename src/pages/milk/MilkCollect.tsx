import { useEffect, useState } from "react";
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

export default function MilkCollect() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("production");

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
    buyers,
    billing,
    productions,
    effectivePrice,
    recentEntries,
    recentDeliveries,
    deliveryDateFrom
  } = useMilkCollectionData(formData);

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
    resetProductionForm,
    resetDeliveryForm
  );

  // Auto-select all active animals when list loads for bulk mode
  useEffect(() => {
    if (activeAnimals.length > 0 && selectedAnimals.length === 0) {
      setSelectedAnimals(activeAnimals.map(a => a.id));
    }
  }, [activeAnimals.length, selectedAnimals.length, setSelectedAnimals]);

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
                buyers={buyers}
                effectivePrice={effectivePrice}
                creating={creating}
                creatingBulk={creatingBulk}
                onFormDataChange={handleFormDataChange}
                onBulkModeChange={setIsBulkMode}
                onToggleAnimalSelection={toggleAnimalSelection}
                onUpdateAnimalQuantity={updateAnimalQuantity}
                onSubmit={handleProductionSubmit}
              />
            </div>
            <div>
              <MilkCollectionSidebar
                activeTab={activeTab}
                recentEntries={recentEntries}
                recentDeliveries={recentDeliveries}
                productions={productions}
                formData={formData}
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
                defaultPricePerL={billing?.default_price_per_l}
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
                formData={formData}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}