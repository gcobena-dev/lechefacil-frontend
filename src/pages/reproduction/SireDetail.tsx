import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useSire, useSirePerformance, useInseminations } from "@/hooks/useReproduction";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit } from "lucide-react";
import { SirePerformanceCard } from "@/components/reproduction/SirePerformanceCard";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  OPEN: "outline",
  LOST: "destructive",
};

export default function SireDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: sire, isLoading } = useSire(id);
  const { data: performance } = useSirePerformance(id);
  const { data: inseminationsData } = useInseminations({
    sire_catalog_id: id,
    limit: 10,
  });

  const inseminations = inseminationsData?.items ?? [];

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 text-center text-muted-foreground">
        {t("reproduction.loading")}
      </div>
    );
  }

  if (!sire) {
    return (
      <div className="p-4 md:p-6 text-center text-muted-foreground">
        {t("reproduction.noResults")}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reproduction/sires")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{sire.name}</h1>
          <Badge variant={sire.is_active ? "default" : "secondary"}>
            {sire.is_active ? t("reproduction.active") : t("reproduction.inactive")}
          </Badge>
        </div>
        <Button className="w-full md:w-auto" variant="outline" onClick={() => navigate(`/reproduction/sires/${id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          {t("reproduction.editSire")}
        </Button>
      </div>

      {/* Sire Info */}
      <Card>
        <CardContent className="p-4 space-y-2">
          {sire.short_code && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t("reproduction.shortCode")}</span>
              <span className="text-sm font-medium">{sire.short_code}</span>
            </div>
          )}
          {sire.registry_code && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t("reproduction.registryCode")}</span>
              <span className="text-sm font-medium">{sire.registry_code}</span>
            </div>
          )}
          {sire.registry_name && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t("reproduction.registryName")}</span>
              <span className="text-sm font-medium">{sire.registry_name}</span>
            </div>
          )}
          {sire.genetic_notes && (
            <div>
              <span className="text-sm text-muted-foreground">{t("reproduction.geneticNotes")}</span>
              <p className="text-sm mt-1">{sire.genetic_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance */}
      {performance && <SirePerformanceCard performance={performance} />}

      {/* Recent Inseminations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("reproduction.recentInseminations")}</CardTitle>
        </CardHeader>
        <CardContent>
          {inseminations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("reproduction.noInseminations")}
            </p>
          ) : (
            <div className="space-y-3">
              {inseminations.map((ins) => (
                <div key={ins.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      {ins.animal_tag || ins.animal_id.slice(0, 8)}{ins.animal_name ? ` - ${ins.animal_name}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ins.service_date).toLocaleDateString()} - {t(`reproduction.method${ins.method}`)}
                    </p>
                    {ins.technician && (
                      <p className="text-xs text-muted-foreground">{ins.technician}</p>
                    )}
                  </div>
                  <Badge variant={STATUS_VARIANTS[ins.pregnancy_status] || "secondary"}>
                    {t(`reproduction.${ins.pregnancy_status.toLowerCase()}`)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
