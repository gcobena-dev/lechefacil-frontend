import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

export default function NoAccess() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('auth.accessRestricted')}</CardTitle>
          <CardDescription>{t('auth.noPermissions')}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button asChild>
            <Link to="/dashboard">{t('auth.goToHome')}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/login">{t('auth.login')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

