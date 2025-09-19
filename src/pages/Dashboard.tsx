import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Milk, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Users,
  AlertTriangle,
  Plus
} from "lucide-react";
import { mockMilkCollections, mockAnimals, formatCurrency } from "@/lib/mock-data";
import { RoleBasedSections } from "@/components/dashboard/RoleBasedSections";
import { Link } from "react-router-dom";

export default function Dashboard() {
  // Mock user role - in real app this would come from auth context
  const [userRole] = useState<'ADMIN' | 'WORKER' | 'VET'>('ADMIN');
  
  // Calculate today's KPIs
  const today = new Date().toISOString().split('T')[0];
  const todayCollections = mockMilkCollections.filter(c => c.date === today);
  
  const todayLiters = todayCollections.reduce((sum, c) => sum + c.liters, 0);
  const todayAmount = todayCollections.reduce((sum, c) => sum + c.amount, 0);
  const avgPerAnimal = todayLiters / mockAnimals.filter(a => a.status === 'active').length;

  // Top producing animals (mock data for today)
  const topAnimals = [
    { name: 'Esperanza', tag: 'A001', liters: 18.5, trend: 'up' },
    { name: 'Bonita', tag: 'A002', liters: 16.2, trend: 'up' },
    { name: 'Paloma', tag: 'B001', liters: 15.8, trend: 'down' },
    { name: 'Luna', tag: 'B002', liters: 14.3, trend: 'up' },
    { name: 'Estrella', tag: 'C001', liters: 13.7, trend: 'up' }
  ];

  // Alerts and notifications
  const alerts = [
    { type: 'health', message: 'Bonita - Retiro de leche hasta 15/09', priority: 'high' },
    { type: 'production', message: 'Producción -5% vs ayer', priority: 'medium' },
    { type: 'price', message: 'Nuevo precio: $0.48/L - Lácteos del Valle', priority: 'low' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Resumen de actividad del {new Date().toLocaleDateString('es-EC', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        {/* Quick Action Button - Always visible */}
        <Button asChild className="shadow-lg w-full sm:w-auto">
          <Link to="/milk/collect">
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Registrar Ordeño</span>
            <span className="sm:hidden">Ordeño</span>
          </Link>
        </Button>
      </div>

      {/* Role-based sections */}
      <div className="grid gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3 space-y-6">

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Litros Hoy</CardTitle>
            <Milk className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayLiters.toFixed(1)}L</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +12% vs ayer
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayAmount)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +8% vs ayer
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio/Animal</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPerAnimal.toFixed(1)}L</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-warning flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                -2% vs ayer
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Animales Activos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnimals.filter(a => a.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              Total en producción
            </p>
          </CardContent>
        </Card>
      </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top 5 Animals */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Productoras Hoy</CardTitle>
                <CardDescription>Animales con mayor producción</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topAnimals.map((animal, index) => (
                    <div key={animal.tag} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{animal.name}</p>
                          <p className="text-sm text-muted-foreground">{animal.tag}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{animal.liters}L</span>
                        {animal.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-warning" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Alerts and Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas y Notificaciones</CardTitle>
                <CardDescription>Información importante para revisar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                      <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                        alert.priority === 'high' ? 'text-destructive' :
                        alert.priority === 'medium' ? 'text-warning' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <Badge 
                          variant={
                            alert.priority === 'high' ? 'destructive' : 
                            alert.priority === 'medium' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {alert.type === 'health' ? 'Salud' : 
                           alert.type === 'production' ? 'Producción' : 'Precio'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Role-based sidebar */}
        <div>
          <RoleBasedSections userRole={userRole} />
        </div>
      </div>

      {/* Production Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso del Día</CardTitle>
          <CardDescription>Meta diaria vs. producción actual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Ordeño Matutino</span>
              <span className="text-success font-medium">Completado</span>
            </div>
            <Progress value={100} className="h-2" />
            
            <div className="flex justify-between text-sm">
              <span>Meta Diaria (120L)</span>
              <span className="font-medium">{((todayLiters / 120) * 100).toFixed(0)}%</span>
            </div>
            <Progress value={(todayLiters / 120) * 100} className="h-2" />
            
            <div className="flex justify-between text-sm">
              <span>Ordeño Vespertino</span>
              <span className="text-muted-foreground">Pendiente 18:00</span>
            </div>
            <Progress value={0} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}