import { useMemo, useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getOutboxSnapshot,
  getPendingProductionEntries,
  subscribeOutbox,
} from "@/services/outbox";
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
  /**
   * Every lactating animal in one request.
   *
   * The bulk form needs all of them at once anyway — it used to page through
   * them 10 at a time in the background just to collect ids, which meant N
   * round trips, N cache entries, and a list the user had to paginate through
   * by hand. The endpoint caps `limit` at 500, comfortably above any herd this
   * screen targets. Searching is done client-side over this list, so it also
   * works with no connection.
   */
  const ANIMALS_QUERY_LIMIT = 500;
  const { data: animalsData } = useQuery({
    queryKey: ["animals", { status_codes: "LACTATING", limit: ANIMALS_QUERY_LIMIT }],
    queryFn: () =>
      listAnimals({ status_codes: "LACTATING", limit: ANIMALS_QUERY_LIMIT }),
  });
  const animals = animalsData?.items ?? [];
  const animalsTotal = animalsData?.total ?? null;
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
  const {
    data: productions = [],
    isError: productionsFailed,
    isFetching: productionsFetching,
    dataUpdatedAt: productionsUpdatedAt,
  } = useQuery({
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

  /**
   * Records still sitting in the outbox, shaped like server productions so the
   * daily totals and the list include what the farmer just typed. They are
   * merged at read time rather than written into the query cache, because the
   * next successful refetch would silently wipe an optimistic cache entry — and
   * this way the "pending" badge stays truthful.
   */
  const outboxOps = useSyncExternalStore(
    subscribeOutbox,
    getOutboxSnapshot,
    getOutboxSnapshot
  );
  const pendingProductions = useMemo(() => {
    return getPendingProductionEntries(formData.date, undefined, outboxOps).map((e) => ({
      // No `version`: that is what keeps the edit affordance off a record the
      // server has never seen.
      id: `${e.opId}:${e.animalId}`,
      animal_id: e.animalId,
      buyer_id: null,
      // AM -> 06:00, PM -> 18:00, the same convention the backend applies, so
      // ordering by time puts pending rows where they belong.
      date_time: `${e.date}T${e.shift === "AM" ? "06:00" : "18:00"}:00`,
      shift: e.shift,
      input_unit: "l",
      input_quantity: String(e.inputQuantity),
      density: "1",
      volume_l: String(e.volumeL),
      price_snapshot: null,
      currency: billing?.default_currency || "USD",
      amount: null,
      notes: null,
      __pending: true as const,
      __pendingStatus: e.status,
    }));
  }, [formData.date, billing?.default_currency, outboxOps]);

  const productionsWithPending = useMemo(
    () => [...pendingProductions, ...productions],
    [pendingProductions, productions]
  );

  // Build animal ID set from today's productions
  const productionAnimalIds = useMemo(() => {
    const ids = new Set<string>();
    // Pending rows included: a bulk entry can cover animals outside the page
    // currently loaded, and they still need a name in the list.
    productionsWithPending.forEach((p: any) => {
      if (p.animal_id) ids.add(String(p.animal_id));
    });
    return Array.from(ids);
  }, [productionsWithPending]);

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
    const items = productionsWithPending
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
          pending: Boolean((p as { __pending?: boolean }).__pending),
        };
      });
    return items;
  }, [productionsWithPending, animalsEnriched, formData.date]);

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
    /** Total lactating animals reported by the server (for the header count). */
    animalsTotal,
    activeAnimals,
    buyers,
    billing,
    productions: productionsWithPending,
    productionsOrder: {
      order_by: recordsOrderBy,
      order: recordsOrder,
      setOrderBy: setRecordsOrderBy,
      setOrder: setRecordsOrder,
    },
    deliveries,
    prices,
    effectivePrice,
    /** True when the last refetch failed; cached rows may still be shown. */
    productionsFailed,
    productionsFetching,
    /** Epoch ms of the data on screen, for the "datos del ..." marker. */
    productionsUpdatedAt,
    pendingCount: pendingProductions.length,
    recentEntries,
    recentDeliveries,
    deliveryDateFrom,
  };
}
