import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useSires, useDeleteSire } from "@/hooks/useReproduction";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft, Plus, Search, Heart } from "lucide-react";

export default function SireCatalog() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const deleteMutation = useDeleteSire();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading } = useSires({
    active_only: false,
    search: search || undefined,
    limit: pageSize,
    offset: page * pageSize,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("reproduction.confirmDeleteSire"))) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: t("reproduction.sireDeleted") });
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
          <h1 className="text-xl font-bold">{t("reproduction.sireCatalog")}</h1>
        </div>
        <Button onClick={() => navigate("/reproduction/sires/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("reproduction.newSire")}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("reproduction.search")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {t("reproduction.loading")}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>{t("reproduction.noSires")}</p>
          <p className="text-sm mt-1">{t("reproduction.addFirstSire")}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("reproduction.sireName")}</TableHead>
                  <TableHead>{t("reproduction.shortCode")}</TableHead>
                  <TableHead>{t("reproduction.registryCode")}</TableHead>
                  <TableHead>{t("reproduction.registryName")}</TableHead>
                  <TableHead>{t("reproduction.pregnancyStatus")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((sire) => (
                  <TableRow
                    key={sire.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/reproduction/sires/${sire.id}`)}
                  >
                    <TableCell className="font-medium">{sire.name}</TableCell>
                    <TableCell>{sire.short_code || "-"}</TableCell>
                    <TableCell>{sire.registry_code || "-"}</TableCell>
                    <TableCell>{sire.registry_name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={sire.is_active ? "default" : "secondary"}>
                        {sire.is_active ? t("reproduction.active") : t("reproduction.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/reproduction/sires/${sire.id}/edit`)}
                        >
                          {t("reproduction.editSire")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(sire.id)}
                        >
                          {t("reproduction.delete")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {items.map((sire) => (
              <Card
                key={sire.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/reproduction/sires/${sire.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">{sire.name}</p>
                      {sire.short_code && (
                        <p className="text-sm text-muted-foreground">{sire.short_code}</p>
                      )}
                      {sire.registry_code && (
                        <p className="text-xs text-muted-foreground">
                          {sire.registry_code}
                          {sire.registry_name ? ` (${sire.registry_name})` : ""}
                        </p>
                      )}
                    </div>
                    <Badge variant={sire.is_active ? "default" : "secondary"}>
                      {sire.is_active ? t("reproduction.active") : t("reproduction.inactive")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
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
