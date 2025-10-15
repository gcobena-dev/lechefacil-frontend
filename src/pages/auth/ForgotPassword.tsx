import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { useMutation } from "@tanstack/react-query";
import { requestPasswordReset } from "@/services/auth";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const { mutateAsync: doRequest, isPending } = useMutation({
    mutationFn: (vars: { email: string }) => requestPasswordReset(vars),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await doRequest({ email });
    } finally {
      // Always show same confirmation to avoid email enumeration
      setShowDialog(true);
    }
  };

  return (
    <>
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl">{t("auth.forgotPasswordTitle")}</CardTitle>
          <CardDescription>{t("auth.forgotPasswordDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? t("auth.sending") : t("auth.sendResetLink")}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/login")}>{t("auth.backToLogin")}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.info")}</DialogTitle>
            <DialogDescription>{t("auth.resetRequestedDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => navigate("/login", { replace: true })}>{t("auth.backToLogin")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
