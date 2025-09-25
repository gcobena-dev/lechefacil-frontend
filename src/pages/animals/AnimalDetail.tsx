import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowLeft,
  Edit, 
  Milk, 
  Heart, 
  TrendingUp,
  Calendar,
  MapPin
} from "lucide-react";
import { mockMilkCollections, mockHealthEvents, formatCurrency, formatDate } from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";
import { getAnimal } from "@/services/animals";
import { useTranslation } from "@/hooks/useTranslation";

export default function AnimalDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { data: animal, isLoading, error } = useQuery({
    queryKey: ["animal", id],
    queryFn: () => getAnimal(id as string),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <div className="text-center py-8">{t('animals.loading')}</div>;
  }

  if (error || !animal) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('animals.animalNotFound')}</p>
      </div>
    );
  }

  // Get last 90 days of data
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const animalMilkData = mockMilkCollections
    .filter(c => c.animal_id === (animal as any).id)
    .filter(c => new Date(c.date) >= ninetyDaysAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const animalHealthData = mockHealthEvents
    .filter(h => h.animal_id === (animal as any).id)
    .filter(h => new Date(h.date) >= ninetyDaysAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate stats
  const totalLiters = animalMilkData.reduce((sum, c) => sum + c.liters, 0);
  const totalEarnings = animalMilkData.reduce((sum, c) => sum + c.amount, 0);
  const avgDaily = animalMilkData.length > 0 ? totalLiters / animalMilkData.length : 0;

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-light rounded-lg">
                <Milk className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLiters.toFixed(1)}L</p>
                <p className="text-sm text-muted-foreground">{t('animals.total90Days')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgDaily.toFixed(1)}L</p>
                <p className="text-sm text-muted-foreground">{t('animals.dailyAverage')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Heart className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalEarnings)}</p>
                <p className="text-sm text-muted-foreground">{t('animals.earnings90Days')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                {animalMilkData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Turno</TableHead>
                        <TableHead>Valor Original</TableHead>
                        <TableHead>Litros</TableHead>
                        <TableHead>Precio/L</TableHead>
                        <TableHead>Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {animalMilkData.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{formatDate(record.date)}</TableCell>
                          <TableCell>
                            <Badge variant={record.shift === 'AM' ? 'default' : 'secondary'}>
                              {record.shift}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.input_value} {record.input_unit}</TableCell>
                          <TableCell className="font-medium">{record.liters.toFixed(1)}L</TableCell>
                          <TableCell>{formatCurrency(record.price_per_liter)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(record.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                {animalHealthData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>{t('animals.type')}</TableHead>
                        <TableHead>{t('animals.diagnosis')}</TableHead>
                        <TableHead>{t('animals.treatment')}</TableHead>
                        <TableHead>{t('animals.withdrawalUntil')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {animalHealthData.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>{formatDate(event.date)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{event.type}</Badge>
                          </TableCell>
                          <TableCell>{event.diagnosis}</TableCell>
                          <TableCell>{event.treatment} ({event.dose})</TableCell>
                          <TableCell>
                            {event.withdrawal_until ? (
                              <Badge variant="destructive">
                                {formatDate(event.withdrawal_until)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {t('animals.noHealthEvents')}
                  </p>
                )}
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
