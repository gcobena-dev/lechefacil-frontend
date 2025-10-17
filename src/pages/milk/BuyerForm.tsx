import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBuyer } from "@/services/buyers";
import { useTranslation } from "@/hooks/useTranslation";

export default function BuyerForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    contact: "",
  });

  const { mutateAsync: doCreate, isPending } = useMutation({
    mutationFn: (vars: typeof formData) =>
      createBuyer({ name: vars.name, code: vars.code || undefined, contact: vars.contact || undefined, is_active: true }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: t('milk.nameRequiredError'), description: t('milk.enterBuyerName'), variant: "destructive" });
      return;
    }
    try {
      await doCreate(formData);
      await queryClient.invalidateQueries({ queryKey: ["buyers"] });
      toast({ title: t('milk.buyerCreated'), description: t('milk.buyerSavedCorrectly') });
      navigate("/settings?tab=prices");
    } catch (err) {
      console.error(err);
      toast({ title: t('common.error'), description: t('milk.couldNotCreateBuyer'), variant: "destructive" });
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/settings?tab=prices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t('milk.newBuyerLabel')}</h1>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{t('milk.buyerInformation')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('milk.nameRequired')}</Label>
              <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t('milk.code')}</Label>
                <Input id="code" value={formData.code} onChange={(e) => handleInputChange("code", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">{t('milk.contactLabel')}</Label>
                <Input id="contact" value={formData.contact} onChange={(e) => handleInputChange("contact", e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button type="submit" className="flex-1" disabled={isPending}>{t('milk.saveBuyerLabel')}</Button>
              <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => navigate("/settings?tab=prices")}>
                {t('milk.cancelLabel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

