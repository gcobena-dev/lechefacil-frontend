import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Settings as SettingsIcon, Users, Building2, Layers3, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsUsers from "./SettingsUsers";
import TenantSettings from "@/components/settings/TenantSettings";
import Catalogs from "@/components/settings/Catalogs";
import MilkPrices from "@/pages/milk/MilkPrices";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { requestPushPermissionsManually } from "@/services/push";

export default function Settings() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["users", "prices", "tenant", "catalogs"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center mb-4">
          <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("common.settings")}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{t("common.manageSystemSettings")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto p-1">
          <TabsTrigger value="users" className="flex items-center justify-center gap-1 sm:gap-2 px-2 py-2 sm:px-3">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t("common.usersTitle")}</span>
            <span className="sm:hidden text-xs truncate">{t("animals.usersShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="prices" className="flex items-center justify-center gap-1 sm:gap-2 px-2 py-2 sm:px-3">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t("milk.milkPricesTitle")}</span>
            <span className="sm:hidden text-xs truncate">{t("milk.pricesTitle")}</span>
          </TabsTrigger>
          <TabsTrigger value="tenant" className="flex items-center justify-center gap-1 sm:gap-2 px-2 py-2 sm:px-3">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t("common.tenantSettings")}</span>
            <span className="sm:hidden text-xs truncate">{t("animals.configShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="catalogs" className="flex items-center justify-center gap-1 sm:gap-2 px-2 py-2 sm:px-3">
            <Layers3 className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t("animals.catalogs")}</span>
            <span className="sm:hidden text-xs truncate">{t("animals.catalogsShort")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <SettingsUsers />
        </TabsContent>
        <TabsContent value="prices" className="mt-6">
          <MilkPrices />
        </TabsContent>
        <TabsContent value="tenant" className="mt-6">
          <TenantSettings />
        </TabsContent>
        <TabsContent value="catalogs" className="mt-6">
          <Catalogs />
        </TabsContent>
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={() => requestPushPermissionsManually()}>
            {t('notifications.requestPermissions')}
          </Button>
        </div>
      </Tabs>
    </div>
  );
}
