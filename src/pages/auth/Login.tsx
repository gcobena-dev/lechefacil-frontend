import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Fingerprint, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useMutation } from "@tanstack/react-query";
import { login as apiLogin } from "@/services/auth";
import { setToken, setMustChangePassword } from "@/services/config";
import { biometricService } from "@/services/biometricService";
import { BiometryType } from "@capgo/capacitor-native-biometric";
import { VersionLabel } from "@/components/updates/VersionLabel";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType>();
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const SERVER_ID = 'com.lechefacil.app';

  // Simple check: token presence
  const isAuthenticated = Boolean(localStorage.getItem('lf_token'));

  // ✅ IMPORTANTE: Todos los hooks ANTES del return temprano
  const { mutateAsync: doLogin } = useMutation({
    mutationFn: (vars: { email: string; password: string }) =>
      apiLogin({ email: vars.email, password: vars.password }),
  });

  useEffect(() => {
    checkBiometric();
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
      alert(t("auth.biometricLoginError"));
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

      // Si el login fue exitoso y la biometría está disponible, preguntar ANTES de navegar
      if (biometricAvailable && !hasSavedCredentials) {
        try {
          // Preguntar si quiere guardar credenciales
          const shouldSave = confirm(
            `${t("auth.biometricEnablePrompt")} ${biometricService.getBiometryTypeName(biometryType!)}?`
          );

          if (shouldSave) {
            await biometricService.saveCredentials(SERVER_ID, email, password);
            setHasSavedCredentials(true);
          }
        } catch (bioErr) {
          // No bloquear el login si falla guardar biometría
        }
      }

      // Navegar después de intentar guardar biometría
      navigate(targetRoute);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message?.includes("VITE_API_URL")
        ? t("auth.configError")
        : t("auth.loginError");
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableBiometric = async () => {
    await biometricService.deleteCredentials(SERVER_ID);
    setHasSavedCredentials(false);
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
    </div>
  );
}
