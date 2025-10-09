import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Info,
  Check,
  X,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  AlertCircle,
  Baby,
  Activity,
  Stethoscope,
  ArrowLeftRight,
  GitBranch
} from "lucide-react";
import { formatDate } from "@/utils/format";
import { useAnimalDetail } from "@/hooks/useAnimalDetail";
import { useTranslation } from "@/hooks/useTranslation";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { useQuery } from "@tanstack/react-query";
import { listAnimalPhotos } from "@/services/animals";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listMilkProductionsPaginated, type MilkProductionListResponse } from "@/services/milkProductions";
import { useAnimalEvents } from "@/hooks/useAnimalEvents";
import { useAnimalLactations } from "@/hooks/useAnimalLactations";
import EventTimelineCard from "@/components/animals/EventTimelineCard";
import LactationCard from "@/components/animals/LactationCard";
import { getAnimalCertificate } from "@/services/animalCertificates";
import RegisterEventDialog from "@/components/animals/RegisterEventDialog";

export default function AnimalDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { data: tenantSettings } = useTenantSettings();
  const { data: animalData, isLoading, error } = useAnimalDetail(id as string);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(0);
  const [registerEventOpen, setRegisterEventOpen] = useState(false);
  // Events pagination
  const [eventsPageSize, setEventsPageSize] = useState<number>(10);
  const [eventsPage, setEventsPage] = useState<number>(1);

  // Fetch events and lactations
  const { data: eventsResp } = useAnimalEvents(id, eventsPage, eventsPageSize);
  const { data: lactations = [] } = useAnimalLactations(id);

  const { data: photos = [] } = useQuery({
    queryKey: ["animal-photos", id],
    queryFn: () => listAnimalPhotos(id as string),
    enabled: !!id,
  });

  // Fetch certificate
  const { data: certificate } = useQuery({
    queryKey: ["animal-certificate", id],
    queryFn: () => getAnimalCertificate(id as string),
    enabled: !!id,
  });

  // Compute last 90 days range like hook
  const today = useMemo(() => new Date(), []);
  const ninetyDaysAgo = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 90); return d; }, []);
  const formatDateISO = (d: Date) => d.toISOString().split('T')[0];

  // Paginated productions for the table
  const { data: pagedProductions } = useQuery<MilkProductionListResponse>({
    queryKey: ["animal-production-paged", id, pageSize, page, formatDateISO(ninetyDaysAgo), formatDateISO(today)],
    queryFn: () => listMilkProductionsPaginated({
      animal_id: id as string,
      date_from: formatDateISO(ninetyDaysAgo),
      date_to: formatDateISO(today),
      limit: pageSize,
      offset: page * pageSize,
    }),
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
  const total = pagedProductions?.total ?? 0;
  const items = pagedProductions?.items ?? [];
  const start = total === 0 ? 0 : (page * pageSize) + 1;
  const end = Math.min((page + 1) * pageSize, total);

  const sortedPhotos = photos
    .sort((a, b) => {
      if (a.is_primary) return -1;
      if (b.is_primary) return 1;
      return a.position - b.position;
    });

  const openFullscreen = (index: number) => {
    setFullscreenIndex(index);
    setFullscreenOpen(true);
  };

  const closeFullscreen = () => {
    setFullscreenOpen(false);
  };

  const nextPhoto = () => {
    setFullscreenIndex((prev) => (prev + 1) % sortedPhotos.length);
  };

  const prevPhoto = () => {
    setFullscreenIndex((prev) => (prev - 1 + sortedPhotos.length) % sortedPhotos.length);
  };

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
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">{animal.name ?? '-'}</h1>
            <p className="text-muted-foreground truncate">Tag: {animal.tag} • {animal.breed ?? '-'}</p>
          </div>
        </div>
        <div className="sm:ml-auto">
          <Button className="flex items-center gap-2 w-full sm:w-auto justify-center" asChild>
            <Link to={`/animals/${(animal as any).id}/edit`}>
              <Edit className="h-4 w-4" />
              <span>{t('animals.edit')}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Photo Carousel */}
      {photos.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <Carousel className="w-full max-w-lg mx-auto">
              <CarouselContent>
                {sortedPhotos.map((photo, index) => (
                  <CarouselItem key={photo.id}>
                    <div className="aspect-square relative rounded-lg overflow-hidden group cursor-pointer" onClick={() => openFullscreen(index)}>
                      <img
                        src={photo.url}
                        alt={photo.title || t('animals.animalPhoto')}
                        className="w-full h-full object-cover"
                      />
                      {photo.is_primary && (
                        <div className="absolute top-2 left-2 bg-white dark:bg-gray-200 text-black rounded-full p-1.5 shadow-lg">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="h-8 w-8 text-white" />
                      </div>
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

      {/* Fullscreen Photo Viewer */}
      {fullscreenOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={closeFullscreen}>
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="h-8 w-8" />
          </button>

          {sortedPhotos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevPhoto();
                }}
                className="absolute left-4 text-white hover:text-gray-300 z-50 p-3 rounded-full hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextPhoto();
                }}
                className="absolute right-4 text-white hover:text-gray-300 z-50 p-3 rounded-full hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="h-10 w-10" />
              </button>
            </>
          )}

          <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={sortedPhotos[fullscreenIndex].url}
              alt={sortedPhotos[fullscreenIndex].title || t('animals.animalPhoto')}
              className="max-w-full max-h-full object-contain"
            />
            {sortedPhotos[fullscreenIndex].is_primary && (
              <div className="absolute top-4 left-4 bg-white dark:bg-gray-200 text-black rounded-full p-2 shadow-lg">
                <Check className="h-5 w-5" />
              </div>
            )}
            {sortedPhotos[fullscreenIndex].title && (
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white text-lg bg-black/50 inline-block px-4 py-2 rounded">
                  {sortedPhotos[fullscreenIndex].title}
                </p>
              </div>
            )}
            <div className="absolute bottom-4 right-4 text-white text-sm bg-black/50 px-3 py-1 rounded">
              {fullscreenIndex + 1} / {sortedPhotos.length}
            </div>
          </div>
        </div>
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

          {/* Labels Section */}
          {animal.labels && animal.labels.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-3">Labels</p>
              <div className="flex flex-wrap gap-2">
                {animal.labels.map((label, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
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
                        <p className="mb-1">{t('animals.trendHint')}</p>
                        <p className="text-green-600">{t('animals.trendGreen')}</p>
                        <p className="text-red-600">{t('animals.trendRed')}</p>
                        <p className="text-gray-600">{t('animals.trendGray')}</p>
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
            <TabsList className="w-full overflow-x-auto whitespace-nowrap">
              <TabsTrigger value="production" className="flex items-center gap-1.5">
                <Milk className="h-4 w-4" />
                <span>{t('animals.production')}</span>
              </TabsTrigger>
              <TabsTrigger value="lactations" className="flex items-center gap-1.5">
                <Baby className="h-4 w-4" />
                <span>{t('animals.lactations')}</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{t('animals.events')}</span>
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4" />
                <span>{t('animals.health')}</span>
              </TabsTrigger>
              <TabsTrigger value="movements" className="flex items-center gap-1.5">
                <ArrowLeftRight className="h-4 w-4" />
                <span>{t('animals.movements')}</span>
              </TabsTrigger>
              <TabsTrigger value="genealogy" className="flex items-center gap-1.5">
                <GitBranch className="h-4 w-4" />
                <span>{t('animals.genealogy')}</span>
              </TabsTrigger>
              <TabsTrigger value="certificate" className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                <span>{t('animals.certificate')}</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent>
            <TabsContent value="production" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('animals.milkingRecords')}</h3>
                {total > 0 ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {start}-{end} de {total}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 justify-end">
                        <span className="text-sm">Por página</span>
                        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v, 10)); setPage(0); }}>
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="10" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 ml-0 sm:ml-2">
                          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setPage((p) => ((p + 1) * pageSize < total ? p + 1 : p))} disabled={(page + 1) * pageSize >= total}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
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
                            {items
                              .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
                              .map((record) => {
                                const shift = record.shift || 'AM';
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
                      {items
                        .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
                        .map((record) => {
                          const shift = record.shift || 'AM';
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

            {/* Lactations Tab */}
            <TabsContent value="lactations" className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">{t('animals.lactations')}</h3>
                  <Badge variant="secondary">
                    {lactations.length} lactancia{lactations.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {lactations.length > 0 ? (
                  <div className="space-y-4">
                    {lactations.map((lactation) => (
                      <LactationCard key={lactation.id} lactation={lactation} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Milk className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">
                      No hay lactancias registradas
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Las lactancias se crean automáticamente al registrar un evento de parto
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">{t('animals.events')}</h3>
                  <Button onClick={() => setRegisterEventOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('animals.registerEvent')}
                  </Button>
                </div>

                {animal.disposition_at && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Animal dado de baja</AlertTitle>
                    <AlertDescription>
                      Fecha: {formatDate(animal.disposition_at)}
                      {animal.disposition_reason && (
                        <><br />Razón: {animal.disposition_reason}</>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {eventsResp && eventsResp.total > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {Math.min((eventsPage - 1) * eventsPageSize + 1, eventsResp.total)}-
                        {Math.min(eventsPage * eventsPageSize, eventsResp.total)} de {eventsResp.total}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 justify-end">
                        <span className="text-sm">Por página</span>
                        <Select value={String(eventsPageSize)} onValueChange={(v) => { setEventsPageSize(parseInt(v, 10)); setEventsPage(1); }}>
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="10" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 ml-0 sm:ml-2">
                          <Button variant="outline" size="sm" onClick={() => setEventsPage((p) => Math.max(1, p - 1))} disabled={eventsPage === 1}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEventsPage((p) => (p * eventsPageSize < (eventsResp?.total || 0) ? p + 1 : p))} disabled={eventsPage * eventsPageSize >= (eventsResp?.total || 0)}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {eventsResp.items.map((event) => (
                      <EventTimelineCard key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">
                      {t('animals.noEventsRegistered')}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('animals.startRegisteringEvents')}
                    </p>
                    <Button onClick={() => setRegisterEventOpen(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('animals.registerFirstEvent')}
                    </Button>
                  </div>
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

            <TabsContent value="genealogy" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('animals.genealogyInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('animals.gender')}</p>
                    <p className="font-medium">
                      {animal.sex === 'FEMALE' ? t('animals.female') : animal.sex === 'MALE' ? t('animals.male') : '-'}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('animals.dam')}</p>
                    <p className="font-medium">
                      {animal.dam_id ? (
                        <Link to={`/animals/${animal.dam_id}`} className="text-primary hover:underline">
                          {t('animals.viewDam')}
                        </Link>
                      ) : '-'}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('animals.sire')}</p>
                    <p className="font-medium">
                      {animal.sire_id ? (
                        <Link to={`/animals/${animal.sire_id}`} className="text-primary hover:underline">
                          {t('animals.viewSire')}
                        </Link>
                      ) : animal.external_sire_code ? (
                        <span>{animal.external_sire_code} {animal.external_sire_registry ? `(${animal.external_sire_registry})` : ''}</span>
                      ) : '-'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  {t('animals.editGenealogyHint')}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="certificate" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('animals.certificate')}</h3>
                {certificate ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">{t('animals.registryNumber')}</p>
                      <p className="font-medium">{certificate.registry_number || '-'}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">{t('animals.bolusId')}</p>
                      <p className="font-medium">{certificate.bolus_id || '-'}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">{t('animals.tattooLeft')}</p>
                      <p className="font-medium">{certificate.tattoo_left || '-'}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">{t('animals.tattooRight')}</p>
                      <p className="font-medium">{certificate.tattoo_right || '-'}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">{t('animals.issueDate')}</p>
                      <p className="font-medium">{certificate.issue_date ? formatDate(certificate.issue_date) : '-'}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">{t('animals.breeder')}</p>
                      <p className="font-medium">{certificate.breeder || '-'}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">{t('animals.owner')}</p>
                      <p className="font-medium">{certificate.owner || '-'}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">{t('animals.farm')}</p>
                      <p className="font-medium">{certificate.farm || '-'}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">{t('animals.certificateName')}</p>
                      <p className="font-medium">{certificate.certificate_name || '-'}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">{t('animals.associationCode')}</p>
                      <p className="font-medium">{certificate.association_code || '-'}</p>
                    </div>
                    <div className="p-3 border rounded-lg md:col-span-2">
                      <p className="text-sm text-muted-foreground">{t('animals.certificateNotes')}</p>
                      <p className="font-medium">{certificate.notes || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{t('animals.noCertificateInfo')}</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-4">
                  {t('animals.editCertificateHint')}
                </p>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Register Event Dialog */}
      <RegisterEventDialog
        animalId={id!}
        isOpen={registerEventOpen}
        onClose={() => setRegisterEventOpen(false)}
        animalSex={animal.sex}
        animalBreed={animal.breed}
        animalBreedId={(animal as any).breed_id}
        animalBreedVariant={(animal as any).breed_variant}
      />
    </div>
  );
}
