import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Edit,
  Milk,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listAnimals } from "@/services/animals";
import { useTranslation } from "@/hooks/useTranslation";
import { getAnimalImageUrl, getStatusKeyFromCode } from "@/utils/animals";
import { AnimalPhotoLightbox } from "@/components/animals/AnimalPhotoLightbox";
import AnimalsFilters, {
  EMPTY_ANIMAL_FILTERS,
  type AnimalFilterState,
} from "@/components/animals/AnimalsFilters";
import { getPref, setPref } from "@/utils/prefs";

export default function Animals() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(() => getPref<string>('prefs:animals:search', '', { session: true }));
  const [filters, setFilters] = useState<AnimalFilterState>(() =>
    getPref<AnimalFilterState>('prefs:animals:filters', EMPTY_ANIMAL_FILTERS, { session: true }),
  );
  const [pageSize, setPageSize] = useState<number>(() => getPref<number>('prefs:animals:pageSize', 10, { session: true }));
  const [page, setPage] = useState<number>(() => getPref<number>('prefs:animals:page', 0, { session: true }));
  const [sortBy, setSortBy] = useState<string>(() => getPref<string>('prefs:animals:sortBy', 'tag', { session: true }));
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(() => getPref<'asc' | 'desc'>('prefs:animals:sortDir', 'asc', { session: true }));

  // Persist changes during the session
  useEffect(() => { setPref('prefs:animals:search', searchTerm, { session: true }); }, [searchTerm]);
  useEffect(() => { setPref('prefs:animals:filters', filters, { session: true }); }, [filters]);
  useEffect(() => { setPref('prefs:animals:pageSize', pageSize, { session: true }); }, [pageSize]);
  useEffect(() => { setPref('prefs:animals:page', page, { session: true }); }, [page]);
  useEffect(() => { setPref('prefs:animals:sortBy', sortBy, { session: true }); }, [sortBy]);
  useEffect(() => { setPref('prefs:animals:sortDir', sortDir, { session: true }); }, [sortDir]);

  const { data } = useQuery({
    queryKey: ["animals", { q: searchTerm, limit: pageSize, offset: page * pageSize, sortBy, sortDir, filters }],
    queryFn: () => listAnimals({
      q: searchTerm || undefined,
      limit: pageSize,
      offset: page * pageSize,
      sort_by: sortBy,
      sort_dir: sortDir,
      status_codes: filters.status.length ? filters.status.join(',') : undefined,
      breed_ids: filters.breed.length ? filters.breed : undefined,
      lot_ids: filters.lot.length ? filters.lot : undefined,
      sex: filters.sex.length ? filters.sex : undefined,
      labels: filters.labels.length ? filters.labels : undefined,
      in_milk_withdrawal:
        filters.in_milk_withdrawal.length === 1
          ? filters.in_milk_withdrawal[0] === 'true'
          : undefined,
    }),
  });

  // All filtering happens server-side, so the rows, total and summary
  // returned by the API already reflect the active filters.
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const summary = data?.summary ?? { production: 0, withdrawn: 0, other: 0, total: 0 };

  const onSort = (key: string) => {
    setPage(0);
    setSortBy((prev) => {
      if (prev === key) {
        // toggle direction
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      // change key, keep asc by default
      setSortDir('asc');
      return key;
    });
  };

  const renderHeader = (label: string, key: string) => {
    const isActive = sortBy === key;
    const icon = !isActive ? (
      <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />
    ) : sortDir === 'asc' ? (
      <ChevronUp className="ml-1 h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="ml-1 h-3.5 w-3.5" />
    );
    return (
      <button
        type="button"
        className={`inline-flex items-center hover:text-foreground ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}
        onClick={() => onSort(key)}
        title={`${t('animals.sortBy')} ${label}`}
      >
        <span>{label}</span>
        {icon}
      </button>
    );
  };

  const renderPhoto = (animal: any) => {
    const url = getAnimalImageUrl(animal) ?? "/logo.png";
    return (
      <div className="h-12 w-12 rounded-md bg-muted overflow-hidden border border-border">
        <AnimalPhotoLightbox
          animalId={animal.id}
          primaryUrl={animal.primary_photo_url || animal.photo_url}
          primarySignedUrl={animal.primary_photo_signed_url}
          fallbackUrl={url}
          alt={animal.name || animal.tag || "Animal"}
          className="h-full w-full"
          thumbClassName="h-full w-full"
        />
      </div>
    );
  };

  const getStatusBadge = (statusOrCode: string, label?: string, desc?: string) => {
    const statusKey = getStatusKeyFromCode(statusOrCode) || statusOrCode.toLowerCase();
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

    const text = label ?? labels[statusKey as keyof typeof labels] ?? statusKey;
    return (
      <Badge variant={variants[statusKey as keyof typeof variants] ?? 'outline'} title={desc ?? ''}>
        {text}
      </Badge>
    );
  };

  const calculateAge = (birthDate?: string | null) => {
    if (!birthDate) return '-';
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return '-';
    const now = new Date();
    const ageInMonths = (now.getFullYear() - birth.getFullYear()) * 12 +
                       (now.getMonth() - birth.getMonth());

    if (ageInMonths < 12) {
      return `${ageInMonths} ${t('animals.months')}`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const remainingMonths = ageInMonths % 12;
      return `${years}a ${remainingMonths}m`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('animals.title')}</h1>
          <p className="text-muted-foreground">
            {t('animals.subtitle')}
          </p>
        </div>
        <Button asChild className="flex items-center gap-2">
          <Link to="/animals/new">
            <Plus className="h-4 w-4" />
            {t('animals.newAnimal')}
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Milk className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{summary.production}</p>
                <p className="text-sm text-muted-foreground">{t('animals.inProductionStats')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-2xl font-bold">{summary.withdrawn}</p>
              <p className="text-sm text-muted-foreground">{t('animals.withdrawnStats')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-2xl font-bold">{summary.other}</p>
              <p className="text-sm text-muted-foreground">{t('animals.otherStats')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-2xl font-bold">{summary.total}</p>
              <p className="text-sm text-muted-foreground">{t('animals.totalStats')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('animals.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              className="pl-10"
            />
          </div>
          <AnimalsFilters
            filters={filters}
            onChange={(next) => { setFilters(next); setPage(0); }}
          />
        </CardContent>
      </Card>

      {/* Results count + sort toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{total}</span> {t('animals.animalsFound')}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('animals.sortBy')}</span>
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(0); }}>
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tag">{t('animals.sortTag')}</SelectItem>
              <SelectItem value="name">{t('animals.sortName')}</SelectItem>
              <SelectItem value="breed">{t('animals.sortBreed')}</SelectItem>
              <SelectItem value="age">{t('animals.sortAge')}</SelectItem>
              <SelectItem value="lot">{t('animals.sortLot')}</SelectItem>
              <SelectItem value="classification">{t('animals.sortClassification')}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => { setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); setPage(0); }}
            title={t('animals.sortToggleDirection')}
            aria-label={sortDir === 'asc' ? t('animals.sortAscending') : t('animals.sortDescending')}
          >
            {sortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Animals Table - Desktop */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>{t('animals.animalsList')}</CardTitle>
          <CardDescription>
            {total} {t('animals.animalsFound')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('animals.showing')} {items.length === 0 ? 0 : (page * pageSize) + 1} - {Math.min((page + 1) * pageSize, total)} {t('animals.of')} {total}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('animals.perPage')}</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v, 10)); setPage(0); }}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => ((p + 1) * pageSize < total ? p + 1 : p))} disabled={(page + 1) * pageSize >= total}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">{t('common.photo') ?? 'Foto'}</TableHead>
                    <TableHead>{renderHeader(t('animals.sortTag'), 'tag')}</TableHead>
                    <TableHead>{renderHeader(t('common.name'), 'name')}</TableHead>
                    <TableHead>{renderHeader(t('animals.breed'), 'breed')}</TableHead>
                    <TableHead>{renderHeader(t('animals.age'), 'age')}</TableHead>
                    <TableHead>{renderHeader(t('animals.lot'), 'lot')}</TableHead>
                  <TableHead>{renderHeader(t('animals.status'), 'classification')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((animal) => (
                  <TableRow
                    key={animal.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/animals/${animal.id}`)}
                  >
                    <TableCell>{renderPhoto(animal)}</TableCell>
                    <TableCell className="font-medium">{animal.tag}</TableCell>
                    <TableCell>{animal.name}</TableCell>
                    <TableCell>{animal.breed}</TableCell>
                    <TableCell>{calculateAge((animal as any).birth_date)}</TableCell>
                    <TableCell>{animal.lot}</TableCell>
                    <TableCell>{getStatusBadge(((animal as any).status_code ?? (animal as any).status) || "", (animal as any).status, (animal as any).status_desc)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link to={`/animals/${animal.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t('animals.noAnimalsFound')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Animals Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {/* Pagination Controls - Mobile */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('animals.showing')} {items.length === 0 ? 0 : (page * pageSize) + 1} - {Math.min((page + 1) * pageSize, total)} {t('animals.of')} {total}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('animals.perPage')}</span>
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v, 10)); setPage(0); }}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => ((p + 1) * pageSize < total ? p + 1 : p))} disabled={(page + 1) * pageSize >= total}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {items.map((animal) => (
          <Card key={animal.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2 gap-3">
                <Link to={`/animals/${animal.id}`} className="flex-1 cursor-pointer">
                  <div className="flex gap-3">
                    {renderPhoto(animal)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{animal.tag}</span>
                        {getStatusBadge(((animal as any).status_code ?? (animal as any).status) || "", (animal as any).status, (animal as any).status_desc)}
                      </div>
                      <h3 className="font-medium">{animal.name}</h3>
                    </div>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <Link to={`/animals/${animal.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <Link to={`/animals/${animal.id}`} className="block cursor-pointer">
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>{t('animals.breed')}: {animal.breed}</div>
                  <div>{t('animals.lot')}: {animal.lot}</div>
                  <div className="col-span-2">{t('animals.age')}: {calculateAge(animal.birth_date)}</div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('animals.noAnimalsFound')}</p>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <Button
        asChild
        className="fixed bottom-16 right-6 h-14 w-14 rounded-full shadow-lg md:hidden"
        size="icon"
      >
        <Link to="/animals/new">
          <Plus className="h-6 w-6" />
        </Link>
      </Button>
    </div>
  );
}
