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
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [animalQuantities, setAnimalQuantities] = useState<Record<string, string>>({});

  const [recentEntries, setRecentEntries] = useState([
    { animal: 'Esperanza (A001)', amount: '18.5L', time: '06:30' },
    { animal: 'Bonita (A002)', amount: '16.2L', time: '06:32' },
    { animal: 'Paloma (B001)', amount: '15.8L', time: '06:35' }
  ]);

  const calculatedLiters = formData.inputValue ? 
    convertToLiters(parseFloat(formData.inputValue), formData.inputUnit as any, parseFloat(formData.density)) : 0;
  
  const bulkCalculatedTotal = Object.values(animalQuantities).reduce((sum, quantity) => {
    return sum + (quantity ? convertToLiters(parseFloat(quantity), formData.inputUnit as any, parseFloat(formData.density)) : 0);
  }, 0);

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
    const animalsWithQuantities = selectedAnimals.filter(animalId => animalQuantities[animalId]);
    
    if (animalsWithQuantities.length === 0) {
      toast({
        title: "Error",
        description: "Ingresa la cantidad para al menos un animal seleccionado",
        variant: "destructive"
      });
      return;
    }

    const newEntries = animalsWithQuantities.map(animalId => {
      const animal = mockAnimals.find(a => a.id === animalId);
      const quantity = animalQuantities[animalId];
      const liters = convertToLiters(parseFloat(quantity), formData.inputUnit as any, parseFloat(formData.density));
      
      return {
        animal: `${animal?.name} (${animal?.tag})`,
        amount: `${liters.toFixed(1)}L`,
        time: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
      };
    });
    
    setRecentEntries([...newEntries, ...recentEntries.slice(0, 5 - newEntries.length)]);
    
    toast({
      title: "Registro bulk exitoso",
      description: `${bulkCalculatedTotal.toFixed(1)}L registrados para ${animalsWithQuantities.length} animales`,
    });
    
    setSelectedAnimals([]);
    setAnimalQuantities({});
    setFormData({
      ...formData,
      customPrice: '',
      notes: ''
    });
  };

  const toggleAnimalSelection = (animalId: string) => {
    setSelectedAnimals(prev => {
      const newSelection = prev.includes(animalId)
        ? prev.filter(id => id !== animalId)
        : [...prev, animalId];
      
      // Remove quantity if animal is deselected
      if (prev.includes(animalId)) {
        setAnimalQuantities(prevQuantities => {
          const newQuantities = { ...prevQuantities };
          delete newQuantities[animalId];
          return newQuantities;
        });
      }
      
      return newSelection;
    });
  };

  const updateAnimalQuantity = (animalId: string, quantity: string) => {
    setAnimalQuantities(prev => ({
      ...prev,
      [animalId]: quantity
    }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center mb-4">
          <Milk className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Registrar Ordeño</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Capture los datos de producción diaria</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Form Section */}
        <div className="xl:col-span-2">

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
                 <div className="space-y-4">
                   <Label>Seleccionar Animales y Cantidades</Label>
                   <div className="space-y-3 max-h-96 overflow-y-auto p-4 border rounded">
                     {mockAnimals.filter(a => a.status === 'active').map((animal) => (
                      <div
                        key={animal.id}
                        className={`p-3 border rounded ${
                          selectedAnimals.includes(animal.id)
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div 
                            className="flex items-center gap-2 cursor-pointer flex-1"
                            onClick={() => toggleAnimalSelection(animal.id)}
                          >
                            <div className={`w-4 h-4 border-2 rounded ${
                              selectedAnimals.includes(animal.id)
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground'
                            }`}>
                              {selectedAnimals.includes(animal.id) && (
                                <CheckCircle className="w-4 h-4 text-primary-foreground -m-0.5" />
                              )}
                            </div>
                            <span className="font-medium">{animal.tag} - {animal.name}</span>
                          </div>
                        </div>
                        
                        {selectedAnimals.includes(animal.id) && (
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Cantidad"
                              value={animalQuantities[animal.id] || ''}
                              onChange={(e) => updateAnimalQuantity(animal.id, e.target.value)}
                              className="flex-1"
                            />
                            <span className="text-sm text-muted-foreground min-w-[60px]">
                              {animalQuantities[animal.id] ? (
                                <>
                                  {convertToLiters(
                                    parseFloat(animalQuantities[animal.id]), 
                                    formData.inputUnit as any, 
                                    parseFloat(formData.density)
                                  ).toFixed(1)}L
                                </>
                              ) : (
                                '0L'
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                   </div>
                   <p className="text-sm text-muted-foreground">
                     {selectedAnimals.length} animales seleccionados
                   </p>
                 </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                {!isBulkMode && (
                  <>
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
                  </>
                )}
              
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

              {((!isBulkMode && formData.inputValue) || (isBulkMode && bulkCalculatedTotal > 0)) && (
                <Card className="bg-accent/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Calculator className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Conversión automática</p>
                        {!isBulkMode ? (
                          <p className="text-sm text-muted-foreground">
                            {formData.inputValue} {formData.inputUnit} = 
                            <span className="font-medium text-primary ml-1">
                              {calculatedLiters.toFixed(2)} Litros
                            </span>
                          </p>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            <p>
                              <span className="font-medium text-primary">
                                Total: {bulkCalculatedTotal.toFixed(2)} Litros
                              </span>
                            </p>
                            <p className="text-xs mt-1">
                              {Object.entries(animalQuantities).filter(([_, quantity]) => quantity).length} animales con producción registrada
                            </p>
                          </div>
                        )}
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
                {isBulkMode ? `Registrar Producción Individual` : "Registrar Ordeño"}
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