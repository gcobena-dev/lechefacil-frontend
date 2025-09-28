import { useState } from "react";
import { Settings as SettingsIcon, Users, KeyRound, Building2, Layers3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsUsers from "./SettingsUsers";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";
import TenantSettings from "@/components/settings/TenantSettings";
import Catalogs from "@/components/settings/Catalogs";
import { useTranslation } from "@/hooks/useTranslation";

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("users");

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t("common.usersTitle")}</span>
            <span className="sm:hidden text-xs">{t("animals.usersShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3">
            <KeyRound className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t("auth.changePasswordTitle")}</span>
            <span className="sm:hidden text-xs">{t("animals.passwordShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="tenant" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t("common.tenantSettings")}</span>
            <span className="sm:hidden text-xs">{t("animals.configShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="catalogs" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3">
            <Layers3 className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t("animals.catalogs")}</span>
            <span className="sm:hidden text-xs">{t("animals.catalogsShort")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <SettingsUsers />
        </TabsContent>
        <TabsContent value="password" className="mt-6">
          <div className="max-w-md mx-auto">
            <ChangePasswordForm />
          </div>
        </TabsContent>
        <TabsContent value="tenant" className="mt-6">
          <TenantSettings />
        </TabsContent>
        <TabsContent value="catalogs" className="mt-6">
          <Catalogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
