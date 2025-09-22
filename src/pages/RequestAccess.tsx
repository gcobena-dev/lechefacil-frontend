import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Send, User, Building, Home } from "lucide-react";

const RequestAccess = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    farmName: "",
    farmLocation: "",
    requestedRole: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de acceso ha sido enviada. Te contactaremos pronto.",
      });
      setIsSubmitting(false);
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        farmName: "",
        farmLocation: "",
        requestedRole: "",
        message: "",
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Home className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold">
                Solicitar Acceso
              </CardTitle>
              <CardDescription className="text-base mt-2">
                No tienes acceso a ninguna finca. Completa el formulario para solicitar acceso.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nombre completo
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Número de teléfono</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="farmName" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Nombre de la finca
                  </Label>
                  <Input
                    id="farmName"
                    type="text"
                    value={formData.farmName}
                    onChange={(e) => handleInputChange("farmName", e.target.value)}
                    placeholder="Finca San José"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="farmLocation">Ubicación de la finca</Label>
                  <Input
                    id="farmLocation"
                    type="text"
                    value={formData.farmLocation}
                    onChange={(e) => handleInputChange("farmLocation", e.target.value)}
                    placeholder="Ciudad, Estado"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestedRole">Rol solicitado</Label>
                <Select
                  value={formData.requestedRole}
                  onValueChange={(value) => handleInputChange("requestedRole", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el rol que solicitas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">Trabajador</SelectItem>
                    <SelectItem value="vet">Veterinario</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensaje adicional (opcional)</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  placeholder="Explica por qué necesitas acceso o cualquier información adicional..."
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Enviando..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar solicitud
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border/50">
              <div className="text-center text-sm text-muted-foreground">
                <p>¿Ya tienes una cuenta?</p>
                <Button variant="link" className="p-0 h-auto font-normal">
                  Iniciar sesión
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RequestAccess;