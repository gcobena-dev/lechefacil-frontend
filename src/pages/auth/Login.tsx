import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Milk, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useMutation } from "@tanstack/react-query";
import { login as apiLogin } from "@/services/auth";
import { setToken, setMustChangePassword } from "@/services/config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Simple check: token presence
  const isAuthenticated = Boolean(localStorage.getItem('lf_token'));
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const { mutateAsync: doLogin } = useMutation({
    mutationFn: (vars: { email: string; password: string }) =>
      apiLogin({ email: vars.email, password: vars.password }),
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await doLogin({ email, password });
      setToken(res.access_token);
      // store must_change_password flag
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

  // Magic link deshabilitado

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Milk className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">{t("auth.loginTitle")}</CardTitle>
            <CardDescription>
              {t("auth.loginDescription")}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
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
          
          <div className="mt-6 pt-6 border-t">
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>{t("auth.loginInstructions")}</p>
              <Button
                type="button"
                variant="link"
                onClick={() => navigate("/signin")}
                className="text-sm p-0 h-auto"
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
