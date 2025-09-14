import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Milk, Calculator, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { mockAnimals, mockBuyers, convertToLiters, formatCurrency } from "@/lib/mock-data";

export default function MilkCollect() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'AM',
    animalId: '',
    inputValue: '',
    inputUnit: 'L',
    density: '1.03',
    buyerId: '',
    customPrice: '',
    notes: ''
  });

  const [recentEntries, setRecentEntries] = useState([
    { animal: 'Esperanza (A001)', amount: '18.5L', time: '06:30' },
    { animal: 'Bonita (A002)', amount: '16.2L', time: '06:32' },
    { animal: 'Paloma (B001)', amount: '15.8L', time: '06:35' }
  ]);

  const calculatedLiters = formData.inputValue ? 
    convertToLiters(parseFloat(formData.inputValue), formData.inputUnit as any, parseFloat(formData.density)) : 0;

  const densityWarning = parseFloat(formData.density) < 1.02 || parseFloat(formData.density) > 1.04;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add to recent entries
    const selectedAnimal = mockAnimals.find(a => a.id === formData.animalId);
    if (selectedAnimal) {
      const newEntry = {
        animal: `${selectedAnimal.name} (${selectedAnimal.tag})`,
        amount: `${calculatedLiters.toFixed(1)}L`,
        time: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
      };
      setRecentEntries([newEntry, ...recentEntries.slice(0, 4)]);
    }
    
    // Mock submission
    alert('Registro de ordeño guardado exitosamente');
    setFormData({
      ...formData,
      animalId: '',
      inputValue: '',
      customPrice: '',
      notes: ''
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
          <Milk className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Registrar Ordeño</h1>
        <p className="text-muted-foreground">Capture los datos de producción diaria</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-2">

      <Card>
        <CardHeader>
          <CardTitle>Datos del Ordeño</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shift">Turno</Label>
                <Select value={formData.shift} onValueChange={(value) => setFormData({...formData, shift: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">Matutino (AM)</SelectItem>
                    <SelectItem value="PM">Vespertino (PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="animal">Animal</Label>
              <Select value={formData.animalId} onValueChange={(value) => setFormData({...formData, animalId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar animal o lote" />
                </SelectTrigger>
                <SelectContent>
                  {mockAnimals.filter(a => a.status === 'active').map(animal => (
                    <SelectItem key={animal.id} value={animal.id}>
                      {animal.tag} - {animal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="inputValue">Cantidad</Label>
                <Input
                  id="inputValue"
                  type="number"
                  step="0.1"
                  value={formData.inputValue}
                  onChange={(e) => setFormData({...formData, inputValue: e.target.value})}
                  placeholder="15.5"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="inputUnit">Unidad</Label>
                <Select value={formData.inputUnit} onValueChange={(value) => setFormData({...formData, inputUnit: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Litros (L)</SelectItem>
                    <SelectItem value="KG">Kilogramos (KG)</SelectItem>
                    <SelectItem value="LB">Libras (LB)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="density">Densidad</Label>
                <div className="relative">
                  <Input
                    id="density"
                    type="number"
                    step="0.01"
                    value={formData.density}
                    onChange={(e) => setFormData({...formData, density: e.target.value})}
                    className={densityWarning ? 'border-warning' : ''}
                  />
                  {densityWarning && (
                    <AlertTriangle className="absolute right-3 top-3 h-4 w-4 text-warning" />
                  )}
                </div>
                {densityWarning && (
                  <p className="text-xs text-warning">Densidad fuera del rango normal (1.02-1.04)</p>
                )}
              </div>
            </div>

            {formData.inputValue && (
              <Card className="bg-accent/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Calculator className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Conversión automática</p>
                      <p className="text-sm text-muted-foreground">
                        {formData.inputValue} {formData.inputUnit} = <span className="font-medium text-primary">{calculatedLiters.toFixed(2)} Litros</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="buyer">Comprador (Opcional)</Label>
              <Select value={formData.buyerId} onValueChange={(value) => setFormData({...formData, buyerId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Precio general del día" />
                </SelectTrigger>
                <SelectContent>
                  {mockBuyers.map(buyer => (
                    <SelectItem key={buyer.id} value={buyer.id}>
                      {buyer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customPrice">Precio Manual (Opcional)</Label>
              <Input
                id="customPrice"
                type="number"
                step="0.01"
                value={formData.customPrice}
                onChange={(e) => setFormData({...formData, customPrice: e.target.value})}
                placeholder="0.45"
              />
              <p className="text-xs text-muted-foreground">
                Si no se especifica, se usará el precio del día
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Observaciones sobre el ordeño..."
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              <CheckCircle className="w-4 h-4 mr-2" />
              Registrar Ordeño
            </Button>
          </form>
        </CardContent>
      </Card>
        </div>

        {/* Recent Entries Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Últimos Registros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentEntries.map((entry, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-accent/20">
                    <div>
                      <p className="font-medium text-sm">{entry.animal}</p>
                      <p className="text-xs text-muted-foreground">{entry.time}</p>
                    </div>
                    <Badge variant="secondary">{entry.amount}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen del Turno</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Animales ordeñados</span>
                  <span className="font-medium">{recentEntries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total litros</span>
                  <span className="font-medium">
                    {recentEntries.reduce((sum, entry) => 
                      sum + parseFloat(entry.amount.replace('L', '')), 0
                    ).toFixed(1)}L
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Promedio/animal</span>
                  <span className="font-medium">
                    {(recentEntries.reduce((sum, entry) => 
                      sum + parseFloat(entry.amount.replace('L', '')), 0
                    ) / recentEntries.length).toFixed(1)}L
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}