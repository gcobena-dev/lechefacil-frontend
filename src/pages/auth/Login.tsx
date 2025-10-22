import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Fingerprint, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useMutation } from "@tanstack/react-query";
import { login as apiLogin } from "@/services/auth";
import { setToken, setMustChangePassword } from "@/services/config";
import { biometricService } from "@/services/biometricService";
import { BiometryType } from "@capgo/capacitor-native-biometric";
import { VersionLabel } from "@/components/updates/VersionLabel";
import { Capacitor, registerPlugin } from "@capacitor/core";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType>();
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const [biometricPromptDialog, setBiometricPromptDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const SERVER_ID = 'com.lechefacil.app';
  // Register App plugin on native only
  const App = Capacitor.isNativePlatform() ? registerPlugin<any>('App') : null;

  // Simple check: token presence
  const isAuthenticated = Boolean(localStorage.getItem('lf_token'));

  // ✅ IMPORTANTE: Todos los hooks ANTES del return temprano
  const { mutateAsync: doLogin } = useMutation({
    mutationFn: (vars: { email: string; password: string }) =>
      apiLogin({ email: vars.email, password: vars.password }),
  });

  useEffect(() => {
    checkBiometric();

    // When app resumes from background, re-check biometric availability/credentials
    if (App && App.addListener) {
      const sub = App.addListener('resume', () => {
        checkBiometric();
      });
      // Also refresh when tab gains visibility (webview comes to foreground)
      const onVisibility = () => {
        if (document.visibilityState === 'visible') {
          checkBiometric();
        }
      };
      document.addEventListener('visibilitychange', onVisibility);

      return () => {
        try {
          // Capacitor v6 listeners return an object with remove()
          if (sub && typeof sub.remove === 'function') {
            sub.remove();
          }
        } catch (err) {
          // Swallow cleanup errors (best-effort)
          console.debug('Listener cleanup error', err);
        }
        document.removeEventListener('visibilitychange', onVisibility);
      };
    }
  }, []);

  const checkBiometric = async () => {
    const { isAvailable, biometryType } = await biometricService.isAvailable();
    setBiometricAvailable(isAvailable);
    setBiometryType(biometryType);

    if (isAvailable) {
      const hasCredentials = await biometricService.hasCredentials(SERVER_ID);
      setHasSavedCredentials(hasCredentials);
    }
  };

  // ✅ Return temprano DESPUÉS de todos los hooks
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      const credentials = await biometricService.authenticateAndGetCredentials(SERVER_ID, {
        reason: t("auth.biometricVerifyReason"),
        title: t("auth.biometricVerifyTitle"),
        subtitle: t("auth.biometricVerifySubtitle"),
        description: t("auth.biometricVerifyDescription"),
        negativeButtonText: t("auth.biometricVerifyCancel"),
      });

      if (credentials) {
        // Intentar login con las credenciales recuperadas
        const res = await doLogin({ email: credentials.username, password: credentials.password });
        setToken(res.access_token);
        setMustChangePassword(res.must_change_password);
        const count = res.memberships?.length ?? 0;
        if (count === 0) {
          navigate("/request-access");
        } else if (count === 1) {
          localStorage.setItem("lf_tenant_id", res.memberships[0].tenant_id);
          navigate(res.must_change_password ? "/force-change-password" : "/dashboard");
        } else {
          navigate("/select-farm");
        }
      }
    } catch (err: any) {
      setErrorDialog({ open: true, message: t("auth.biometricLoginError") });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await doLogin({ email, password });
      setToken(res.access_token);
      // store must_change_password flag
      setMustChangePassword(res.must_change_password);

      // Determinar a dónde navegar
      const count = res.memberships?.length ?? 0;
      let targetRoute = "/request-access";

      if (count === 1) {
        localStorage.setItem("lf_tenant_id", res.memberships[0].tenant_id);
        targetRoute = res.must_change_password ? "/force-change-password" : "/dashboard";
      } else if (count > 1) {
        targetRoute = "/select-farm";
      }

      // Re-evaluar biometría justo después del login por si cambió en SO
      let canPrompt = false;
      try {
        const avail = await biometricService.isAvailable();
        setBiometricAvailable(avail.isAvailable);
        setBiometryType(avail.biometryType);
        const saved = avail.isAvailable
          ? await biometricService.hasCredentials(SERVER_ID)
          : false;
        setHasSavedCredentials(saved);
        canPrompt = avail.isAvailable && !saved;
      } catch {
        canPrompt = false;
      }

      // Si el login fue exitoso y la biometría está disponible, preguntar ANTES de navegar
      if (canPrompt) {
        setPendingNavigation(targetRoute);
        setBiometricPromptDialog(true);
      } else {
        // Navegar directamente si no hay biometría disponible
        navigate(targetRoute);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.message?.includes("VITE_API_URL")
        ? t("auth.configError")
        : t("auth.loginError");
      setErrorDialog({ open: true, message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableBiometric = async () => {
    await biometricService.deleteCredentials(SERVER_ID);
    setHasSavedCredentials(false);
  };

  const handleBiometricPromptAccept = async () => {
    try {
      await biometricService.saveCredentials(SERVER_ID, email, password);
      setHasSavedCredentials(true);
    } catch (bioErr) {
      // No bloquear el login si falla guardar biometría
    } finally {
      setBiometricPromptDialog(false);
      if (pendingNavigation) {
        navigate(pendingNavigation);
        setPendingNavigation(null);
      }
    }
  };

  const handleBiometricPromptDecline = () => {
    setBiometricPromptDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  // Magic link deshabilitado

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-background to-secondary p-4 relative">
      {/* Version label in bottom left corner */}
      <div className="fixed bottom-4 left-4">
        <VersionLabel variant="small" />
      </div>

      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex items-center justify-center">
            <img src="/logo.png" alt="LecheFácil" className="h-24 w-auto" />
          </div>
          <div>
            <CardTitle className="text-2xl">{t("auth.loginTitle")}</CardTitle>
            <CardDescription>
              {t("auth.loginDescription")}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Botón de autenticación biométrica */}
          {biometricAvailable && hasSavedCredentials && (
            <div className="mb-4">
              <Button
                onClick={handleBiometricLogin}
                className="w-full"
                variant="outline"
                size="lg"
                disabled={loading}
              >
                <Fingerprint className="mr-2 h-5 w-5" />
                {t("auth.biometricLoginWith")} {biometricService.getBiometryTypeName(biometryType!)}
              </Button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t("auth.biometricContinueWithEmail")}
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.passwordLabel")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  required
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

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? t("auth.loginInProgress") : t("auth.loginButton")}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t space-y-4">
            {/* Opción para desactivar biométrica */}
            {hasSavedCredentials && (
              <Button
                onClick={handleDisableBiometric}
                variant="ghost"
                className="w-full text-sm"
                type="button"
              >
                {t("auth.biometricDisable")}
              </Button>
            )}

            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>{t("auth.loginInstructions")}</p>
              <Button
                type="button"
                variant="link"
                onClick={() => navigate("/forgot-password")}
                className="text-xs md:text-sm p-0 h-auto"
              >
                {t("auth.forgotPassword")}
              </Button>
              <br />
              <Button
                type="button"
                variant="link"
                onClick={() => navigate("/signin")}
                className="text-xs md:text-sm p-0 h-auto"
              >
                {t("auth.noAccount")}
              </Button>
            </div>
          </div>
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

      {/* Biometric Prompt Dialog */}
      <Dialog open={biometricPromptDialog} onOpenChange={setBiometricPromptDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <Fingerprint className="h-12 w-12 text-primary" />
            </div>
            <DialogTitle className="text-center">{t("auth.biometricEnableTitle") || "Habilitar Autenticación Biométrica"}</DialogTitle>
            <DialogDescription className="text-center">
              {`${t("auth.biometricEnablePrompt")} ${biometricService.getBiometryTypeName(biometryType!)}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={handleBiometricPromptDecline} variant="outline" className="w-full sm:w-auto">
              {t("common.no") || "No"}
            </Button>
            <Button onClick={handleBiometricPromptAccept} className="w-full sm:w-auto">
              {t("common.yes") || "Sí"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
