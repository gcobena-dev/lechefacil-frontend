import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAnimals, getAnimal } from "@/services/animals";
import { listBuyers } from "@/services/buyers";
import { getBillingSettings } from "@/services/settings";
import { listMilkProductions } from "@/services/milkProductions";
import { listMilkPrices } from "@/services/milkPrices";
import { listMilkDeliveries } from "@/services/milkDeliveries";
import {
  getTodayLocalDateString,
  getLocalDateString,
  getLocalDateString as toLocalDate,
  formatLocalTime,
  formatLocalDateShort,
  getTodayPlusDaysLocalDateString,
} from "@/utils/dateUtils";

export function useMilkCollectionData(formData: {
  date: string;
  buyerId: string;
}) {
  // Server-side pagination + search for lactating animals
  const [animalsPage, setAnimalsPage] = useState(1);
  const [animalsSearch, setAnimalsSearch] = useState("");
  const animalsPageSize = 10;
  const { data: animalsData } = useQuery({
    queryKey: [
      "animals",
      {
        status_codes: "LACTATING",
        page: animalsPage,
        q: animalsSearch,
        limit: animalsPageSize,
      },
    ],
    queryFn: () =>
      listAnimals({
        status_codes: "LACTATING",
        page: animalsPage,
        limit: animalsPageSize,
        q: animalsSearch,
      }),
  });
  const animals = animalsData?.items ?? [];
  const animalsTotal = animalsData?.total ?? null;
  const animalsTotalPages = animalsTotal
    ? Math.max(1, Math.ceil(animalsTotal / animalsPageSize))
    : 1;
  const activeAnimals = animals; // Already filtered to lactating

  const { data: buyers = [] } = useQuery({
    queryKey: ["buyers"],
    queryFn: () => listBuyers(),
  });

  const { data: billing } = useQuery({
    queryKey: ["tenant-billing"],
    queryFn: getBillingSettings,
  });

  // Sort options for daily productions
  const [recordsOrderBy, setRecordsOrderBy] = useState<
    "recent" | "volume" | "name" | "code"
  >("recent");
  const [recordsOrder, setRecordsOrder] = useState<"asc" | "desc">("desc");

  // Load productions for selected date (server-side ordering)
  const { data: productions = [] } = useQuery({
    queryKey: [
      "milk-productions",
      formData.date,
      { order_by: recordsOrderBy, order: recordsOrder },
    ],
    queryFn: () =>
      listMilkProductions({
        date_from: formData.date,
        date_to: formData.date,
        order_by: recordsOrderBy,
        order: recordsOrder,
      }),
  });

  // Build animal ID set from today's productions
  const productionAnimalIds = useMemo(() => {
    const ids = new Set<string>();
    productions.forEach((p: any) => {
      if (p.animal_id) ids.add(String(p.animal_id));
    });
    return Array.from(ids);
  }, [productions]);

  // Fetch any animals referenced in productions that are missing from current page
  const animalsById = useMemo(() => {
    const m = new Map<
      string,
      { id: string; name: string | null; tag: string | null }
    >();
    animals.forEach((a) =>
      m.set(String((a as any).id), {
        id: String((a as any).id),
        name: (a as any).name ?? null,
        tag: (a as any).tag ?? null,
      })
    );
    return m;
  }, [animals]);

  const missingAnimalIds = useMemo(() => {
    return productionAnimalIds.filter((id) => !animalsById.has(String(id)));
  }, [productionAnimalIds, animalsById]);

  const { data: fetchedAnimals = [] } = useQuery({
    queryKey: ["animals-by-id", missingAnimalIds],
    enabled: missingAnimalIds.length > 0,
    queryFn: async () => {
      const results = await Promise.allSettled(
        missingAnimalIds.map((id) => getAnimal(id))
      );
      return results
        .filter(
          (r): r is PromiseFulfilledResult<any> => r.status === "fulfilled"
        )
        .map((r) => r.value);
    },
  });

  const animalsEnriched = useMemo(() => {
    if (!fetchedAnimals || fetchedAnimals.length === 0) return animals;
    // Merge current page + fetched uniques
    const map = new Map<string, any>();
    animals.forEach((a) => map.set(String((a as any).id), a));
    fetchedAnimals.forEach((a) => map.set(String((a as any).id), a));
    return Array.from(map.values());
  }, [animals, fetchedAnimals]);

  // Load deliveries for last 7 days
  const deliveryDateFrom = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return getLocalDateString(date);
  }, []);

  const deliveryDateTo = getTodayPlusDaysLocalDateString(1); // include UTC spillover into next day

  const { data: deliveries = [] } = useQuery({
    queryKey: ["milk-deliveries", deliveryDateFrom, deliveryDateTo],
    queryFn: () =>
      listMilkDeliveries({
        date_from: deliveryDateFrom,
        date_to: deliveryDateTo,
      }),
  });

  // Load prices
  const { data: prices = [] } = useQuery({
    queryKey: ["milk-prices", formData.date, formData.buyerId],
    queryFn: () =>
      listMilkPrices({
        date_from: formData.date,
        date_to: formData.date,
        buyer_id: formData.buyerId || null,
      }),
  });

  // Calculate effective price
  const effectivePrice = useMemo(() => {
    const buyerPrice = prices.find(
      (p) => p.buyer_id && formData.buyerId && p.buyer_id === formData.buyerId
    );
    const generalPrice = prices.find((p) => !p.buyer_id);
    if (buyerPrice) return parseFloat(buyerPrice.price_per_l);
    if (generalPrice) return parseFloat(generalPrice.price_per_l);
    if (billing?.default_price_per_l)
      return parseFloat(String(billing.default_price_per_l));
    return undefined;
  }, [prices, formData.buyerId, billing]);

  // Calculate recent entries
  const recentEntries = useMemo(() => {
    const items = productions
      .filter((p) => toLocalDate(new Date(p.date_time)) === formData.date)
      .sort(
        (a, b) =>
          new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
      )
      .slice(0, 5)
      .map((p) => {
        const animal = animalsEnriched.find(
          (a) => (a as any).id === (p as any).animal_id
        );
        const time = formatLocalTime(p.date_time);
        return {
          animal: `${animal?.name ?? ""} (${animal?.tag ?? ""})`,
          amount: `${parseFloat(p.volume_l).toFixed(1)}L`,
          time,
        };
      });
    return items;
  }, [productions, animalsEnriched, formData.date]);

  // Calculate recent deliveries
  const recentDeliveries = useMemo(() => {
    const fallbackCurrency = billing?.default_currency || "USD";
    const items = deliveries
      .sort(
        (a, b) =>
          new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
      )
      .slice(0, 5)
      .map((d) => {
        const buyer = buyers.find((b) => b.id === d.buyer_id);
        const time = formatLocalTime(d.date_time);
        const dateStr = formatLocalDateShort(d.date_time);
        const pricePerL =
          (d as any).price_snapshot ??
          (billing?.default_price_per_l
            ? parseFloat(String(billing.default_price_per_l))
            : undefined);
        const amountValue =
          pricePerL !== undefined
            ? parseFloat(String(d.volume_l)) * pricePerL
            : undefined;
        return {
          id: d.id,
          version: d.version,
          buyer: buyer?.name ?? "Comprador desconocido",
          volume: `${parseFloat(String(d.volume_l)).toFixed(1)}L`,
          volume_l: d.volume_l,
          amountValue,
          currency: (d as any).currency || fallbackCurrency,
          time: `${dateStr} ${time}`,
          notes: d.notes ?? null,
          date_time: d.date_time,
          buyer_id: d.buyer_id,
          buyer_name: d.buyer_name,
          price_snapshot: d.price_snapshot,
        };
      });
    return items;
  }, [deliveries, buyers, billing]);

  return {
    animals: animalsEnriched,
    animalsPagination: {
      page: animalsPage,
      setPage: setAnimalsPage,
      pageSize: animalsPageSize,
      total: animalsTotal,
      totalPages: animalsTotalPages,
      search: animalsSearch,
      setSearch: setAnimalsSearch,
    },
    activeAnimals,
    buyers,
    billing,
    productions,
    productionsOrder: {
      order_by: recordsOrderBy,
      order: recordsOrder,
      setOrderBy: setRecordsOrderBy,
      setOrder: setRecordsOrder,
    },
    deliveries,
    prices,
    effectivePrice,
    recentEntries,
    recentDeliveries,
    deliveryDateFrom,
  };
}
