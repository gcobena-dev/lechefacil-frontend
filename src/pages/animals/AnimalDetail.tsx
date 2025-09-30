import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  ArrowLeft,
  Edit,
  Milk,
  Heart,
  TrendingUp,
  Calendar,
  MapPin,
  BarChart3,
  Clock,
  Info
} from "lucide-react";
import { formatDate } from "@/utils/format";
import { useAnimalDetail } from "@/hooks/useAnimalDetail";
import { useTranslation } from "@/hooks/useTranslation";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { useQuery } from "@tanstack/react-query";
import { listAnimalPhotos } from "@/services/animals";

export default function AnimalDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { data: tenantSettings } = useTenantSettings();
  const { data: animalData, isLoading, error } = useAnimalDetail(id as string);

  const { data: photos = [] } = useQuery({
    queryKey: ["animal-photos", id],
    queryFn: () => listAnimalPhotos(id as string),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="text-center py-8">{t('animals.loading')}</div>;
  }

  if (error || !animalData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('animals.animalNotFound')}</p>
      </div>
    );
  }

  const { animal, productionData, productionSummary } = animalData;

  const formatCurrency = (amount: number): string => {
    const currency = tenantSettings?.default_currency || 'USD';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const calculateAge = (birthDate?: string | null) => {
    if (!birthDate) return "-";
    const birth = new Date(birthDate);
    const now = new Date();
    const ageInMonths = (now.getFullYear() - birth.getFullYear()) * 12 + 
                       (now.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} ${t('animals.months')}`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const remainingMonths = ageInMonths % 12;
      return `${years} ${t('animals.years')} ${remainingMonths} ${t('animals.months')}`;
    }
  };

  const getStatusBadge = (status?: string | null) => {
    const s = (status ?? "").toLowerCase();
    const variants = {
      active: 'default',
      sold: 'secondary',
      dead: 'destructive',
      culled: 'outline'
    } as const;

    const labels = {
      active: t('animals.active'),
      sold: t('animals.sold'),
      dead: t('animals.dead'),
      culled: t('animals.culled')
    };

    return (
      <Badge variant={variants[s as keyof typeof variants] ?? 'outline'}>
        {labels[s as keyof typeof labels] ?? s}
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
          <h1 className="text-3xl font-bold text-foreground">{animal.name ?? '-'}</h1>
          <p className="text-muted-foreground">Tag: {animal.tag} • {animal.breed ?? '-'}</p>
        </div>
        <Button className="flex items-center gap-2" asChild>
          <Link to={`/animals/${(animal as any).id}/edit`}>
            <Edit className="h-4 w-4" />
            {t('animals.edit')}
          </Link>
        </Button>
      </div>

      {/* Photo Carousel */}
      {photos.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <Carousel className="w-full max-w-lg mx-auto">
              <CarouselContent>
                {photos
                  .sort((a, b) => {
                    if (a.is_primary) return -1;
                    if (b.is_primary) return 1;
                    return a.position - b.position;
                  })
                  .map((photo) => (
                    <CarouselItem key={photo.id}>
                      <div className="aspect-square relative rounded-lg overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.title || "Foto del animal"}
                          className="w-full h-full object-cover"
                        />
                        {photo.is_primary && (
                          <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                            {t('animals.primaryPhoto')}
                          </div>
                        )}
                      </div>
                      {photo.title && (
                        <p className="text-center text-sm text-muted-foreground mt-2">
                          {photo.title}
                        </p>
                      )}
                    </CarouselItem>
                  ))}
              </CarouselContent>
              {photos.length > 1 && (
                <>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </>
              )}
            </Carousel>
          </CardContent>
        </Card>
      )}

      {/* Animal Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('animals.generalInformation')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('animals.status')}</p>
              {getStatusBadge((animal as any).status)}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('animals.age')}</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{calculateAge((animal as any).birth_date)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('animals.lot')}</p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{(animal as any).lot ?? '-'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('animals.birthDateDetail')}</p>
              <span>{(animal as any).birth_date ? formatDate((animal as any).birth_date) : '-'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Milk className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{productionSummary.totalLiters.toFixed(1)}L</p>
                <p className="text-sm text-muted-foreground">{t('animals.total90Days')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{productionSummary.avgDaily.toFixed(1)}L</p>
                <p className="text-sm text-muted-foreground">{t('animals.dailyAverage')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Heart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(productionSummary.totalEarnings)}</p>
                <p className="text-sm text-muted-foreground">{t('animals.earnings90Days')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{productionSummary.recordsCount}</p>
                <p className="text-sm text-muted-foreground">{t('animals.recordsIn90Days')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last 30 Days Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('animals.last30DaysProduction')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('animals.last30Days')}</p>
              <p className="text-3xl font-bold">{productionSummary.last30DaysLiters.toFixed(1)}L</p>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t('animals.dailyAverage')}: {productionSummary.last30DaysAvg.toFixed(1)}L
                </p>
                <p className="text-sm font-medium text-green-600">
                  {t('animals.earnings')}: {formatCurrency(productionSummary.last30DaysEarnings)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">{t('animals.productionTrend')}</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs text-sm">
                        <p className="mb-1">Compara el promedio de los últimos 30 días vs. los últimos 90 días.</p>
                        <p className="text-green-600">Verde: mejorando</p>
                        <p className="text-red-600">Rojo: &lt;80% del promedio</p>
                        <p className="text-gray-600">Gris: estable</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                {productionSummary.last30DaysAvg > productionSummary.avgDaily ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {t('animals.highPerformer')}
                  </Badge>
                ) : productionSummary.last30DaysAvg < productionSummary.avgDaily * 0.8 ? (
                  <Badge variant="destructive">
                    {t('animals.lowPerformer')}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    {t('animals.averagePerformer')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs defaultValue="production" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="production">{t('animals.production')}</TabsTrigger>
              <TabsTrigger value="health">{t('animals.health')}</TabsTrigger>
              <TabsTrigger value="movements">{t('animals.movements')}</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent>
            <TabsContent value="production" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('animals.milkingRecords')}</h3>
                {productionData.length > 0 ? (
                  <div className="space-y-4">
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('animals.dateHeader')}</TableHead>
                              <TableHead>{t('animals.shiftHeader')}</TableHead>
                              <TableHead>{t('animals.originalValueHeader')}</TableHead>
                              <TableHead>{t('animals.litersHeader')}</TableHead>
                              <TableHead>{t('animals.pricePerLiterHeader')}</TableHead>
                              <TableHead>{t('animals.amountHeader')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {productionData
                              .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
                              .map((record) => {
                                const date = new Date(record.date_time);
                                const shift = date.getHours() < 12 ? 'AM' : 'PM';
                                const price = record.price_snapshot ? parseFloat(record.price_snapshot) : (tenantSettings?.default_price_per_l || 0);
                                const amount = parseFloat(record.volume_l) * price;

                                return (
                                  <TableRow key={record.id}>
                                    <TableCell>{formatDate(record.date_time)}</TableCell>
                                    <TableCell>
                                      <Badge variant={shift === 'AM' ? 'default' : 'secondary'}>
                                        {shift}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{record.input_quantity} {record.input_unit.toUpperCase()}</TableCell>
                                    <TableCell className="font-medium">{parseFloat(record.volume_l).toFixed(1)}L</TableCell>
                                    <TableCell>{formatCurrency(price)}</TableCell>
                                    <TableCell className="font-medium">{formatCurrency(amount)}</TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                      {productionData
                        .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
                        .map((record) => {
                          const date = new Date(record.date_time);
                          const shift = date.getHours() < 12 ? 'AM' : 'PM';
                          const price = record.price_snapshot ? parseFloat(record.price_snapshot) : (tenantSettings?.default_price_per_l || 0);
                          const amount = parseFloat(record.volume_l) * price;

                          return (
                            <div key={record.id} className="border border-border rounded-lg p-4 bg-card">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="font-medium">{formatDate(record.date_time)}</div>
                                  <Badge variant={shift === 'AM' ? 'default' : 'secondary'} className="mt-1">
                                    {shift}
                                  </Badge>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-lg">{parseFloat(record.volume_l).toFixed(1)}L</div>
                                  <div className="text-sm text-muted-foreground">{formatCurrency(amount)}</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground text-xs">{t('animals.originalValueHeader')}: </span>
                                  <span className="font-medium">{record.input_quantity} {record.input_unit.toUpperCase()}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-xs">{t('animals.pricePerLiterHeader')}: </span>
                                  <span className="font-medium">{formatCurrency(price)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {t('animals.noProductionRecords')}
                  </p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="health" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('animals.healthEvents')}</h3>
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">{t('animals.noHealthEvents')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('animals.featureComingSoon')}
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="movements" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('animals.movementsHistory')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">{t('animals.farmEntry')}</p>
                      <p className="text-sm text-muted-foreground">{animal.created_at ? formatDate((animal as any).created_at) : '-'}</p>
                    </div>
                  </div>
                  
                  {animal.status !== 'active' && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {animal.status === 'sold' ? t('animals.sold') :
                           animal.status === 'culled' ? t('animals.culled') : t('animals.dead')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('animals.dateToBeSet')}
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
