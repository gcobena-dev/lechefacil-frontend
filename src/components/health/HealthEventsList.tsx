import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listHealthRecords } from "@/services/healthRecords";
import HealthEventCard from "./HealthEventCard";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HealthEventsListProps {
  animalId: string;
}

export default function HealthEventsList({ animalId }: HealthEventsListProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["health-records", animalId, page, pageSize],
    queryFn: () => listHealthRecords(animalId, { limit: pageSize, offset: page * pageSize }),
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;
  const hasNextPage = page < totalPages - 1;
  const hasPrevPage = page > 0;

  const handleExpandToggle = (eventId: string) => {
    setExpandedId(expandedId === eventId ? null : eventId);
  };

  if (isLoading) {
    return <div className="text-center py-8">{t("health.loadingEvents")}</div>;
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">
          {t("health.noHealthEvents")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("health.startRegistering")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Paginación arriba */}
      {data.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b">
          {/* Selector de página */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground order-2 sm:order-1">
            <span className="hidden sm:inline">{t("common.showing")}</span>
            <span className="font-medium">
              {page * pageSize + 1}-{Math.min((page + 1) * pageSize, data.total)}
            </span>
            <span>{t("common.of")}</span>
            <span className="font-medium">{data.total}</span>
          </div>

          {/* Controles de paginación */}
          <div className="flex items-center gap-2 order-1 sm:order-2">
            {/* Selector de tamaño de página */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">{t("common.rowsPerPage")}:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botones de navegación */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={!hasPrevPage}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center justify-center min-w-[80px] text-sm">
                <span className="font-medium">{page + 1}</span>
                <span className="mx-1">/</span>
                <span className="text-muted-foreground">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!hasNextPage}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de eventos */}
      <div className="space-y-3">
        {data.items.map((event) => (
          <HealthEventCard
            key={event.id}
            event={event}
            animalId={animalId}
            expanded={expandedId === event.id}
            onExpandToggle={() => handleExpandToggle(event.id)}
          />
        ))}
      </div>
    </div>
  );
}
