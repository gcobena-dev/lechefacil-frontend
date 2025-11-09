import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { listAnimals } from "@/services/animals";
import type { AnimalResponse } from "@/services/types";

interface SearchableAnimalSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchableAnimalSelect({
  value,
  onValueChange,
  placeholder = "Seleccionar animal..."
}: SearchableAnimalSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<AnimalResponse[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const selectedAnimal = items.find(animal => animal.id === value);

  const resetAndLoad = async (q: string) => {
    setLoading(true);
    try {
      const res = await listAnimals({ status_codes: "LACTATING", limit: 20, q });
      setItems(res.items || []);
      setCursor(res.next_cursor ?? null);
      setHasMore(Boolean(res.next_cursor));
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await listAnimals({ status_codes: "LACTATING", limit: 20, cursor, q: searchQuery });
      setItems(prev => [...prev, ...(res.items || [])]);
      setCursor(res.next_cursor ?? null);
      setHasMore(Boolean(res.next_cursor));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      resetAndLoad(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (open) {
        resetAndLoad(searchQuery);
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery, open]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      loadMore();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedAnimal
            ? `${selectedAnimal.tag} - ${selectedAnimal.name}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("common.searchByNameOrTag")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div ref={listRef} className="max-h-60 overflow-y-auto" onScroll={onScroll}>
          {items.length === 0 && !loading ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? t("common.noResults") : t("common.noAnimalsAvailable")}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {items.map((animal) => (
                <div
                  key={animal.id}
                  className={cn(
                    "flex items-center space-x-2 rounded-md px-2 py-2 cursor-pointer hover:bg-accent",
                    value === animal.id && "bg-accent"
                  )}
                  onClick={() => {
                    onValueChange(animal.id === value ? "" : animal.id);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === animal.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{animal.tag}</div>
                    <div className="text-sm text-muted-foreground">{animal.name}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="p-2 text-center text-muted-foreground text-sm">
                  {t('common.loading')}...
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
