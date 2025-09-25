import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { listBuyers } from "@/services/buyers";
import { createMilkPrice } from "@/services/milkPrices";
import { useTranslation } from "@/hooks/useTranslation";

interface MilkPriceFormData {
  buyerId: string;
  pricePerL: string;
  date: string;
}

export default function MilkPriceForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [formData, setFormData] = useState<MilkPriceFormData>({
    buyerId: "",
    pricePerL: "",
    date: new Date().toISOString().slice(0,10),
  });

  const { data: buyers = [] } = useQuery({ queryKey: ["buyers"], queryFn: () => listBuyers() });
  const { mutateAsync: doCreate, isPending } = useMutation({
    mutationFn: (vars: MilkPriceFormData) => createMilkPrice({
      date: vars.date,
      price_per_l: vars.pricePerL,
      buyer_id: vars.buyerId || undefined,
    }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await doCreate(formData);
      toast({ title: t('milk.priceRegistered'), description: t('milk.priceSavedCorrectly') });
      navigate("/milk/prices");
    } catch (err) {
      console.error(err);
      toast({ title: t('common.error'), description: t('milk.couldNotRegisterPrice'), variant: "destructive" });
    }
  };

  const handleInputChange = (field: keyof MilkPriceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/milk/prices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t('milk.newMilkPrice')}</h1>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{t('milk.priceInformation')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buyer">{t('milk.buyerOptional')}</Label>
              <Select value={formData.buyerId} onValueChange={(value: string) => handleInputChange("buyerId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('milk.selectBuyer')} />
                </SelectTrigger>
                <SelectContent>
                  {buyers.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pricePerL">{t('milk.pricePerLiterRequired')}</Label>
                <Input
                  id="pricePerL"
                  type="number"
                  step="0.01"
                  min={0}
                  value={formData.pricePerL}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") return handleInputChange("pricePerL", v);
                    const n = parseFloat(v);
                    handleInputChange("pricePerL", (isNaN(n) || n < 0) ? "0" : v);
                  }}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">{t('milk.dateRequired')}</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button type="submit" className="flex-1" disabled={isPending}>
                {t('milk.savePriceLabel')}
              </Button>
              <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => navigate("/milk/prices")}>
                {t('milk.cancelLabel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
