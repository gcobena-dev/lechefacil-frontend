import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useSemenStock, useDeleteSemenStock } from "@/hooks/useReproduction";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Package, Plus } from "lucide-react";

export default function SemenInventory() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const deleteMutation = useDeleteSemenStock();
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading } = useSemenStock({
    limit: pageSize,
    offset: page * pageSize,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("reproduction.confirmDeleteStock"))) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: t("reproduction.stockDeleted") });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reproduction")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{t("reproduction.semenStock")}</h1>
        </div>
        <Button onClick={() => navigate("/reproduction/semen/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("reproduction.addStock")}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {t("reproduction.loading")}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>{t("reproduction.noStock")}</p>
          <p className="text-sm mt-1">{t("reproduction.addFirstStock")}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("reproduction.batchCode")}</TableHead>
                  <TableHead>{t("reproduction.tankId")}</TableHead>
                  <TableHead>{t("reproduction.currentQuantity")}</TableHead>
                  <TableHead>{t("reproduction.initialQuantity")}</TableHead>
                  <TableHead>{t("reproduction.supplier")}</TableHead>
                  <TableHead>{t("reproduction.costPerStraw")}</TableHead>
                  <TableHead>{t("reproduction.purchaseDate")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((stock) => (
                  <TableRow key={stock.id}>
                    <TableCell className="font-medium">{stock.batch_code || "-"}</TableCell>
                    <TableCell>{stock.tank_id || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={stock.current_quantity > 0 ? "default" : "destructive"}>
                        {stock.current_quantity}
                      </Badge>
                    </TableCell>
                    <TableCell>{stock.initial_quantity}</TableCell>
                    <TableCell>{stock.supplier || "-"}</TableCell>
                    <TableCell>
                      {stock.cost_per_straw
                        ? `${stock.cost_per_straw} ${stock.currency}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {stock.purchase_date
                        ? new Date(stock.purchase_date).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(stock.id)}
                      >
                        {t("reproduction.delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {items.map((stock) => (
              <Card key={stock.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">{stock.batch_code || "Sin lote"}</p>
                      {stock.supplier && (
                        <p className="text-sm text-muted-foreground">{stock.supplier}</p>
                      )}
                      {stock.tank_id && (
                        <p className="text-xs text-muted-foreground">
                          {t("reproduction.tankId")}: {stock.tank_id}
                        </p>
                      )}
                      {stock.cost_per_straw && (
                        <p className="text-xs text-muted-foreground">
                          {stock.cost_per_straw} {stock.currency}
                        </p>
                      )}
                    </div>
                    <Badge variant={stock.current_quantity > 0 ? "default" : "destructive"}>
                      {stock.current_quantity} / {stock.initial_quantity}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                &lt;
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                &gt;
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
