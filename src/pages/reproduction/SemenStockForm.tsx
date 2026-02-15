import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateSemenStock } from "@/hooks/useReproduction";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { SireSelector } from "@/components/reproduction/SireSelector";

export default function SemenStockForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const mutation = useCreateSemenStock();

  const [sireId, setSireId] = useState("");
  const [initialQuantity, setInitialQuantity] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [tankId, setTankId] = useState("");
  const [canisterPosition, setCanisterPosition] = useState("");
  const [supplier, setSupplier] = useState("");
  const [costPerStraw, setCostPerStraw] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!sireId || !initialQuantity) return;
    try {
      await mutation.mutateAsync({
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
      navigate("/reproduction/semen");
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">{t("reproduction.addStock")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("reproduction.addStock")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sire */}
          <div className="space-y-2">
            <Label>{t("reproduction.selectSire")} *</Label>
            <SireSelector value={sireId} onValueChange={setSireId} />
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>{t("reproduction.initialQuantity")} *</Label>
            <Input
              type="number"
              min={1}
              value={initialQuantity}
              onChange={(e) => setInitialQuantity(e.target.value)}
            />
          </div>

          {/* Batch Code */}
          <div className="space-y-2">
            <Label>{t("reproduction.batchCode")}</Label>
            <Input
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
              placeholder={t("reproduction.batchCodePlaceholder")}
            />
          </div>

          {/* Tank & Position */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("reproduction.tankId")}</Label>
              <Input
                value={tankId}
                onChange={(e) => setTankId(e.target.value)}
                placeholder={t("reproduction.tankIdPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("reproduction.canisterPosition")}</Label>
              <Input
                value={canisterPosition}
                onChange={(e) => setCanisterPosition(e.target.value)}
                placeholder={t("reproduction.canisterPositionPlaceholder")}
              />
            </div>
          </div>

          {/* Supplier */}
          <div className="space-y-2">
            <Label>{t("reproduction.supplier")}</Label>
            <Input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
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
              disabled={!sireId || !initialQuantity || mutation.isPending}
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
