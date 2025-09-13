import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowLeft,
  Edit, 
  Milk, 
  Heart, 
  TrendingUp,
  Calendar,
  MapPin
} from "lucide-react";
import { mockAnimals, mockMilkCollections, mockHealthEvents, formatCurrency, formatDate } from "@/lib/mock-data";

export default function AnimalDetail() {
  const { id } = useParams();
  const animal = mockAnimals.find(a => a.id === id);
  
  if (!animal) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Animal no encontrado</p>
      </div>
    );
  }

  // Get last 90 days of data
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const animalMilkData = mockMilkCollections
    .filter(c => c.animal_id === animal.id)
    .filter(c => new Date(c.date) >= ninetyDaysAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const animalHealthData = mockHealthEvents
    .filter(h => h.animal_id === animal.id)
    .filter(h => new Date(h.date) >= ninetyDaysAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate stats
  const totalLiters = animalMilkData.reduce((sum, c) => sum + c.liters, 0);
  const totalEarnings = animalMilkData.reduce((sum, c) => sum + c.amount, 0);
  const avgDaily = animalMilkData.length > 0 ? totalLiters / animalMilkData.length : 0;

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const ageInMonths = (now.getFullYear() - birth.getFullYear()) * 12 + 
                       (now.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} meses`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const remainingMonths = ageInMonths % 12;
      return `${years} años ${remainingMonths} meses`;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      sold: 'secondary',
      dead: 'destructive',
      culled: 'outline'
    } as const;

    const labels = {
      active: 'Activo',
      sold: 'Vendido', 
      dead: 'Muerto',
      culled: 'Descartado'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{animal.name}</h1>
          <p className="text-muted-foreground">Tag: {animal.tag} • {animal.breed}</p>
        </div>
        <Button className="flex items-center gap-2">
          <Edit className="h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* Animal Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              {getStatusBadge(animal.status)}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Edad</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{calculateAge(animal.birth_date)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Lote</p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{animal.lot}</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</p>
              <span>{formatDate(animal.birth_date)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-light rounded-lg">
                <Milk className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLiters.toFixed(1)}L</p>
                <p className="text-sm text-muted-foreground">Total 90 días</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgDaily.toFixed(1)}L</p>
                <p className="text-sm text-muted-foreground">Promedio diario</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Heart className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalEarnings)}</p>
                <p className="text-sm text-muted-foreground">Ingresos 90 días</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs defaultValue="production" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="production">Producción</TabsTrigger>
              <TabsTrigger value="health">Salud</TabsTrigger>
              <TabsTrigger value="movements">Movimientos</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent>
            <TabsContent value="production" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Registros de Ordeño (Últimos 90 días)</h3>
                {animalMilkData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Turno</TableHead>
                        <TableHead>Valor Original</TableHead>
                        <TableHead>Litros</TableHead>
                        <TableHead>Precio/L</TableHead>
                        <TableHead>Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {animalMilkData.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{formatDate(record.date)}</TableCell>
                          <TableCell>
                            <Badge variant={record.shift === 'AM' ? 'default' : 'secondary'}>
                              {record.shift}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.input_value} {record.input_unit}</TableCell>
                          <TableCell className="font-medium">{record.liters.toFixed(1)}L</TableCell>
                          <TableCell>{formatCurrency(record.price_per_liter)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(record.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No hay registros de producción en los últimos 90 días
                  </p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="health" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Eventos de Salud (Últimos 90 días)</h3>
                {animalHealthData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Diagnóstico</TableHead>
                        <TableHead>Tratamiento</TableHead>
                        <TableHead>Retiro hasta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {animalHealthData.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>{formatDate(event.date)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{event.type}</Badge>
                          </TableCell>
                          <TableCell>{event.diagnosis}</TableCell>
                          <TableCell>{event.treatment} ({event.dose})</TableCell>
                          <TableCell>
                            {event.withdrawal_until ? (
                              <Badge variant="destructive">
                                {formatDate(event.withdrawal_until)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No hay eventos de salud registrados en los últimos 90 días
                  </p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="movements" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Historial de Movimientos</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Ingreso a la finca</p>
                      <p className="text-sm text-muted-foreground">{formatDate(animal.created_at)}</p>
                    </div>
                  </div>
                  
                  {animal.status !== 'active' && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {animal.status === 'sold' ? 'Vendido' : 
                           animal.status === 'culled' ? 'Descartado' : 'Muerto'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Fecha por determinar
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}