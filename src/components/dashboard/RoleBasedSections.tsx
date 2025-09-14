import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Milk, 
  Plus, 
  Heart, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";

interface RoleBasedSectionsProps {
  userRole: 'ADMIN' | 'WORKER' | 'VET';
}

export function RoleBasedSections({ userRole }: RoleBasedSectionsProps) {
  if (userRole === 'WORKER') {
    return (
      <div className="space-y-6">
        {/* Quick Action Card for Workers */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Milk className="h-5 w-5 text-primary" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link to="/milk/collect">
                <Button className="w-full" size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Ordeño
                </Button>
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/animals">
                    Ver Animales
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/health">
                    Reportar Salud
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Progress for Workers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Mi Progreso Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Animales ordeñados</span>
                <Badge variant="secondary">12/24</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Litros registrados</span>
                <span className="font-medium">186.5L</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Turno actual</span>
                <Badge>Matutino</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userRole === 'VET') {
    return (
      <div className="space-y-6">
        {/* Health Alerts for Vets */}
        <Card className="border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-warning" />
              Alertas Sanitarias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-warning/20">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-warning" />
                <div>
                  <p className="text-sm font-medium">Bonita (A002) - Retiro de leche</p>
                  <p className="text-xs text-muted-foreground">Hasta 15/09 - Tratamiento antibiótico</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Luna (B002) - Revisión programada</p>
                  <p className="text-xs text-muted-foreground">Chequeo reproductivo pendiente</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/health">
                  <Heart className="w-4 h-4 mr-2" />
                  Ver Todos los Eventos
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Health Summary for Vets */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen Sanitario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Animales en tratamiento</span>
                <span className="font-medium text-warning">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Retiros de leche activos</span>
                <span className="font-medium text-destructive">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Próximas vacunaciones</span>
                <span className="font-medium">5</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ADMIN role - comprehensive overview
  return (
    <div className="space-y-6">
      {/* Quick Actions for Admin */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild>
              <Link to="/milk/collect">
                <Milk className="w-4 h-4 mr-2" />
                Registrar Ordeño
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/animals">
                Gestionar Animales
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/milk/prices">
                <DollarSign className="w-4 h-4 mr-2" />
                Precios
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/reports">
                <FileText className="w-4 h-4 mr-2" />
                Reportes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Management Overview for Admin */}
      <Card>
        <CardHeader>
          <CardTitle>Vista General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rentabilidad mes</span>
              <span className="font-medium text-success flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +15.2%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Producción vs meta</span>
              <span className="font-medium">102%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Alertas pendientes</span>
              <Badge variant="destructive">3</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Próximas tareas</span>
              <span className="font-medium">7</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}