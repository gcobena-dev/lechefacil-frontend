import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { me as apiMe } from "@/services/auth";
import { useTranslation } from "@/hooks/useTranslation";

interface ProfileData {
  name: string;
  email: string;
  role: 'admin' | 'worker' | 'vet';
  farmName: string;
  phone: string;
  address: string;
  notifications: boolean;
  darkMode: boolean;
}

export default function Profile() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const [profileData, setProfileData] = useState<ProfileData>({
    name: "Admin Usuario",
    email: "admin@farm.com",
    role: "admin",
    farmName: "Finca Dos Hermanos",
    phone: "+1 234 567 8900",
    address: "",
    notifications: true,
    darkMode: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: t("common.profileUpdated"),
      description: t("common.profileUpdatedDescription"),
    });
  };

  const handleInputChange = (field: keyof ProfileData, value: string | boolean) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: apiMe });
  const emailValue = meData?.email ?? profileData.email;
  const displayName = useMemo(() => (emailValue ? emailValue.split("@")[0] : profileData.name), [emailValue]);
  const roleLabel = useMemo(() => {
    const r = (meData as any)?.active_role ?? profileData.role;
    const map: Record<string, string> = {
      ADMIN: t("common.administrator"),
      admin: t("common.administrator"),
      WORKER: t("common.cowboy"),
      worker: t("common.cowboy"),
      VET: t("common.veterinarian"),
      vet: t("common.veterinarian")
    };
    return map[r] ?? String(r);
  }, [meData, profileData.role, t]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("common.profileConfigTitle")}</h1>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Personal Information */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("common.personalInformation")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("common.name")}</Label>
                  <Input id="name" value={displayName} disabled />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">{t("common.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailValue}
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">{t("common.role")}</Label>
                  <Input id="role" value={roleLabel} disabled />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("common.phone")}</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="farmName">{t("common.farmName")}</Label>
                <Input
                  id="farmName"
                  value={profileData.farmName}
                  onChange={(e) => handleInputChange("farmName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t("common.address")}</Label>
                <Textarea
                  id="address"
                  value={profileData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full">
                {t("common.saveChanges")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t("common.settings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("common.darkMode")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("common.changeTheme")}
                  </p>
                </div>
                <Switch
                  checked={profileData.darkMode}
                  onCheckedChange={(checked) => handleInputChange("darkMode", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t("common.notifications")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("common.pushNotifications")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("common.receiveAlerts")}
                  </p>
                </div>
                <Switch
                  checked={profileData.notifications}
                  onCheckedChange={(checked) => handleInputChange("notifications", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
