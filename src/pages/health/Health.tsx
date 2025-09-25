import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Heart, Plus, AlertTriangle, CheckCircle } from "lucide-react";
import { mockHealthEvents, formatDate } from "@/lib/mock-data";

export default function Health() {
  const [healthEvents] = useState(mockHealthEvents);

  const activeEvents = healthEvents.filter(event => !event.withdrawal_until || new Date(event.withdrawal_until) > new Date());
  const recentEvents = healthEvents.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Salud Animal</h1>
          <p className="text-muted-foreground">Monitoreo y seguimiento veterinario</p>
        </div>
        <Button asChild>
          <Link to="/health/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Evento
          </Link>
        </Button>
      </div>

      {/* Health Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Activos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tratamientos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthEvents.filter(e => e.type === "tratamiento").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Completados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Health Events - Desktop */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Eventos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Animal</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.animal_id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.type}</Badge>
                    </TableCell>
                    <TableCell>{event.diagnosis}</TableCell>
                    <TableCell>{formatDate(event.date)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={event.withdrawal_until && new Date(event.withdrawal_until) > new Date() ? "destructive" : "default"}
                      >
                        {event.withdrawal_until && new Date(event.withdrawal_until) > new Date() ? "Activo" : "Completado"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Health Events - Mobile */}
      <div className="md:hidden space-y-4">
        <h2 className="text-lg font-semibold">Eventos Recientes</h2>
        {recentEvents.map((event) => (
          <Card key={event.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">{event.animal_id}</div>
                  <Badge variant="outline" className="text-xs">{event.type}</Badge>
                </div>
                <Badge 
                  variant={event.withdrawal_until && new Date(event.withdrawal_until) > new Date() ? "destructive" : "default"}
                >
                  {event.withdrawal_until && new Date(event.withdrawal_until) > new Date() ? "Activo" : "Completado"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{event.diagnosis}</p>
              <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}