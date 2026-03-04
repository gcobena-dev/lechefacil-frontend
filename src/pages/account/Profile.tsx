import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { User, Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { me as apiMe, updateProfile as apiUpdateProfile } from "@/services/auth";
import { useTranslation } from "@/hooks/useTranslation";

export default function Profile() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [farmName, setFarmName] = useState("Finca Dos Hermanos");
  const [phone, setPhone] = useState("+1 234 567 8900");
  const [address, setAddress] = useState("");
  const [notifications, setNotifications] = useState(true);

  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: apiMe });

  useEffect(() => {
    if (meData) {
      setFirstName(meData.first_name || "");
      setLastName(meData.last_name || "");
    }
  }, [meData]);

  const { mutateAsync: doUpdateProfile, isPending } = useMutation({
    mutationFn: apiUpdateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const emailValue = meData?.email ?? "";
  const displayName = useMemo(() => {
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return emailValue ? emailValue.split("@")[0] : "";
  }, [firstName, lastName, emailValue]);

  const roleLabel = useMemo(() => {
    const r = (meData as any)?.active_role ?? "";
    const map: Record<string, string> = {
      ADMIN: t("common.administrator"),
      admin: t("common.administrator"),
      WORKER: t("common.cowboy"),
      worker: t("common.cowboy"),
      VET: t("common.veterinarian"),
      vet: t("common.veterinarian")
    };
    return map[r] ?? String(r);
  }, [meData, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await doUpdateProfile({
        first_name: firstName || null,
        last_name: lastName || null,
      });
      toast({
        title: t("common.profileUpdated"),
        description: t("common.profileUpdatedDescription"),
      });
    } catch {
      toast({
        title: t("common.error"),
        description: t("common.updateError"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
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
                  <Label htmlFor="firstName">{t("auth.firstName")}</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t("auth.firstNamePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">{t("auth.lastName")}</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t("auth.lastNamePlaceholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("common.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailValue}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">{t("common.role")}</Label>
                  <Input id="role" value={roleLabel} disabled />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("common.phone")}</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="farmName">{t("common.farmName")}</Label>
                  <Input
                    id="farmName"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t("common.address")}</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? t("common.loading") : t("common.saveChanges")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notifications */}
        <div className="space-y-6">
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
                  checked={notifications}
                  onCheckedChange={(checked) => setNotifications(checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
