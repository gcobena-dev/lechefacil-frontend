import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "@/services/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function ResetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const [successDialog, setSuccessDialog] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { mutateAsync: doReset, isPending } = useMutation({
    mutationFn: (vars: { token: string; new_password: string }) => resetPassword(vars),
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tkn = params.get("token");
    if (tkn) setToken(tkn);
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setErrorDialog({ open: true, message: t("auth.passwordMismatch") });
      return;
    }
    try {
      await doReset({ token, new_password: password });
      setSuccessDialog(true);
    } catch (err: any) {
      const errorMsg = t("auth.passwordUpdateError");
      setErrorDialog({ open: true, message: errorMsg });
    }
  };

  const handleSuccessClose = () => {
    setSuccessDialog(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-background to-secondary p-4">
        <Card className="w-full max-w-md shadow-strong">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl">{t("auth.resetPasswordTitle")}</CardTitle>
            <CardDescription>{t("auth.resetPasswordDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.newPasswordLabel")}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">{t("auth.confirmNewPasswordLabel")}</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? t("auth.saving") : t("auth.resetPasswordButton")}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/login")}>{t("auth.backToLogin")}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <DialogTitle className="text-center">{t("auth.passwordUpdated") || "Contraseña Actualizada"}</DialogTitle>
            <DialogDescription className="text-center">
              {t("auth.passwordUpdatedDescription") || "Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleSuccessClose} className="w-full">
              {t("auth.goToLogin") || "Ir al Inicio de Sesión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <DialogTitle className="text-center">{t("common.error") || "Error"}</DialogTitle>
            <DialogDescription className="text-center">
              {errorDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorDialog({ open: false, message: "" })} variant="outline" className="w-full">
              {t("common.close") || "Cerrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

