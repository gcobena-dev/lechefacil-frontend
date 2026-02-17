import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsAdmin } from "@/hooks/useAuth";
import { useInseminations, useSires, useDeleteInsemination } from "@/hooks/useReproduction";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, ArrowUpDown, ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { PregnancyCheckDialog } from "@/components/reproduction/PregnancyCheckDialog";
import EditInseminationDialog from "@/components/reproduction/EditInseminationDialog";
import type { InseminationResponse } from "@/services/inseminations";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  OPEN: "outline",
  LOST: "destructive",
};

export default function InseminationsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sireFilter, setSireFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [sortBy, setSortBy] = useState("service_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [checkDialogId, setCheckDialogId] = useState<string | null>(null);
  const [editingInsemination, setEditingInsemination] = useState<InseminationResponse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const deleteMutation = useDeleteInsemination();

  const { data: siresData } = useSires({ limit: 100 });
  const sires = siresData?.items ?? [];

  const { data, isLoading } = useInseminations({
    pregnancy_status: statusFilter !== "all" ? statusFilter : undefined,
    sire_catalog_id: sireFilter !== "all" ? sireFilter : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    limit: pageSize,
    offset: page * pageSize,
    sort_by: sortBy,
    sort_dir: sortDir,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const onSort = (key: string) => {
    setPage(0);
    setSortBy((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
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
      >
        <span>{label}</span>
        {icon}
      </button>
    );
  };

  return (
    <div className="space-y-3 p-2 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reproduction")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{t("reproduction.inseminations")}</h1>
        </div>
        <Button className="w-full md:w-auto" onClick={() => navigate("/reproduction/inseminations/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("reproduction.newInsemination")}
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:flex gap-2">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("reproduction.all")}</SelectItem>
            <SelectItem value="PENDING">{t("reproduction.pending")}</SelectItem>
            <SelectItem value="CONFIRMED">{t("reproduction.confirmed")}</SelectItem>
            <SelectItem value="OPEN">{t("reproduction.open")}</SelectItem>
            <SelectItem value="LOST">{t("reproduction.lost")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sireFilter} onValueChange={(v) => { setSireFilter(v); setPage(0); }}>
          <SelectTrigger>
            <SelectValue placeholder={t("reproduction.selectSire")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("reproduction.all")} - {t("reproduction.sires")}</SelectItem>
            {sires.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
          placeholder={t("reproduction.serviceDate")}
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">{t("reproduction.loading")}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t("reproduction.noInseminations")}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{renderHeader("Animal", "animal")}</TableHead>
                  <TableHead>{renderHeader(t("reproduction.sire"), "sire")}</TableHead>
                  <TableHead>{renderHeader(t("reproduction.serviceDate"), "service_date")}</TableHead>
                  <TableHead>{renderHeader(t("reproduction.method"), "method")}</TableHead>
                  <TableHead>{renderHeader(t("reproduction.technician"), "technician")}</TableHead>
                  <TableHead>{renderHeader(t("reproduction.pregnancyStatus"), "pregnancy_status")}</TableHead>
                  <TableHead>{renderHeader(t("reproduction.daysSinceService"), "service_date")}</TableHead>
                  <TableHead>{renderHeader(t("reproduction.expectedCalvingDate"), "expected_calving_date")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((ins) => {
                  const daysSince = Math.floor(
                    (Date.now() - new Date(ins.service_date).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <TableRow key={ins.id}>
                      <TableCell className="font-medium">
                        {ins.animal_tag || "-"}{ins.animal_name ? ` - ${ins.animal_name}` : ""}
                      </TableCell>
                      <TableCell>{ins.sire_name || "-"}</TableCell>
                      <TableCell>
                        {new Date(ins.service_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{t(`reproduction.method${ins.method}`)}</TableCell>
                      <TableCell>{ins.technician || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[ins.pregnancy_status] || "secondary"}>
                          {t(`reproduction.${ins.pregnancy_status.toLowerCase()}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{daysSince}d</TableCell>
                      <TableCell>
                        {ins.expected_calving_date
                          ? new Date(ins.expected_calving_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {ins.pregnancy_status === "PENDING" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCheckDialogId(ins.id)}
                            >
                              {t("reproduction.recordCheck")}
                            </Button>
                          )}
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingInsemination(ins)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setDeletingId(ins.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {items.map((ins) => {
              const daysSince = Math.floor(
                (Date.now() - new Date(ins.service_date).getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <Card key={ins.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {ins.animal_tag || "-"}{ins.animal_name ? ` - ${ins.animal_name}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ins.service_date).toLocaleDateString()} -{" "}
                          {t(`reproduction.method${ins.method}`)}
                        </p>
                        {ins.sire_name && (
                          <p className="text-xs text-muted-foreground">
                            {t("reproduction.sire")}: {ins.sire_name}
                          </p>
                        )}
                        {ins.technician && (
                          <p className="text-xs text-muted-foreground">{ins.technician}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{daysSince}d</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={STATUS_VARIANTS[ins.pregnancy_status] || "secondary"}>
                          {t(`reproduction.${ins.pregnancy_status.toLowerCase()}`)}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {ins.pregnancy_status === "PENDING" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCheckDialogId(ins.id)}
                            >
                              {t("reproduction.recordCheck")}
                            </Button>
                          )}
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingInsemination(ins)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setDeletingId(ins.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                &lt;
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                &gt;
              </Button>
            </div>
          )}
        </>
      )}

      {checkDialogId && (
        <PregnancyCheckDialog
          inseminationId={checkDialogId}
          isOpen={!!checkDialogId}
          onClose={() => setCheckDialogId(null)}
        />
      )}

      <EditInseminationDialog
        open={!!editingInsemination}
        onOpenChange={(open) => { if (!open) setEditingInsemination(null); }}
        insemination={editingInsemination}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("reproduction.deleteInsemination")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("reproduction.confirmDeleteInsemination")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("reproduction.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deletingId) return;
                try {
                  await deleteMutation.mutateAsync(deletingId);
                  toast({ title: t("reproduction.inseminationDeleted") });
                } catch {
                  toast({ title: t("reproduction.inseminationDeleted"), variant: "destructive" });
                }
                setDeletingId(null);
              }}
            >
              {t("reproduction.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
