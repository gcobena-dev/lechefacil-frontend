import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSires } from "@/hooks/useReproduction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateSireDialog } from "./CreateSireDialog";

interface SireSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function SireSelector({
  value,
  onValueChange,
  placeholder,
}: SireSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data } = useSires({
    active_only: true,
    search: search || undefined,
    limit: 50,
  });

  const items = data?.items || [];
  const selected = items.find((s) => s.id === value);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selected
              ? `${selected.name}${selected.short_code ? ` (${selected.short_code})` : ""}`
              : placeholder || t("reproduction.selectSire")}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("reproduction.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {t("reproduction.noResults")}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {items.map((sire) => (
                  <div
                    key={sire.id}
                    className={cn(
                      "flex items-center space-x-2 rounded-md px-2 py-2 cursor-pointer hover:bg-accent",
                      value === sire.id && "bg-accent"
                    )}
                    onClick={() => {
                      onValueChange(sire.id === value ? "" : sire.id);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === sire.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{sire.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {[sire.short_code, sire.registry_code]
                          .filter(Boolean)
                          .join(" - ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setOpen(false);
                setShowCreateDialog(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("reproduction.createSireInline")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <CreateSireDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={(sireId) => {
          onValueChange(sireId);
        }}
      />
    </>
  );
}
