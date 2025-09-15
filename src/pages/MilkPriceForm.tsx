import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface MilkPriceFormData {
  buyerName: string;
  pricePerLiter: string;
  effectiveDate: string;
  unit: 'L' | 'KG';
}

export default function MilkPriceForm() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<MilkPriceFormData>({
    buyerName: "",
    pricePerLiter: "",
    effectiveDate: "",
    unit: "L"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock save functionality
    toast({
      title: "Precio registrado",
      description: `Nuevo precio de $${formData.pricePerLiter}/${formData.unit} para ${formData.buyerName}`,
    });
    
    navigate("/milk/prices");
  };

  const handleInputChange = (field: keyof MilkPriceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/milk/prices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Nuevo Precio de Leche</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Precio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buyerName">Comprador *</Label>
              <Input
                id="buyerName"
                value={formData.buyerName}
                onChange={(e) => handleInputChange("buyerName", e.target.value)}
                placeholder="Nombre del comprador"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pricePerLiter">Precio por Unidad *</Label>
                <Input
                  id="pricePerLiter"
                  type="number"
                  step="0.01"
                  value={formData.pricePerLiter}
                  onChange={(e) => handleInputChange("pricePerLiter", e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit">Unidad</Label>
                <Select value={formData.unit} onValueChange={(value: any) => handleInputChange("unit", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Litros (L)</SelectItem>
                    <SelectItem value="KG">Kilogramos (KG)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Fecha Efectiva *</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => handleInputChange("effectiveDate", e.target.value)}
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                Guardar Precio
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/milk/prices")}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}