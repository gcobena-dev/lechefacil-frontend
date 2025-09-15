import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Milk, Calculator, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { mockAnimals, mockBuyers, convertToLiters, formatCurrency } from "@/lib/mock-data";

export default function MilkCollect() {
  const { toast } = useToast();
  
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

  // Bulk mode state
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkQuantity, setBulkQuantity] = useState('');
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);

  const [recentEntries, setRecentEntries] = useState([
    { animal: 'Esperanza (A001)', amount: '18.5L', time: '06:30' },
    { animal: 'Bonita (A002)', amount: '16.2L', time: '06:32' },
    { animal: 'Paloma (B001)', amount: '15.8L', time: '06:35' }
  ]);

  const calculatedLiters = formData.inputValue ? 
    convertToLiters(parseFloat(formData.inputValue), formData.inputUnit as any, parseFloat(formData.density)) : 0;
  
  const bulkCalculatedLiters = bulkQuantity ? 
    convertToLiters(parseFloat(bulkQuantity), formData.inputUnit as any, parseFloat(formData.density)) : 0;

  const densityWarning = parseFloat(formData.density) < 1.02 || parseFloat(formData.density) > 1.04;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBulkMode) {
      handleBulkSubmit();
    } else {
      handleSingleSubmit();
    }
  };

  const handleSingleSubmit = () => {
    if (!formData.animalId || !formData.inputValue) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    const selectedAnimal = mockAnimals.find(a => a.id === formData.animalId);
    if (selectedAnimal) {
      const newEntry = {
        animal: `${selectedAnimal.name} (${selectedAnimal.tag})`,
        amount: `${calculatedLiters.toFixed(1)}L`,
        time: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
      };
      setRecentEntries([newEntry, ...recentEntries.slice(0, 4)]);
    }
    
    toast({
      title: "Registro exitoso",
      description: `${calculatedLiters.toFixed(1)}L registrados para ${selectedAnimal?.name}`,
    });
    
    setFormData({
      ...formData,
      animalId: '',
      inputValue: '',
      customPrice: '',
      notes: ''
    });
  };

  const handleBulkSubmit = () => {
    if (selectedAnimals.length === 0 || !bulkQuantity) {
      toast({
        title: "Error",
        description: "Selecciona animales y especifica la cantidad total",
        variant: "destructive"
      });
      return;
    }

    const litersPerAnimal = bulkCalculatedLiters / selectedAnimals.length;
    
    const newEntries = selectedAnimals.map(animalId => {
      const animal = mockAnimals.find(a => a.id === animalId);
      return {
        animal: `${animal?.name} (${animal?.tag})`,
        amount: `${litersPerAnimal.toFixed(1)}L`,
        time: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
      };
    });
    
    setRecentEntries([...newEntries, ...recentEntries.slice(0, 5 - newEntries.length)]);
    
    toast({
      title: "Registro bulk exitoso",
      description: `${bulkCalculatedLiters.toFixed(1)}L distribuidos entre ${selectedAnimals.length} animales`,
    });
    
    setSelectedAnimals([]);
    setBulkQuantity('');
    setFormData({
      ...formData,
      customPrice: '',
      notes: ''
    });
  };

  const toggleAnimalSelection = (animalId: string) => {
    setSelectedAnimals(prev => 
      prev.includes(animalId)
        ? prev.filter(id => id !== animalId)
        : [...prev, animalId]
    );
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
          <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Label htmlFor="bulkMode">Modo de registro:</Label>
              <div className="flex items-center gap-2">
                <span className={!isBulkMode ? "font-medium" : ""}>Individual</span>
                <Switch
                  id="bulkMode"
                  checked={isBulkMode}
                  onCheckedChange={setIsBulkMode}
                />
                <span className={isBulkMode ? "font-medium" : ""}>Bulk</span>
              </div>
            </div>

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

              {!isBulkMode ? (
                /* Individual Mode */
                <div className="space-y-2">
                  <Label htmlFor="animal">Animal</Label>
                  <Select value={formData.animalId} onValueChange={(value) => setFormData({...formData, animalId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar animal" />
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
              ) : (
                /* Bulk Mode */
                <div className="space-y-2">
                  <Label>Seleccionar Animales ({selectedAnimals.length} seleccionados)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                    {mockAnimals.filter(a => a.status === 'active').map((animal) => (
                      <div
                        key={animal.id}
                        className={`p-2 border rounded cursor-pointer text-sm ${
                          selectedAnimals.includes(animal.id)
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleAnimalSelection(animal.id)}
                      >
                        {animal.tag} - {animal.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="inputValue">
                    {isBulkMode ? "Cantidad Total" : "Cantidad"}
                  </Label>
                  <Input
                    id="inputValue"
                    type="number"
                    step="0.1"
                    value={isBulkMode ? bulkQuantity : formData.inputValue}
                    onChange={(e) => isBulkMode ? setBulkQuantity(e.target.value) : setFormData({...formData, inputValue: e.target.value})}
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

              {((!isBulkMode && formData.inputValue) || (isBulkMode && bulkQuantity)) && (
                <Card className="bg-accent/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Calculator className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Conversión automática</p>
                        <p className="text-sm text-muted-foreground">
                          {isBulkMode ? bulkQuantity : formData.inputValue} {formData.inputUnit} = 
                          <span className="font-medium text-primary ml-1">
                            {(isBulkMode ? bulkCalculatedLiters : calculatedLiters).toFixed(2)} Litros
                          </span>
                          {isBulkMode && selectedAnimals.length > 0 && (
                            <span className="block mt-1">
                              ≈ {(bulkCalculatedLiters / selectedAnimals.length).toFixed(2)} L por animal
                            </span>
                          )}
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
                {isBulkMode ? `Registrar ${selectedAnimals.length} Animales` : "Registrar Ordeño"}
              </Button>
            </form>
          </div>
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