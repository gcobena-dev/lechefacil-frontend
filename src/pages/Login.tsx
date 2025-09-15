import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Milk, Lock, Mail } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Mock authentication - in real app would use Supabase
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Mock login - normally would authenticate with Supabase
    setTimeout(() => {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', 'ADMIN');
      localStorage.setItem('userName', 'Admin Usuario');
      navigate('/dashboard');
      setLoading(false);
    }, 1000);
  };

  const handleMagicLink = async () => {
    setLoading(true);
    // Mock magic link
    setTimeout(() => {
      alert('Enlace mágico enviado a ' + email);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Milk className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Finca Lechera</CardTitle>
            <CardDescription>
              Sistema de Gestión de Producción Lechera
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="password" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Contraseña
              </TabsTrigger>
              <TabsTrigger value="magic" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Enlace Mágico
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="password">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@finca.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="magic">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email">Correo electrónico</Label>
                  <Input
                    id="magic-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@finca.com"
                    required
                  />
                </div>
                
                <Button 
                  onClick={handleMagicLink}
                  className="w-full" 
                  disabled={loading || !email}
                >
                  {loading ? "Enviando..." : "Enviar Enlace Mágico"}
                </Button>
                
                <p className="text-sm text-muted-foreground text-center">
                  Te enviaremos un enlace para iniciar sesión sin contraseña
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 pt-6 border-t">
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p><strong>Demo:</strong> cualquier email y contraseña</p>
              <p>Roles: ADMIN, VET, WORKER</p>
              <Button
                type="button"
                variant="link"
                onClick={() => navigate("/signin")}
                className="text-sm p-0 h-auto"
              >
                ¿No tienes cuenta? Crear una
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}