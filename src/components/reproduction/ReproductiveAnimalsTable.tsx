import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Eye,
  FileCheck2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsAdmin } from "@/hooks/useAuth";
import { PregnancyCheckDialog } from "@/components/reproduction/PregnancyCheckDialog";
import LastCheckResultDialog from "@/components/reproduction/LastCheckResultDialog";
import EditInseminationByIdDialog from "@/components/reproduction/EditInseminationByIdDialog";
import TablePagination from "@/components/ui/table-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReproductiveAnimalsFilters, {
  type ReproFilterState,
} from "@/components/reproduction/ReproductiveAnimalsFilters";
import type {
  ReproductiveAnimalRow,
  ReproductiveBucket,
  ReproductiveSort,
} from "@/services/reproductionDashboard";

interface Props {
  items: ReproductiveAnimalRow[];
  bucket: ReproductiveBucket;
  total: number;
  isLoading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  filters: ReproFilterState;
  onFiltersChange: (filters: ReproFilterState) => void;
  sort: ReproductiveSort;
  sortDir: "asc" | "desc";
  onSortChange: (sort: ReproductiveSort, dir: "asc" | "desc") => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

// Direction a column starts on when first clicked. Dates and day counts read
// best newest/highest first; text reads best A→Z.
const DEFAULT_SORT_DIR: Record<ReproductiveSort, "asc" | "desc"> = {
  tag: "asc",
  name: "asc",
  days: "desc",
  postpartum: "desc",
  alert: "asc",
  situation: "asc",
  last_event: "desc",
};

const ALERT_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  optimal: "default",
  warning: "secondary",
  critical: "destructive",
  none: "outline",
};

function formatDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString();
}

