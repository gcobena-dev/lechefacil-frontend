import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { performLogout } from "@/services/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Mail, Send, User, Building, Home } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const RequestAccess = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    farmName: "",
    farmLocation: "",
    requestedRole: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const { mutateAsync: submitAccess, isPending } = useMutation({
    mutationFn: async (data: typeof formData) => {
      const base = import.meta.env.VITE_API_URL as string;
      const res = await fetch(new URL("/api/v1/access-requests/", base).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: data.fullName,
          email: data.email,
          phone_number: data.phoneNumber || null,
          farm_name: data.farmName,
          farm_location: data.farmLocation,
          requested_role: data.requestedRole,
          message: data.message || null,
        }),
      });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitAccess(formData);
      toast({
        title: t('auth.requestSent'),
        description: t('auth.requestSentDescription'),
      });
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        farmName: "",
        farmLocation: "",
        requestedRole: "",
        message: "",
      });
    } catch (err) {
      toast({ title: t('common.error'), description: t('auth.requestError'), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Home className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold">
                {t('auth.requestAccessTitle')}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {t('auth.requestAccessDescription')}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('auth.fullName')}
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    placeholder={t('auth.fullNamePlaceholder')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t('auth.emailLabel')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">{t('auth.phoneNumber')}</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  placeholder={t('auth.phoneNumberPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="farmName" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {t('auth.farmName')}
                  </Label>
                  <Input
                    id="farmName"
                    type="text"
                    value={formData.farmName}
                    onChange={(e) => handleInputChange("farmName", e.target.value)}
                    placeholder={t('auth.farmNamePlaceholder')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="farmLocation">{t('auth.farmLocation')}</Label>
                  <Input
                    id="farmLocation"
                    type="text"
                    value={formData.farmLocation}
                    onChange={(e) => handleInputChange("farmLocation", e.target.value)}
                    placeholder={t('auth.farmLocationRequestPlaceholder')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestedRole">{t('auth.requestedRole')}</Label>
                <Select
                  value={formData.requestedRole}
                  onValueChange={(value) => handleInputChange("requestedRole", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('auth.requestedRolePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">{t('auth.worker')}</SelectItem>
                    <SelectItem value="vet">{t('auth.vet')}</SelectItem>
                    <SelectItem value="admin">{t('auth.admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t('auth.additionalMessage')}</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  placeholder={t('auth.additionalMessagePlaceholder')}
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || isPending}
              >
                {isSubmitting || isPending ? (
                  t('auth.sending')
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t('auth.sendRequest')}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border/50">
              <div className="text-center text-sm text-muted-foreground">
                <p>{t('auth.alreadyHaveAccount')}</p>
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={async () => {
                    await performLogout();
                    navigate("/login");
                  }}
                >
                  {t('auth.signIn')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RequestAccess;
