import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface Animal {
  id: string;
  name: string;
  tag: string;
}

interface SearchableAnimalSelectProps {
  animals: Animal[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchableAnimalSelect({
  animals,
  value,
  onValueChange,
  placeholder = "Seleccionar animal..."
}: SearchableAnimalSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter animals based on search query
  const filteredAnimals = useMemo(() => {
    if (!searchQuery.trim()) return animals;
    const query = searchQuery.toLowerCase();
    return animals.filter(animal =>
      animal.name.toLowerCase().includes(query) ||
      animal.tag.toLowerCase().includes(query)
    );
  }, [animals, searchQuery]);

  const selectedAnimal = animals.find(animal => animal.id === value);

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
        <div className="max-h-60 overflow-y-auto">
          {filteredAnimals.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? t("common.noResults") : t("common.noAnimalsAvailable")}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredAnimals.map((animal) => (
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
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}