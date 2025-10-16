import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { User as UserIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/useTranslation";
import Profile from "./Profile";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";

export default function Account() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["profile", "password"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center mb-4">
          <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("common.myAccount")}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{t("common.manageAccountSettings")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">
            {t("common.personalInformation")}
          </TabsTrigger>
          <TabsTrigger value="password">
            {t("auth.changePasswordTitle")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Profile />
        </TabsContent>
        <TabsContent value="password" className="mt-6">
          <div className="max-w-md mx-auto">
            <ChangePasswordForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
