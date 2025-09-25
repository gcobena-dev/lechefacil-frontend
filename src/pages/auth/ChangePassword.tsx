import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("auth.changePasswordTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm onSuccess={() => navigate('/dashboard')} />
        </CardContent>
      </Card>
    </div>
  );
}

