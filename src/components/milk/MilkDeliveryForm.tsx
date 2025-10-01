import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Truck } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import ConfigurationInfo from "./ConfigurationInfo";
import { getLocalDateTimeInputValue } from "@/utils/dateUtils";
import type { DeliveryFormData } from "@/hooks/useMilkCollectionForm";

interface Buyer {
  id: string;
  name: string;
}

interface MilkDeliveryFormProps {
  deliveryFormData: DeliveryFormData;
  buyers: Buyer[];
  defaultPricePerL?: number;
  creatingDelivery: boolean;
  onFormDataChange: (data: Partial<DeliveryFormData>) => void;
  onSubmit: () => void;
}

export default function MilkDeliveryForm({
  deliveryFormData,
  buyers,
  defaultPricePerL,
  creatingDelivery,
  onFormDataChange,
  onSubmit
}: MilkDeliveryFormProps) {
  const { t } = useTranslation();
  const maxDateTime = getLocalDateTimeInputValue();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("milk.milkDelivery")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_datetime">{t("milk.deliveryDateTime")}</Label>
              <Input
                id="delivery_datetime"
                type="datetime-local"
                value={deliveryFormData.dateTime}
                onChange={(e) => onFormDataChange({ dateTime: e.target.value })}
                onClick={(e) => e.currentTarget.showPicker?.()}
                max={maxDateTime}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_buyer">{t("common.defaultBuyer")}</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  {deliveryFormData.buyerId ? buyers.find(b => b.id === deliveryFormData.buyerId)?.name || t('milk.notFound') : t('milk.notConfigured')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_volume">{t("milk.volumeL")}</Label>
              <Input
                id="delivery_volume"
                type="number"
                step="0.1"
                value={deliveryFormData.volumeL}
                onChange={(e) => onFormDataChange({ volumeL: e.target.value })}
                placeholder="0.0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t("milk.pricePerLiter")}</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  {defaultPricePerL !== undefined && defaultPricePerL !== null ? `$${Number(defaultPricePerL).toFixed(2)}` : t('milk.notConfigured')}
                </p>
              </div>
            </div>
          </div>

          {/* Configuration info */}
          <ConfigurationInfo />

          {/* Delivery notes - full width */}
          <div className="space-y-2">
            <Label htmlFor="delivery_notes">{t("milk.deliveryNotes")}</Label>
            <Textarea
              id="delivery_notes"
              value={deliveryFormData.notes}
              onChange={(e) => onFormDataChange({ notes: e.target.value })}
              placeholder={t("milk.deliveryNotes")}
              rows={3}
            />
          </div>

          <Button
            onClick={onSubmit}
            className="w-full"
            disabled={creatingDelivery || !deliveryFormData.buyerId || !deliveryFormData.volumeL}
          >
            <Truck className="w-4 h-4 mr-2" />
            {t("milk.deliverMilk")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
