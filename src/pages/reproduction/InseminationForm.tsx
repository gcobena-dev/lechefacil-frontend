import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateInsemination, useSemenStock } from "@/hooks/useReproduction";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { SireSelector } from "@/components/reproduction/SireSelector";
import SearchableAnimalSelect from "@/components/milk/SearchableAnimalSelect";

const METHODS = [
  { value: "AI", labelKey: "reproduction.methodAI" },
  { value: "NATURAL", labelKey: "reproduction.methodNatural" },
  { value: "ET", labelKey: "reproduction.methodET" },
  { value: "IATF", labelKey: "reproduction.methodIATF" },
];

export default function InseminationForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const mutation = useCreateInsemination();

  const [animalId, setAnimalId] = useState("");
  const [sireId, setSireId] = useState("");
  const [serviceDate, setServiceDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [method, setMethod] = useState("AI");
  const [semenInventoryId, setSemenInventoryId] = useState("");
  const [technician, setTechnician] = useState("");
  const [strawCount, setStrawCount] = useState(1);
  const [heatDetected, setHeatDetected] = useState(false);
  const [protocol, setProtocol] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch semen stock for selected sire
  const isAI = method === "AI" || method === "IATF";
  const { data: semenData } = useSemenStock({
    sire_catalog_id: isAI && sireId ? sireId : undefined,
    in_stock_only: true,
  });
  const semenItems = semenData?.items ?? [];

  const handleSubmit = async () => {
    if (!animalId || !serviceDate || !method) return;
    try {
      await mutation.mutateAsync({
        animal_id: animalId,
        service_date: new Date(serviceDate).toISOString(),
        method,
        sire_catalog_id: sireId || null,
        semen_inventory_id: semenInventoryId || null,
        technician: technician.trim() || null,
        straw_count: strawCount,
        heat_detected: heatDetected,
        protocol: protocol.trim() || null,
        notes: notes.trim() || null,
      });
      toast({ title: t("reproduction.inseminationRecorded") });
      navigate("/reproduction/inseminations");
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
        <h1 className="text-xl font-bold">{t("reproduction.recordInsemination")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("reproduction.newInsemination")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Animal */}
          <div className="space-y-2">
            <Label>{t("reproduction.selectAnimal")} *</Label>
            <SearchableAnimalSelect
              value={animalId}
              onValueChange={setAnimalId}
              placeholder={t("reproduction.selectAnimal")}
            />
          </div>

          {/* Service Date */}
          <div className="space-y-2">
            <Label>{t("reproduction.serviceDate")} *</Label>
            <Input
              type="datetime-local"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
            />
          </div>

          {/* Method */}
          <div className="space-y-2">
            <Label>{t("reproduction.method")} *</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {t(m.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sire */}
          <div className="space-y-2">
            <Label>{t("reproduction.selectSire")}</Label>
            <SireSelector value={sireId} onValueChange={setSireId} />
          </div>

          {/* Semen lot (only for AI/IATF) */}
          {isAI && sireId && (
            <div className="space-y-2">
              <Label>{t("reproduction.selectSemenLot")}</Label>
              {semenItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("reproduction.noSemenAvailable")}
                </p>
              ) : (
                <Select value={semenInventoryId} onValueChange={setSemenInventoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("reproduction.selectSemenLot")} />
                  </SelectTrigger>
                  <SelectContent>
                    {semenItems.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.batch_code || "Sin lote"} - {s.current_quantity}{" "}
                        {t("reproduction.strawsAvailable")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Straw count */}
          {isAI && (
            <div className="space-y-2">
              <Label>{t("reproduction.strawCount")}</Label>
              <Input
                type="number"
                min={1}
                value={strawCount}
                onChange={(e) => setStrawCount(parseInt(e.target.value) || 1)}
              />
            </div>
          )}

          {/* Technician */}
          <div className="space-y-2">
            <Label>{t("reproduction.technician")}</Label>
            <Input
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              placeholder={t("reproduction.technicianPlaceholder")}
            />
          </div>

          {/* Heat detected */}
          <div className="flex items-center justify-between">
            <Label>{t("reproduction.heatDetected")}</Label>
            <Switch checked={heatDetected} onCheckedChange={setHeatDetected} />
          </div>

          {/* Protocol */}
          <div className="space-y-2">
            <Label>{t("reproduction.protocol")}</Label>
            <Input
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              placeholder={t("reproduction.protocolPlaceholder")}
            />
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
              disabled={!animalId || !method || mutation.isPending}
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
