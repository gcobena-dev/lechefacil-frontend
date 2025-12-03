import { useEffect, useMemo, useState } from "react";
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
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listAnimals } from "@/services/animals";
import { getLots } from "@/services/lots";
import { useTranslation } from "@/hooks/useTranslation";
import { getAnimalImageUrl, getStatusKeyFromCode } from "@/utils/animals";
import { getPref, setPref } from "@/utils/prefs";

export default function Animals() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(() => getPref<string>('prefs:animals:search', '', { session: true }));
  const [statusFilter, setStatusFilter] = useState<string>(() => getPref<string>('prefs:animals:status', 'all', { session: true }));
  const [lotFilter, setLotFilter] = useState<string>(() => getPref<string>('prefs:animals:lot', '', { session: true }));
  const [pageSize, setPageSize] = useState<number>(() => getPref<number>('prefs:animals:pageSize', 10, { session: true }));
  const [page, setPage] = useState<number>(() => getPref<number>('prefs:animals:page', 0, { session: true }));
  const [sortBy, setSortBy] = useState<string>(() => getPref<string>('prefs:animals:sortBy', 'tag', { session: true }));
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(() => getPref<'asc' | 'desc'>('prefs:animals:sortDir', 'asc', { session: true }));

  // Persist changes during the session
  useEffect(() => { setPref('prefs:animals:search', searchTerm, { session: true }); }, [searchTerm]);
  useEffect(() => { setPref('prefs:animals:status', statusFilter, { session: true }); }, [statusFilter]);
  useEffect(() => { setPref('prefs:animals:lot', lotFilter, { session: true }); }, [lotFilter]);
  useEffect(() => { setPref('prefs:animals:pageSize', pageSize, { session: true }); }, [pageSize]);
  useEffect(() => { setPref('prefs:animals:page', page, { session: true }); }, [page]);
  useEffect(() => { setPref('prefs:animals:sortBy', sortBy, { session: true }); }, [sortBy]);
  useEffect(() => { setPref('prefs:animals:sortDir', sortDir, { session: true }); }, [sortDir]);

  const { data } = useQuery({
    queryKey: ["animals", { q: searchTerm, limit: pageSize, offset: page * pageSize, sortBy, sortDir, statusFilter }],
    queryFn: () => listAnimals({
      q: searchTerm || undefined,
      limit: pageSize,
      offset: page * pageSize,
      sort_by: sortBy,
      sort_dir: sortDir,
      status_codes: statusFilter === 'sold'
        ? 'SOLD'
        : statusFilter === 'culled'
          ? 'CULLED'
          : statusFilter === 'dead'
            ? 'DEAD'
            : undefined,
    }),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  
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
        title={`Ordenar por ${label}`}
      >
        <span>{label}</span>
        {icon}
      </button>
    );
  };
  const { data: lots = [] } = useQuery({
    queryKey: ["lots", { active: true }],
    queryFn: () => getLots({ active: true }),
  });
  

  const filteredAnimals = useMemo(() => {
    return items.filter((animal) => {
      const name = (animal.name ?? "").toLowerCase();
      const tag = (animal.tag ?? "").toLowerCase();
      const breed = (animal.breed ?? "").toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase()) ||
        tag.includes(searchTerm.toLowerCase()) ||
        breed.includes(searchTerm.toLowerCase());
      const statusKey = getStatusKeyFromCode((animal as any).status_code ?? (animal as any).status);
      const matchesStatus = statusFilter === "all" || statusKey === statusFilter;
      const selectedLotName = (lots as any[]).find(l => l.id === lotFilter)?.name;
      const matchesLot = !lotFilter || (animal.lot ?? "") === (selectedLotName ?? "");
      return matchesSearch && matchesStatus && matchesLot;
    });
  }, [items, searchTerm, statusFilter, lotFilter, lots]);

  const computeSummary = (list: typeof items) => {
    return list.reduce(
      (acc, animal) => {
        const statusKey = getStatusKeyFromCode((animal as any).status_code ?? (animal as any).status);
        if (statusKey === 'sold') acc.sold += 1;
        else if (statusKey === 'culled') acc.culled += 1;
        else if (statusKey === 'active' || statusKey === 'lactating') acc.production += 1;
        acc.total += 1;
        return acc;
      },
      { production: 0, sold: 0, culled: 0, total: 0 }
    );
  };

  const summary = useMemo(() => {
    // Use backend-provided summary when no local-only filters apply
    if (statusFilter === 'all' && !lotFilter && data?.summary) {
      return data.summary;
    }
    return computeSummary(filteredAnimals);
  }, [data?.summary, filteredAnimals, lotFilter, statusFilter]);

  const renderPhoto = (animal: any) => {
    const url = getAnimalImageUrl(animal) ?? "/logo.png";
    return (
      <div className="h-12 w-12 rounded-md bg-muted overflow-hidden border border-border">
        <img
          src={url}
          alt={animal.name || animal.tag || "Animal"}
          className="h-full w-full object-cover"
          loading="lazy"
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
              <p className="text-2xl font-bold">{summary.sold}</p>
              <p className="text-sm text-muted-foreground">{t('animals.soldStats')}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-2xl font-bold">{summary.culled}</p>
              <p className="text-sm text-muted-foreground">{t('animals.culledStats')}</p>
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
        <CardHeader>
          <CardTitle>{t('animals.filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('animals.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
              title="Ordenar por"
            >
              <option value="tag">Código</option>
              <option value="name">Nombre</option>
              <option value="breed">Raza</option>
              <option value="age">Edad</option>
              <option value="lot">Lote</option>
              <option value="classification">Clasificación</option>
            </select>
            <select
              value={sortDir}
              onChange={(e) => { setSortDir(e.target.value as 'asc' | 'desc'); setPage(0); }}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
              title="Dirección"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="all">{t('animals.allStatuses')}</option>
              <option value="active">{t('animals.activeFilter')}</option>
              <option value="sold">{t('animals.soldFilter')}</option>
              <option value="culled">{t('animals.culledFilter')}</option>
              <option value="dead">{t('animals.deadFilter')}</option>
            </select>
            <select
              value={lotFilter}
              onChange={(e) => setLotFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="">{t('animals.allLots') ?? 'Todos los lotes'}</option>
              {(lots as any[]).map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Animals Table - Desktop */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>{t('animals.animalsList')}</CardTitle>
          <CardDescription>
            {filteredAnimals.length} {t('animals.animalsFound')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mostrando {filteredAnimals.length === 0 ? 0 : (page * pageSize) + 1} - {Math.min((page + 1) * pageSize, total)} de {total}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Por página</span>
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
                    <TableHead>{renderHeader('Tag', 'tag')}</TableHead>
                    <TableHead>{renderHeader(t('common.name'), 'name')}</TableHead>
                    <TableHead>{renderHeader(t('animals.breed'), 'breed')}</TableHead>
                    <TableHead>{renderHeader(t('animals.age'), 'age')}</TableHead>
                    <TableHead>{renderHeader(t('animals.lot'), 'lot')}</TableHead>
                  <TableHead>{renderHeader(t('animals.status'), 'classification')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnimals.map((animal) => (
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
                <span className="text-sm text-muted-foreground">Mostrando {filteredAnimals.length === 0 ? 0 : (page * pageSize) + 1} - {Math.min((page + 1) * pageSize, total)} de {total}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Por página</span>
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
        {filteredAnimals.map((animal) => (
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
        
        {filteredAnimals.length === 0 && (
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
