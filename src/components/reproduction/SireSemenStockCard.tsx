import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useSemenStock } from "@/hooks/useReproduction";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Plus } from "lucide-react";

interface Props {
  sireId: string;
}

/** Straws of this bull still in the tank, with the batches they belong to. */
export function SireSemenStockCard({ sireId }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useSemenStock({ sire_catalog_id: sireId });

  const batches = data?.items ?? [];
  const available = batches.reduce((sum, b) => sum + b.current_quantity, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{t("reproduction.semenStock")}</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => navigate("/reproduction/semen/new")}
        >
          <Plus className="mr-1 h-4 w-4" />
          {t("reproduction.addStock")}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-2 text-sm text-muted-foreground">{t("reproduction.loading")}</p>
        ) : batches.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            <Package className="mx-auto mb-2 h-8 w-8 opacity-20" />
            <p>{t("reproduction.noStock")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{available}</span>
              <span className="text-sm text-muted-foreground">
                {t("reproduction.strawsAvailable")}
              </span>
            </div>

            {batches.map((batch) => (
              <button
                key={batch.id}
                type="button"
                onClick={() => navigate(`/reproduction/semen/${batch.id}/edit`)}
                className="flex w-full items-center justify-between gap-3 border-b py-2 text-left last:border-0 hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {batch.batch_code || t("reproduction.batchCode")}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[
                      batch.tank_id && `${t("reproduction.tankId")}: ${batch.tank_id}`,
                      batch.canister_position,
                      batch.expiry_date &&
                        `${t("reproduction.expiryDate")}: ${new Date(
                          batch.expiry_date,
                        ).toLocaleDateString()}`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
                <Badge
                  variant={batch.current_quantity > 0 ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {batch.current_quantity} / {batch.initial_quantity}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
