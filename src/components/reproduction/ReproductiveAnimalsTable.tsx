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
  ClipboardCheck,
  Eye,
  FileCheck2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
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
import type { ReproductiveAnimalRow, ReproductiveBucket } from "@/services/reproductionDashboard";

interface Props {
  items: ReproductiveAnimalRow[];
  bucket: ReproductiveBucket;
  total: number;
  isLoading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b">
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

        {/* Desktop table */}
        <div
          className={`hidden md:block min-h-[420px] transition-opacity ${
            isLoading && items.length > 0 ? "opacity-60" : ""
          }`}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("reproduction.colId")}</TableHead>
                <TableHead>{t("reproduction.colCow")}</TableHead>
                <TableHead className="text-right">{daysColLabel}</TableHead>
                <TableHead>{t("reproduction.colState")}</TableHead>
                <TableHead>{t("reproduction.colSituation")}</TableHead>
                <TableHead>{t("reproduction.colLastEvent")}</TableHead>
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