// Formats an ISO date (YYYY-MM-DD) as DD/MM/YY without timezone shifts.
function formatShortDate(s: string | null): string {
  if (!s) return "—";
  const [y, m, d] = s.slice(0, 10).split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y.slice(2)}`;
}

function eventLabel(type: string | null, t: (k: string) => string): string {
  if (type === "calving") return t("reproduction.eventCalving");
  if (type === "insemination") return t("reproduction.eventInsemination");
  if (type === "check") return t("reproduction.eventCheck");
  return "—";
}

function alertLabel(level: string, t: (k: string) => string): string {
  switch (level) {
    case "critical":
      return t("reproduction.stateCritical");
    case "warning":
      return t("reproduction.stateWarning");
    case "optimal":
      return t("reproduction.stateOptimal");
    default:
      return t("reproduction.stateNone");
  }
}

export default function ReproductiveAnimalsTable({
  items,
  bucket,
  total,
  isLoading,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  sort,
  sortDir,
  onSortChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const [checkDialogId, setCheckDialogId] = useState<string | null>(null);
  const [resultDialogId, setResultDialogId] = useState<string | null>(null);
  const [editDialogId, setEditDialogId] = useState<string | null>(null);

  const handleRowClick = (row: ReproductiveAnimalRow) => {
    const status = row.last_insemination_status;
    const isEmpty = status === "OPEN" || status === "LOST";

    if (!row.last_insemination_id || isEmpty) {
      // Sin inseminar o vacía (OPEN/LOST): el siguiente paso es registrar una nueva inseminación
      navigate(`/reproduction/inseminations/new?animal_id=${row.animal_id}`);
    } else {
      // Tiene inseminación PENDING o CONFIRMED: ver detalle
      setResultDialogId(row.last_insemination_id);
    }
  };

  // Clicking the active column flips its direction; a new column starts on
  // whichever direction is most useful for that kind of value.
  const handleSort = (key: ReproductiveSort) => {
    if (key === sort) {
      onSortChange(key, sortDir === "asc" ? "desc" : "asc");
    } else {
      onSortChange(key, DEFAULT_SORT_DIR[key]);
    }
  };

  const renderSortHeader = (label: string, key: ReproductiveSort) => {
    const isActive = sort === key;
    const Icon = !isActive ? ArrowUpDown : sortDir === "asc" ? ChevronUp : ChevronDown;
    return (
      <button
        type="button"
        onClick={() => handleSort(key)}
        aria-label={`${label} — ${t("reproduction.sortByColumn")}`}
        title={t("reproduction.sortByColumn")}
        className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
          isActive ? "text-foreground font-semibold" : ""
        }`}
      >
        <span>{label}</span>
        <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "" : "opacity-40"}`} />
      </button>
    );
  };

  // The days column adapts: gestation days on the "pregnant" tab,
  // postpartum days elsewhere, generic on the mixed "all" tab.
  const daysColLabel =
    bucket === "prenadas"
      ? t("reproduction.colDaysPregnant")
      : bucket === "todas"
        ? t("reproduction.colDays")
        : t("reproduction.colDaysPostpartum");

  const renderDaysCell = (row: ReproductiveAnimalRow) => {
    if (row.bucket === "prenadas") {
      return (
        <div className="flex flex-col items-end leading-tight">
          <span>{row.days_pregnant != null ? `${row.days_pregnant} d` : "—"}</span>
          {row.expected_calving_date && (
            <span className="text-xs text-muted-foreground">
              {t("reproduction.calvingOn")} ~{formatShortDate(row.expected_calving_date)}
            </span>
          )}
        </div>
      );
    }
    return <span>{row.days_postpartum != null ? `${row.days_postpartum} d` : "—"}</span>;
  };

  const renderRowMenu = (row: ReproductiveAnimalRow) => {
    const status = row.last_insemination_status;
    const isPending = status === "PENDING";
    const hasCheck = status === "CONFIRMED" || status === "OPEN" || status === "LOST";
    // Show "Nueva inseminación" only for cows that need one:
    // never inseminated, or last result was OPEN/LOST.
    const showNewInsemination = status == null || status === "OPEN" || status === "LOST";

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => e.stopPropagation()}
            aria-label={t("reproduction.menuMore")}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {isPending && row.last_insemination_id && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setCheckDialogId(row.last_insemination_id);
              }}
            >
              <ClipboardCheck className="mr-2 h-4 w-4" />
              {t("reproduction.menuRecordCheck")}
            </DropdownMenuItem>
          )}
          {isPending && row.last_insemination_id && isAdmin && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setEditDialogId(row.last_insemination_id);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {t("reproduction.menuEditInsemination")}
            </DropdownMenuItem>
          )}
          {hasCheck && row.last_insemination_id && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setResultDialogId(row.last_insemination_id);
              }}
            >
              <FileCheck2 className="mr-2 h-4 w-4" />
              {t("reproduction.menuViewResult")}
            </DropdownMenuItem>
          )}
          {showNewInsemination && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/reproduction/inseminations/new?animal_id=${row.animal_id}`);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("reproduction.menuNewInsemination")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/animals/${row.animal_id}`);
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            {t("reproduction.menuViewDetail")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 p-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t("reproduction.searchPlaceholder")}
                className="pl-8"
              />
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              <span className="font-medium text-foreground">{total}</span>{" "}
              {t("reproduction.results")}
            </div>
          </div>
          <ReproductiveAnimalsFilters
            bucket={bucket}
            filters={filters}
            onChange={onFiltersChange}
          />
          {/* Sorting lives in the column headers on desktop; the card list needs
              its own control. */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {t("reproduction.sortBy")}
            </span>
            <Select
              value={sort}
              onValueChange={(v) => onSortChange(v as ReproductiveSort, DEFAULT_SORT_DIR[v as ReproductiveSort])}
            >
              <SelectTrigger className="h-8 flex-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tag">{t("reproduction.colId")}</SelectItem>
                <SelectItem value="name">{t("reproduction.colCow")}</SelectItem>
                <SelectItem value="days">{daysColLabel}</SelectItem>
                <SelectItem value="alert">{t("reproduction.colState")}</SelectItem>
                <SelectItem value="situation">{t("reproduction.colSituation")}</SelectItem>
                <SelectItem value="last_event">{t("reproduction.colLastEvent")}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onSortChange(sort, sortDir === "asc" ? "desc" : "asc")}
              aria-label={
                sortDir === "asc"
                  ? t("reproduction.sortedAscending")
                  : t("reproduction.sortedDescending")
              }
            >
              {sortDir === "asc" ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Desktop table */}
        <div
          className={`hidden md:block min-h-[420px] transition-opacity ${
            isLoading && items.length > 0 ? "opacity-60" : ""
          }`}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{renderSortHeader(t("reproduction.colId"), "tag")}</TableHead>
                <TableHead>{renderSortHeader(t("reproduction.colCow"), "name")}</TableHead>
                <TableHead className="text-right">
                  {renderSortHeader(daysColLabel, "days")}
                </TableHead>
                <TableHead>{renderSortHeader(t("reproduction.colState"), "alert")}</TableHead>
                <TableHead>
                  {renderSortHeader(t("reproduction.colSituation"), "situation")}
                </TableHead>
                <TableHead>
                  {renderSortHeader(t("reproduction.colLastEvent"), "last_event")}
                </TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    {isLoading ? t("reproduction.loading") : t("reproduction.noAnimalsInBucket")}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => (
                  <TableRow
                    key={row.animal_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(row)}
                  >
                    <TableCell className="text-muted-foreground">#{row.tag}</TableCell>
                    <TableCell className="font-medium">{row.name || "—"}</TableCell>
                    <TableCell className="text-right">
                      {renderDaysCell(row)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ALERT_VARIANT[row.alert_level] ?? "outline"}>
                        {alertLabel(row.alert_level, t)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.situation_label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.last_event_type
                        ? `${eventLabel(row.last_event_type, t)} ${formatDate(row.last_event_date)}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/animals/${row.animal_id}`);
                          }}
                          aria-label={t("reproduction.menuViewDetail")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {renderRowMenu(row)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div
          className={`md:hidden divide-y min-h-[360px] transition-opacity ${
            isLoading && items.length > 0 ? "opacity-60" : ""
          }`}
        >
          {items.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground text-sm">
              {isLoading ? t("reproduction.loading") : t("reproduction.noAnimalsInBucket")}
            </div>
          ) : (
            items.map((row) => (
              <div
                key={row.animal_id}
                className="p-4 cursor-pointer active:bg-muted/50"
                onClick={() => handleRowClick(row)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{row.name || `#${row.tag}`}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      #{row.tag}
                      {row.bucket === "prenadas"
                        ? row.days_pregnant != null &&
                          ` · ${row.days_pregnant}d ${t("reproduction.unitPregnant")}`
                        : row.days_postpartum != null &&
                          ` · ${row.days_postpartum}d ${t("reproduction.unitPostpartum")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge
                      variant={ALERT_VARIANT[row.alert_level] ?? "outline"}
                      className="text-[10px] px-1.5"
                    >
                      {alertLabel(row.alert_level, t)}
                    </Badge>
                    {renderRowMenu(row)}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5">
                    {row.situation_label}
                  </Badge>
                  {row.last_event_type && (
                    <span className="text-muted-foreground truncate text-right">
                      {eventLabel(row.last_event_type, t)} {formatDate(row.last_event_date)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {total > 0 && (
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        )}
      </CardContent>

      {checkDialogId && (
        <PregnancyCheckDialog
          inseminationId={checkDialogId}
          isOpen={!!checkDialogId}
          onClose={() => setCheckDialogId(null)}
        />
      )}

      {resultDialogId && (
        <LastCheckResultDialog
          inseminationId={resultDialogId}
          isOpen={!!resultDialogId}
          onClose={() => setResultDialogId(null)}
        />
      )}

      {editDialogId && (
        <EditInseminationByIdDialog
          inseminationId={editDialogId}
          open={!!editDialogId}
          onOpenChange={(open) => {
            if (!open) setEditDialogId(null);
          }}
        />
      )}
    </Card>
  );
}
