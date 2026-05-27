import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import {
  useCreateSemenStock,
  useSemenStockById,
  useUpdateSemenStock,
  useSire,
  useSemenAutocompleteValues,
} from "@/hooks/useReproduction";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { SireSelector } from "@/components/reproduction/SireSelector";
import { Autocomplete } from "@/components/ui/autocomplete";

export default function SemenStockForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const createMutation = useCreateSemenStock();
  const updateMutation = useUpdateSemenStock();
  const { data: existing, isLoading: isLoadingExisting } = useSemenStockById(id);
  const { data: autocomplete } = useSemenAutocompleteValues();

  const [sireId, setSireId] = useState("");
  const [initialQuantity, setInitialQuantity] = useState("");
  const [currentQuantity, setCurrentQuantity] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [tankId, setTankId] = useState("");
  const [canisterPosition, setCanisterPosition] = useState("");
  const [supplier, setSupplier] = useState("");
  const [costPerStraw, setCostPerStraw] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  const { data: editingSire } = useSire(isEdit ? sireId : undefined);

  useEffect(() => {
    if (!isEdit || !existing) return;
    setSireId(existing.sire_catalog_id);
    setInitialQuantity(String(existing.initial_quantity));
    setCurrentQuantity(String(existing.current_quantity));
    setBatchCode(existing.batch_code ?? "");
    setTankId(existing.tank_id ?? "");
    setCanisterPosition(existing.canister_position ?? "");
    setSupplier(existing.supplier ?? "");
    setCostPerStraw(
      existing.cost_per_straw !== null && existing.cost_per_straw !== undefined
        ? String(existing.cost_per_straw)
        : ""
    );
    setCurrency(existing.currency || "USD");
    setPurchaseDate(existing.purchase_date ?? "");
    setExpiryDate(existing.expiry_date ?? "");
    setNotes(existing.notes ?? "");
  }, [isEdit, existing]);

  const mutation = isEdit ? updateMutation : createMutation;

  const handleSubmit = async () => {
    try {
      if (isEdit) {
        if (!id) return;
        await updateMutation.mutateAsync({
          id,
          payload: {
            batch_code: batchCode.trim() || null,
            tank_id: tankId.trim() || null,
            canister_position: canisterPosition.trim() || null,
            current_quantity: currentQuantity ? parseInt(currentQuantity) : undefined,
            supplier: supplier.trim() || null,
            cost_per_straw: costPerStraw ? parseFloat(costPerStraw) : null,
            currency,
            purchase_date: purchaseDate || null,
            expiry_date: expiryDate || null,
            notes: notes.trim() || null,
          },
        });
        toast({ title: t("reproduction.stockUpdated") });
      } else {
        if (!sireId || !initialQuantity) return;
        await createMutation.mutateAsync({
          sire_catalog_id: sireId,
          initial_quantity: parseInt(initialQuantity),
          batch_code: batchCode.trim() || null,
          tank_id: tankId.trim() || null,
          canister_position: canisterPosition.trim() || null,
          supplier: supplier.trim() || null,
          cost_per_straw: costPerStraw ? parseFloat(costPerStraw) : null,
          currency,
          purchase_date: purchaseDate || null,
          expiry_date: expiryDate || null,
          notes: notes.trim() || null,
        });
        toast({ title: t("reproduction.stockAdded") });
      }
      navigate("/reproduction/semen");
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const title = isEdit ? t("reproduction.editStock") : t("reproduction.addStock");
  const submitDisabled = isEdit
    ? mutation.isPending || isLoadingExisting
    : !sireId || !initialQuantity || mutation.isPending;

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sire */}
          <div className="space-y-2">
            <Label>{t("reproduction.selectSire")} *</Label>
            {isEdit ? (
              <Input
                value={
                  editingSire
                    ? editingSire.short_code
                      ? `${editingSire.name} (${editingSire.short_code})`
                      : editingSire.name
                    : ""
                }
                disabled
                readOnly
              />
            ) : (
              <SireSelector value={sireId} onValueChange={setSireId} />
            )}
          </div>

          {/* Quantity */}
          {isEdit ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("reproduction.initialQuantity")}</Label>
                <Input
                  type="number"
                  value={initialQuantity}
                  disabled
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label>{t("reproduction.currentQuantity")}</Label>
                <Input
                  type="number"
                  min={0}
                  value={currentQuantity}
                  onChange={(e) => setCurrentQuantity(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t("reproduction.initialQuantity")} *</Label>
              <Input
                type="number"
                min={1}
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(e.target.value)}
              />
            </div>
          )}

          {/* Batch Code */}
          <div className="space-y-2">
            <Label>{t("reproduction.batchCode")}</Label>
            <Autocomplete
              value={batchCode}
              onChange={setBatchCode}
              suggestions={autocomplete?.batch_codes ?? []}
              placeholder={t("reproduction.batchCodePlaceholder")}
            />
          </div>

          {/* Tank & Position */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("reproduction.tankId")}</Label>
              <Autocomplete
                value={tankId}
                onChange={setTankId}
                suggestions={autocomplete?.tank_ids ?? []}
                placeholder={t("reproduction.tankIdPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("reproduction.canisterPosition")}</Label>
              <Autocomplete
                value={canisterPosition}
                onChange={setCanisterPosition}
                suggestions={autocomplete?.canister_positions ?? []}
                placeholder={t("reproduction.canisterPositionPlaceholder")}
              />
            </div>
          </div>

          {/* Supplier */}
          <div className="space-y-2">
            <Label>{t("reproduction.supplier")}</Label>
            <Autocomplete
              value={supplier}
              onChange={setSupplier}
              suggestions={autocomplete?.suppliers ?? []}
              placeholder={t("reproduction.supplierPlaceholder")}
            />
          </div>

          {/* Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("reproduction.costPerStraw")}</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={costPerStraw}
                onChange={(e) => setCostPerStraw(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("reproduction.currency")}</Label>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                maxLength={3}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("reproduction.purchaseDate")}</Label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("reproduction.expiryDate")}</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t("reproduction.notes")}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("reproduction.notesPlaceholder")}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
              {t("reproduction.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitDisabled}
              className="flex-1"
            >
              {mutation.isPending ? t("reproduction.saving") : t("reproduction.save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
