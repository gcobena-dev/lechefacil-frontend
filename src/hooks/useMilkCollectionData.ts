import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAnimals } from "@/services/animals";
import { listBuyers } from "@/services/buyers";
import { getBillingSettings } from "@/services/settings";
import { listMilkProductions } from "@/services/milkProductions";
import { listMilkPrices } from "@/services/milkPrices";
import { listMilkDeliveries } from "@/services/milkDeliveries";
import { getTodayLocalDateString, getLocalDateString } from '@/utils/dateUtils';

export function useMilkCollectionData(formData: { date: string; buyerId: string }) {
  // Data queries - Only fetch lactating animals for milk collection
  const { data: animalsData } = useQuery({
    queryKey: ["animals", { status_codes: "LACTATING" }],
    queryFn: () => listAnimals({ status_codes: "LACTATING" })
  });
  const animals = animalsData?.items ?? [];
  const activeAnimals = animals; // All animals are already filtered to lactating

  const { data: buyers = [] } = useQuery({
    queryKey: ["buyers"],
    queryFn: () => listBuyers()
  });

  const { data: billing } = useQuery({
    queryKey: ["tenant-billing"],
    queryFn: getBillingSettings
  });

  // Load productions for selected date
  const { data: productions = [] } = useQuery({
    queryKey: ["milk-productions", formData.date],
    queryFn: () => listMilkProductions({ date_from: formData.date, date_to: formData.date }),
  });

  // Load deliveries for last 7 days
  const deliveryDateFrom = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return getLocalDateString(date);
  }, []);

  const { data: deliveries = [] } = useQuery({
    queryKey: ["milk-deliveries", deliveryDateFrom],
    queryFn: () => listMilkDeliveries({
      date_from: deliveryDateFrom,
      date_to: getTodayLocalDateString()
    }),
  });

  // Load prices
  const { data: prices = [] } = useQuery({
    queryKey: ["milk-prices", formData.date, formData.buyerId],
    queryFn: () => listMilkPrices({
      date_from: formData.date,
      date_to: formData.date,
      buyer_id: formData.buyerId || null
    }),
  });

  // Calculate effective price
  const effectivePrice = useMemo(() => {
    const buyerPrice = prices.find(p => p.buyer_id && formData.buyerId && p.buyer_id === formData.buyerId);
    const generalPrice = prices.find(p => !p.buyer_id);
    if (buyerPrice) return parseFloat(buyerPrice.price_per_l);
    if (generalPrice) return parseFloat(generalPrice.price_per_l);
    if (billing?.default_price_per_l) return parseFloat(String(billing.default_price_per_l));
    return undefined;
  }, [prices, formData.buyerId, billing]);

  // Calculate recent entries
  const recentEntries = useMemo(() => {
    const items = productions
      .filter((p) => new Date(p.date_time).toISOString().startsWith(formData.date))
      .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
      .slice(0, 5)
      .map((p) => {
        const animal = animals.find(a => a.id === p.animal_id);
        const time = new Date(p.date_time).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
        return {
          animal: `${animal?.name ?? ''} (${animal?.tag ?? ''})`,
          amount: `${parseFloat(p.volume_l).toFixed(1)}L`,
          time,
        };
      });
    return items;
  }, [productions, animals, formData.date]);

  // Calculate recent deliveries
  const recentDeliveries = useMemo(() => {
    const items = deliveries
      .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
      .slice(0, 5)
      .map((d) => {
        const buyer = buyers.find(b => b.id === d.buyer_id);
        const date = new Date(d.date_time);
        const time = date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString('es-EC', { month: 'short', day: 'numeric' });
        return {
          buyer: buyer?.name ?? 'Comprador desconocido',
          amount: `${parseFloat(String(d.volume_l)).toFixed(1)}L`,
          time: `${dateStr} ${time}`,
        };
      });
    return items;
  }, [deliveries, buyers]);

  return {
    animals,
    activeAnimals,
    buyers,
    billing,
    productions,
    deliveries,
    prices,
    effectivePrice,
    recentEntries,
    recentDeliveries,
    deliveryDateFrom
  };
}