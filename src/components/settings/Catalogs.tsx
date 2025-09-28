import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBreeds, createBreed, updateBreed } from "@/services/breeds";
import { getLots, createLot, updateLot, deleteLot } from "@/services/lots";
import { Pencil } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";

export default function Catalogs() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [breedName, setBreedName] = useState("");
  const [lotName, setLotName] = useState("");
  const [lotNotes, setLotNotes] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ type: 'breed' | 'lot'; id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const { data: breeds = [], isLoading: loadingBreeds } = useQuery({
    queryKey: ["breeds", { active: undefined }],
    queryFn: () => getBreeds(),
  });
  const { data: lots = [], isLoading: loadingLots } = useQuery({
    queryKey: ["lots", { active: undefined }],
    queryFn: () => getLots(),
  });

  const createBreedMut = useMutation({
    mutationFn: () => createBreed({ name: breedName }),
    onSuccess: () => {
      setBreedName("");
      qc.invalidateQueries({ queryKey: ["breeds"] });
    },
  });
  const updateBreedMut = useMutation({
    mutationFn: (args: { id: string; body: any }) => updateBreed(args.id, args.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["breeds"] }),
  });

  const createLotMut = useMutation({
    mutationFn: () => createLot({ name: lotName, notes: lotNotes || undefined }),
    onSuccess: () => {
      setLotName("");
      setLotNotes("");
      qc.invalidateQueries({ queryKey: ["lots"] });
    },
  });
  const updateLotMut = useMutation({
    mutationFn: (args: { id: string; body: any }) => updateLot(args.id, args.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lots"] }),
  });

  const openRename = (type: 'breed' | 'lot', id: string, name: string) => {
    setRenameTarget({ type, id, name });
    setRenameValue(name);
    setRenameOpen(true);
  };

  const submitRename = async () => {
    if (!renameTarget) return;
    const newName = renameValue.trim();
    if (!newName || newName === renameTarget.name) {
      setRenameOpen(false);
      return;
    }
    if (renameTarget.type === 'breed') {
      await updateBreedMut.mutateAsync({ id: renameTarget.id, body: { name: newName } });
    } else {
      await updateLotMut.mutateAsync({ id: renameTarget.id, body: { name: newName } });
    }
    setRenameOpen(false);
  };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Breeds */}
      <Card>
        <CardHeader>
          <CardTitle>{t("animals.breeds")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!breedName.trim()) return;
              createBreedMut.mutate();
            }}
            className="flex gap-2"
          >
            <Input placeholder={t("animals.newBreed")} value={breedName} onChange={(e) => setBreedName(e.target.value)} />
            <Button type="submit" disabled={createBreedMut.isPending || !breedName.trim()}>{t("animals.addBreed")}</Button>
          </form>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("animals.breedName")}</TableHead>
                  <TableHead>{t("animals.breedCode")}</TableHead>
                  <TableHead>{t("animals.systemDefault")}</TableHead>
                  <TableHead>{t("common.active")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(breeds as any[]).map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.name}</TableCell>
                    <TableCell className="text-muted-foreground">{b.code ?? "-"}</TableCell>
                    <TableCell>{b.is_system_default ? t("animals.systemDefaultYes") : t("animals.systemDefaultNo")}</TableCell>
                    <TableCell>{b.active ? t("animals.activeYes") : t("animals.activeNo")}</TableCell>
                    <TableCell className="flex items-center gap-3">
                      <Button
                        size="icon"
                        variant="secondary"
                        title={t("animals.rename")}
                        aria-label={t("animals.rename")}
                        disabled={b.is_system_default}
                        onClick={() => openRename('breed', b.id, b.name)}
                        className="h-10 w-10"
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Switch
                        checked={b.active}
                        onCheckedChange={(v) => updateBreedMut.mutate({ id: b.id, body: { active: v } })}
                        disabled={b.is_system_default}
                        title={b.active ? t("animals.deactivate") : t("animals.activate")}
                        aria-label={b.active ? t("animals.deactivate") : t("animals.activate")}
                        size="sm"
                        className="data-[state=checked]:bg-green-600"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {(!breeds || (breeds as any[]).length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">{t("animals.noBreeds")}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Lots */}
      <Card>
        <CardHeader>
          <CardTitle>{t("animals.lots")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!lotName.trim()) return;
              createLotMut.mutate();
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2"
          >
            <div className="sm:col-span-1">
              <Label>{t("animals.lotName")}</Label>
              <Input placeholder={t("animals.newLot")} value={lotName} onChange={(e) => setLotName(e.target.value)} />
            </div>
            <div className="sm:col-span-1">
              <Label>{t("animals.lotNotes")}</Label>
              <Input placeholder={t("animals.optional")} value={lotNotes} onChange={(e) => setLotNotes(e.target.value)} />
            </div>
            <div className="sm:col-span-1 flex items-end">
              <Button type="submit" className="w-full" disabled={createLotMut.isPending || !lotName.trim()}>{t("animals.addLot")}</Button>
            </div>
          </form>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("animals.lotName")}</TableHead>
                  <TableHead>{t("common.active")}</TableHead>
                  <TableHead>{t("animals.lotNotes")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(lots as any[]).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.name}</TableCell>
                    <TableCell>{l.active ? t("animals.activeYes") : t("animals.activeNo")}</TableCell>
                    <TableCell className="text-muted-foreground">{l.notes ?? "-"}</TableCell>
                    <TableCell className="flex items-center gap-3">
                      <Button
                        size="icon"
                        variant="secondary"
                        title={t("animals.rename")}
                        aria-label={t("animals.rename")}
                        onClick={() => openRename('lot', l.id, l.name)}
                        className="h-10 w-10"
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Switch
                        checked={l.active}
                        onCheckedChange={(v) => updateLotMut.mutate({ id: l.id, body: { active: v } })}
                        title={l.active ? t("animals.deactivate") : t("animals.activate")}
                        aria-label={l.active ? t("animals.deactivate") : t("animals.activate")}
                        size="sm"
                        className="data-[state=checked]:bg-green-600"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {(!lots || (lots as any[]).length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">{t("animals.noLots")}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {renameTarget?.type === 'breed' ? t("animals.renameBreed") : t("animals.renameLot")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>{t("animals.newName")}</Label>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRenameOpen(false)}>{t("common.cancel")}</Button>
          <Button onClick={submitRename} disabled={!renameValue.trim() || renameValue.trim() === renameTarget?.name}>{t("animals.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
