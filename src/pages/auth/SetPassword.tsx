import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useMutation } from "@tanstack/react-query";
import { setPassword as apiSetPassword } from "@/services/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function SetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const { mutateAsync: doSetPassword, isPending, isSuccess } = useMutation({
    mutationFn: (vars: { token: string; new_password: string }) => apiSetPassword(vars),
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tkn = params.get("token");
    if (tkn) {
      setToken(tkn);
    } else {
      // Si no hay token, redirigir al login
      setErrorDialog({
        open: true,
        message: t("auth.invalidTokenMessage") || "Token inválido o faltante"
      });
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    }
  }, [location.search, navigate, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      setErrorDialog({ open: true, message: t("auth.passwordMismatch") });
      return;
    }

    // Validación básica de contraseña
    if (password.length < 8) {
      setErrorDialog({
        open: true,
        message: t("auth.passwordTooShort") || "La contraseña debe tener al menos 8 caracteres"
      });
      return;
    }

    try {
      const result = await doSetPassword({ token, new_password: password });
      setSuccessMessage(result.message || t("auth.passwordSetSuccess"));

      // Clear any existing session tokens before redirecting to login
      localStorage.removeItem("lf_token");
      localStorage.removeItem("lf_tenant_id");

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err: any) {
      const errorMsg = err?.message || t("auth.passwordSetError");
      setErrorDialog({ open: true, message: errorMsg });
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-background to-secondary p-4">
        <Card className="w-full max-w-md shadow-strong">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl">{t("auth.passwordSetSuccessTitle") || "¡Contraseña Establecida!"}</CardTitle>
            <CardDescription>{successMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                {t("auth.redirectingToLogin") || "Redirigiendo al inicio de sesión..."}
              </AlertDescription>
            </Alert>
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                localStorage.removeItem("lf_token");
                localStorage.removeItem("lf_tenant_id");
                navigate("/login", { replace: true });
              }}
            >
              {t("auth.goToLogin") || "Ir al Inicio de Sesión"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl">
            {t("auth.setPasswordTitle") || "Establece tu Contraseña"}
          </CardTitle>
          <CardDescription>
            {t("auth.setPasswordDescription") || "Crea una contraseña segura para tu cuenta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.newPasswordLabel")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder") || "Mínimo 8 caracteres"}
                  required
                  minLength={8}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">{t("auth.confirmNewPasswordLabel")}</Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder") || "Mínimo 8 caracteres"}
                  required
                  minLength={8}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                {t("auth.passwordRequirements") || "La contraseña debe tener al menos 8 caracteres."}
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? t("auth.saving") : (t("auth.setPasswordButton") || "Establecer Contraseña")}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                localStorage.removeItem("lf_token");
                localStorage.removeItem("lf_tenant_id");
                navigate("/login");
              }}
            >
              {t("auth.backToLogin")}
            </Button>
          </form>
        </CardContent>
      </Card>

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
    </div>
  );
}
