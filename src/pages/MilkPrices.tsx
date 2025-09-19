import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { mockMilkPrices, mockBuyers, formatCurrency, formatDate } from "@/lib/mock-data";

export default function MilkPrices() {
  const [prices] = useState(mockMilkPrices);
  const [buyers] = useState(mockBuyers);

  const currentPrice = prices[0];
  const priceChange = currentPrice.price_per_liter - (prices[1]?.price_per_liter || 0);
  const isIncreasing = priceChange > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Precios de Leche</h1>
          <p className="text-muted-foreground">Gestiona los precios y compradores</p>
        </div>
        <Button asChild>
          <Link to="/milk/prices/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Precio
          </Link>
        </Button>
      </div>

      {/* Current Price Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precio Actual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentPrice.price_per_liter)}/L</div>
            <div className={`flex items-center text-xs ${isIncreasing ? 'text-green-600' : 'text-red-600'}`}>
              {isIncreasing ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
              {Math.abs(priceChange).toFixed(2)} desde el precio anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comprador Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{buyers.find(b => b.id === currentPrice.buyer_id)?.name || "N/A"}</div>
            <div className="text-xs text-muted-foreground">
              Desde {formatDate(currentPrice.date)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compradores Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buyers.length}</div>
            <div className="text-xs text-muted-foreground">
              de {buyers.length} total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price History - Desktop */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Historial de Precios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Precio/Litro</TableHead>
                  <TableHead>Bonificación</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prices.map((price, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(price.date)}</TableCell>
                    <TableCell>{buyers.find(b => b.id === price.buyer_id)?.name || "N/A"}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(price.price_per_liter)}</TableCell>
                    <TableCell>{formatCurrency(0)}</TableCell>
                    <TableCell>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {index === 0 ? "Actual" : "Histórico"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Price History - Mobile */}
      <div className="md:hidden space-y-4">
        <h2 className="text-lg font-semibold">Historial de Precios</h2>
        {prices.map((price, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">{formatDate(price.date)}</div>
                  <div className="text-sm text-muted-foreground">
                    {buyers.find(b => b.id === price.buyer_id)?.name || "N/A"}
                  </div>
                </div>
                <Badge variant={index === 0 ? "default" : "secondary"}>
                  {index === 0 ? "Actual" : "Histórico"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Precio: </span>
                  <span className="font-medium">{formatCurrency(price.price_per_liter)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Bonif: </span>
                  <span>{formatCurrency(0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Buyers List - Desktop */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Compradores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buyers.map((buyer) => (
                  <TableRow key={buyer.id}>
                    <TableCell className="font-medium">{buyer.name}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <Badge variant="default">
                        Activo
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Buyers List - Mobile */}
      <div className="md:hidden space-y-4">
        <h2 className="text-lg font-semibold">Compradores</h2>
        {buyers.map((buyer) => (
          <Card key={buyer.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{buyer.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Sin información de contacto
                  </div>
                </div>
                <Badge variant="default">
                  Activo
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}