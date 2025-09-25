import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Save, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTenantSettings, updateTenantSettings, TenantSettings as TenantSettingsType } from "@/services/tenantSettings";
import { listBuyers } from "@/services/buyers";
import { listMilkPrices } from "@/services/milkPrices";

export default function TenantSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<TenantSettingsType>({
    default_buyer_id: null,
    default_density: 1.03,
    default_delivery_input_unit: "l",
    default_production_input_unit: "lb",
    default_currency: "USD",
    default_price_per_l: 0,
  });

  // Fetch tenant settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["tenant-settings"],
    queryFn: getTenantSettings,
  });

  // Fetch buyers for dropdown
  const { data: buyers = [] } = useQuery({
    queryKey: ["buyers"],
    queryFn: listBuyers,
  });

  // Fetch milk prices for selected buyer
  const { data: milkPrices = [] } = useQuery({
    queryKey: ["milk-prices", formData.default_buyer_id],
    queryFn: () => listMilkPrices({ buyer_id: formData.default_buyer_id }),
    enabled: !!formData.default_buyer_id,
  });

  // Update mutation
  const { mutateAsync: updateSettings, isPending } = useMutation({
    mutationFn: updateTenantSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-settings"] });
      toast({
        title: t("common.success"),
        description: t("common.updateSuccess"),
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error?.details?.message || t("common.updateError"),
        variant: "destructive",
      });
    },
  });

  // Update form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleInputChange = (field: keyof TenantSettingsType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
  };

  const handleCancel = () => {
    if (settings) {
      setFormData(settings);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">{t("common.loading")}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedBuyer = buyers.find(b => b.id === formData.default_buyer_id);
  const currentPrice = milkPrices.length > 0 ? milkPrices[0]?.price_per_l : formData.default_price_per_l;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{t("common.tenantSettings")}</CardTitle>
            <CardDescription>
              {t("common.tenantDefaults")}
            </CardDescription>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="w-full sm:w-auto">
              <Edit className="h-4 w-4 mr-2" />
              {t("common.editSettings")}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" size="sm" className="w-full sm:w-auto">
                <X className="h-4 w-4 mr-2" />
                {t("common.cancel")}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          // View Mode
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  {t("common.defaultBuyer")}
                </Label>
                <p className="text-sm">
                  {selectedBuyer?.name || t("common.none")}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  {t("common.defaultDensity")}
                </Label>
                <p className="text-sm">{formData.default_density}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  {t("common.defaultDeliveryUnit")}
                </Label>
                <p className="text-sm">{formData.default_delivery_input_unit}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  {t("common.defaultProductionUnit")}
                </Label>
                <p className="text-sm">{formData.default_production_input_unit}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  {t("common.defaultCurrency")}
                </Label>
                <p className="text-sm">{formData.default_currency}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  {t("common.defaultPricePerLiter")}
                </Label>
                <p className="text-sm">
                  {currentPrice} {formData.default_currency}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Edit Mode
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_buyer">{t("common.defaultBuyer")}</Label>
                <Select
                  value={formData.default_buyer_id || "none"}
                  onValueChange={(value) => handleInputChange("default_buyer_id", value === "none" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.selectOption")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("common.none")}</SelectItem>
                    {buyers.map(buyer => (
                      <SelectItem key={buyer.id} value={buyer.id}>
                        {buyer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_density">{t("common.defaultDensity")}</Label>
                <Input
                  id="default_density"
                  type="number"
                  step="0.01"
                  value={isNaN(formData.default_density) ? "" : formData.default_density}
                  onChange={(e) => handleInputChange("default_density", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_delivery_unit">{t("common.defaultDeliveryUnit")}</Label>
                <Select
                  value={formData.default_delivery_input_unit}
                  onValueChange={(value) => handleInputChange("default_delivery_input_unit", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="l">{t("common.liters")}</SelectItem>
                    <SelectItem value="lb">{t("common.pounds")}</SelectItem>
                    <SelectItem value="kg">{t("common.kilograms")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_production_unit">{t("common.defaultProductionUnit")}</Label>
                <Select
                  value={formData.default_production_input_unit}
                  onValueChange={(value) => handleInputChange("default_production_input_unit", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lb">{t("common.pounds")}</SelectItem>
                    <SelectItem value="l">{t("common.liters")}</SelectItem>
                    <SelectItem value="kg">{t("common.kilograms")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_currency">{t("common.defaultCurrency")}</Label>
                <Select
                  value={formData.default_currency}
                  onValueChange={(value) => handleInputChange("default_currency", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="COP">COP</SelectItem>
                    <SelectItem value="MXN">MXN</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_price_per_l">{t("common.defaultPricePerLiter")}</Label>
                {formData.default_buyer_id && formData.default_buyer_id !== "none" && milkPrices.length > 0 ? (
                  <Select
                    value={formData.default_price_per_l.toString()}
                    onValueChange={(value) => handleInputChange("default_price_per_l", parseFloat(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("common.selectOption")} />
                    </SelectTrigger>
                    <SelectContent>
                      {milkPrices.map(price => (
                        <SelectItem key={price.id} value={parseFloat(price.price_per_l).toString()}>
                          {parseFloat(price.price_per_l).toFixed(2)} {formData.default_currency} - {new Date(price.date).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="default_price_per_l"
                    type="number"
                    step="0.01"
                    value={isNaN(formData.default_price_per_l) ? "" : formData.default_price_per_l}
                    onChange={(e) => handleInputChange("default_price_per_l", parseFloat(e.target.value) || 0)}
                    required
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                <Save className="h-4 w-4 mr-2" />
                {isPending ? t("common.loading") : t("common.update")}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}