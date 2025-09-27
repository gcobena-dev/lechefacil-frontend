import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listMilkPrices } from "@/services/milkPrices";
import { listBuyers } from "@/services/buyers";
import { formatCurrency } from "@/lib/mock-data";
import { formatDateOnly as formatDate } from "@/utils/format";
import { useTranslation } from "@/hooks/useTranslation";

export default function MilkPrices() {
  const { t } = useTranslation();
  const { data: pricesData } = useQuery({
    queryKey: ["milk-prices"],
    queryFn: () => listMilkPrices(),
  });
  const { data: buyersData } = useQuery({
    queryKey: ["buyers"],
    queryFn: () => listBuyers(),
  });

  const prices = pricesData ?? [];
  // Order by date descending so index 0 is the most recent
  const sortedPrices = useMemo(() => {
    return [...prices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [prices]);
  const buyers = buyersData ?? [];

  const currentPrice = sortedPrices[0];
  const prevPrice = sortedPrices[1];
  const priceChange = currentPrice && prevPrice
    ? parseFloat(currentPrice.price_per_l) - parseFloat(prevPrice.price_per_l)
    : 0;
  const isIncreasing = priceChange > 0;

  return (
    <div className="space-y-6">
      {/* Header - Responsive */}
      <div className="space-y-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('milk.pricesTitle')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('milk.managePricesAndBuyers')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button asChild className="w-full sm:w-auto">
            <Link to="/milk/prices/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('milk.newPrice')}
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/buyers/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('milk.newBuyer')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Current Price Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('milk.currentPriceLabel')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPrice ? formatCurrency(parseFloat(currentPrice.price_per_l)) : "-"}/L</div>
            <div className={`flex items-center text-xs ${isIncreasing ? 'text-green-600' : 'text-red-600'}`}>
              {isIncreasing ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
              {Math.abs(priceChange).toFixed(2)} {t('milk.from')} el precio anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('milk.currentBuyerLabel')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{currentPrice ? (buyers.find(b => b.id === currentPrice.buyer_id)?.name || "N/A") : "N/A"}</div>
            <div className="text-xs text-muted-foreground">
              {t('milk.from')} {currentPrice ? formatDate(currentPrice.date) : "-"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('milk.activeBuyers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buyers.length}</div>
            <div className="text-xs text-muted-foreground">
              {t('milk.of')} {buyers.length} {t('milk.totalLabel')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price History - Desktop */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>{t('milk.priceHistoryLabel')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('milk.dateLabel')}</TableHead>
                  <TableHead>{t('milk.buyerLabel')}</TableHead>
                  <TableHead>{t('milk.pricePerLiterLabel')}</TableHead>
                  <TableHead>{t('milk.bonusLabel')}</TableHead>
                  <TableHead>{t('milk.statusLabel')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPrices.map((price, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(price.date)}</TableCell>
                    <TableCell>{buyers.find(b => b.id === price.buyer_id)?.name || "N/A"}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(parseFloat(price.price_per_l))}</TableCell>
                    <TableCell>{formatCurrency(0)}</TableCell>
                    <TableCell>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {index === 0 ? t('milk.current') : t('milk.historical')}
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
        <h2 className="text-lg font-semibold">{t('milk.priceHistoryLabel')}</h2>
        {sortedPrices.map((price, index) => (
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
                  <span className="font-medium">{formatCurrency(parseFloat(price.price_per_l))}</span>
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
          <CardTitle>{t('milk.buyersLabel')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('milk.nameLabel')}</TableHead>
                  <TableHead>{t('milk.contactLabel')}</TableHead>
                  <TableHead>{t('milk.phoneLabel')}</TableHead>
                  <TableHead>{t('milk.statusLabel')}</TableHead>
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
                        {t('milk.active')}
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
        <h2 className="text-lg font-semibold">{t('milk.buyersLabel')}</h2>
        {buyers.map((buyer) => (
          <Card key={buyer.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{buyer.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('milk.noContactInfo')}
                  </div>
                </div>
                <Badge variant="default">
                  {t('milk.active')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
