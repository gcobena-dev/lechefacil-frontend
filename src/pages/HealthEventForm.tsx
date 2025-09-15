import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { mockAnimals } from "@/lib/mock-data";

interface HealthEventFormData {
  animalId: string;
  eventType: 'vaccination' | 'treatment' | 'checkup' | 'injury' | 'illness';
  eventDate: string;
  description: string;
  veterinarian: string;
  cost: string;
  notes: string;
}

export default function HealthEventForm() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<HealthEventFormData>({
    animalId: "",
    eventType: "checkup",
    eventDate: "",
    description: "",
    veterinarian: "",
    cost: "",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const animal = mockAnimals.find(a => a.id === formData.animalId);
    
    toast({
      title: "Evento de salud registrado",
      description: `${formData.eventType} registrado para ${animal?.name || animal?.tag}`,
    });
    
    navigate("/health");
  };

  const handleInputChange = (field: keyof HealthEventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const eventTypeLabels = {
    vaccination: "Vacunación",
    treatment: "Tratamiento",
    checkup: "Chequeo",
    injury: "Lesión",
    illness: "Enfermedad"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/health")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Nuevo Evento de Salud</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="animalId">Animal *</Label>
                <Select value={formData.animalId} onValueChange={(value) => handleInputChange("animalId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar animal" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockAnimals.map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.tag} - {animal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="eventType">Tipo de Evento *</Label>
                <Select value={formData.eventType} onValueChange={(value: any) => handleInputChange("eventType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(eventTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate">Fecha del Evento *</Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={(e) => handleInputChange("eventDate", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Descripción del evento"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="veterinarian">Veterinario</Label>
                <Input
                  id="veterinarian"
                  value={formData.veterinarian}
                  onChange={(e) => handleInputChange("veterinarian", e.target.value)}
                  placeholder="Nombre del veterinario"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cost">Costo</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => handleInputChange("cost", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Notas adicionales"
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                Registrar Evento
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/health")}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}