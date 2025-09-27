import { useState, useEffect } from "react";
import { getTodayLocalDateString, getLocalDateTimeInputValue } from '@/utils/dateUtils';

export interface MilkCollectionFormData {
  date: string;
  shift: string;
  animalId: string;
  inputValue: string;
  inputUnit: string;
  density: string;
  buyerId: string;
  notes: string;
}

export interface DeliveryFormData {
  dateTime: string;
  volumeL: string;
  buyerId: string;
  notes: string;
}

export function useMilkCollectionForm(billing?: any) {
  const [formData, setFormData] = useState<MilkCollectionFormData>({
    date: getTodayLocalDateString(),
    shift: 'AM',
    animalId: '',
    inputValue: '',
    inputUnit: 'L',
    density: '1.03',
    buyerId: '',
    notes: ''
  });

  const [deliveryFormData, setDeliveryFormData] = useState<DeliveryFormData>({
    dateTime: getLocalDateTimeInputValue(),
    volumeL: '',
    buyerId: '',
    notes: ''
  });

  const [isBulkMode, setIsBulkMode] = useState(true);
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [animalQuantities, setAnimalQuantities] = useState<Record<string, string>>({});

  // Set defaults from billing settings
  useEffect(() => {
    if (billing) {
      setFormData(prev => ({
        ...prev,
        inputUnit: (billing.default_production_input_unit?.toUpperCase?.() === 'KG' || billing.default_production_input_unit?.toUpperCase?.() === 'LB')
          ? billing.default_production_input_unit.toUpperCase()
          : 'L',
        density: billing.default_density ? String(billing.default_density) : prev.density,
        buyerId: billing.default_buyer_id ?? '',
      }));

      setDeliveryFormData(prev => ({
        ...prev,
        buyerId: billing.default_buyer_id ?? '',
      }));
    }
  }, [billing]);

  const toggleAnimalSelection = (animalId: string) => {
    setSelectedAnimals(prev => {
      const newSelection = prev.includes(animalId)
        ? prev.filter(id => id !== animalId)
        : [...prev, animalId];

      if (prev.includes(animalId)) {
        setAnimalQuantities(prevQuantities => {
          const newQuantities = { ...prevQuantities };
          delete newQuantities[animalId];
          return newQuantities;
        });
      }

      return newSelection;
    });
  };

  const updateAnimalQuantity = (animalId: string, quantity: string) => {
    setAnimalQuantities(prev => ({
      ...prev,
      [animalId]: quantity
    }));
  };

  const resetDeliveryForm = () => {
    setDeliveryFormData({
      dateTime: getLocalDateTimeInputValue(),
      volumeL: '',
      buyerId: billing?.default_buyer_id ?? '',
      notes: ''
    });
  };

  const resetProductionForm = () => {
    setFormData(prev => ({ ...prev, animalId: '', inputValue: '', notes: '' }));
    setAnimalQuantities({});
  };

  return {
    formData,
    setFormData,
    deliveryFormData,
    setDeliveryFormData,
    isBulkMode,
    setIsBulkMode,
    selectedAnimals,
    setSelectedAnimals,
    animalQuantities,
    setAnimalQuantities,
    toggleAnimalSelection,
    updateAnimalQuantity,
    resetDeliveryForm,
    resetProductionForm
  };
}
