import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useHerdBullCandidates, useImportSiresFromHerd } from "@/hooks/useReproduction";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImportHerdSiresDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Brings males of the herd into the sire catalog, linked to their animal. */
export default function ImportHerdSiresDialog({ open, onOpenChange }: ImportHerdSiresDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: candidates = [], isLoading } = useHerdBullCandidates(open);
  const importMutation = useImportSiresFromHerd();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = candidates.length > 0 && selected.size === candidates.length;

  const handleOpenChange = (value: boolean) => {
    if (!value) setSelected(new Set());
    onOpenChange(value);
  };

  const handleImport = async () => {
    try {
      const created = await importMutation.mutateAsync([...selected]);
      toast({
        title: t("reproduction.herdSiresImported").replace("{count}", String(created.length)),
      });
      handleOpenChange(false);
    } catch (e) {
      toast({
        title: t("common.error"),
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("reproduction.importFromHerd")}</DialogTitle>
          <DialogDescription>{t("reproduction.importFromHerdDesc")}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("reproduction.loading")}</p>
        ) : candidates.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("reproduction.noHerdCandidates")}</p>
        ) : (
          <div className="flex min-h-0 flex-col gap-2">
            <label className="flex items-center gap-3 border-b px-1 pb-2 text-sm font-medium">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(v) => setSelected(v ? new Set(candidates.map((c) => c.id)) : new Set())}
              />
              {t("reproduction.selectAll")} ({candidates.length})
            </label>
            <div className="min-h-0 space-y-1 overflow-y-auto">
              {candidates.map((animal) => (
                <label
                  key={animal.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-2 hover:bg-muted/50"
                >
                  <Checkbox checked={selected.has(animal.id)} onCheckedChange={() => toggle(animal.id)} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      #{animal.tag}
                      {animal.name ? ` · ${animal.name}` : ""}
                    </p>
                    {animal.breed && <p className="text-xs text-muted-foreground">{animal.breed}</p>}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t("reproduction.cancel")}
          </Button>
          <Button onClick={handleImport} disabled={selected.size === 0 || importMutation.isPending}>
            {importMutation.isPending
              ? t("reproduction.saving")
              : t("reproduction.importSelected").replace("{count}", String(selected.size))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
