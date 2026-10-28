import { Link, useNavigate } from "react-router-dom";
import { Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useImportSiresFromHerd, useSires } from "@/hooks/useReproduction";
import { useToast } from "@/hooks/use-toast";

interface SireInfoCardProps {
  animalId: string;
}

/** For a herd bull: its entry in the sire catalog, or a way to add it. */
export default function SireInfoCard({ animalId }: SireInfoCardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data, isLoading } = useSires({ active_only: false, limit: 500 });
  const importMutation = useImportSiresFromHerd();
  const entry = data?.items?.find((s) => s.animal_id === animalId);

  const handleAdd = async () => {
    try {
      const [created] = await importMutation.mutateAsync([animalId]);
      toast({ title: t("reproduction.sireCreated") });
      if (created) navigate(`/reproduction/sires/${created.id}`);
    } catch (e) {
      toast({
        title: t("common.error"),
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          {t("animals.sireInfo.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {entry ? (
          <>
            <p className="text-sm">
              {t("animals.sireInfo.inCatalog")} <span className="font-medium">{entry.name}</span>
              {!entry.is_active && <span className="text-muted-foreground"> ({t("reproduction.inactive")})</span>}
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/reproduction/sires/${entry.id}`}>{t("animals.sireInfo.viewInCatalog")}</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{t("animals.sireInfo.notInCatalog")}</p>
            <Button size="sm" onClick={handleAdd} disabled={importMutation.isPending}>
              {t("animals.sireInfo.addToCatalog")}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
