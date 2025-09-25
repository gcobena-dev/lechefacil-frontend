import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Users, Calendar, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { myTenants } from "@/services/auth";
import { setTenantId } from "@/services/config";
import { performLogout } from "@/services/auth";
import { useTranslation } from "@/hooks/useTranslation";

interface Farm {
  id: string;
  name: string;
  location: string;
  role: string;
  animalsCount: number;
  lastAccess: string;
  isActive: boolean;
}

const SelectFarm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedFarm, setSelectedFarm] = useState<string | null>(null);

  const { data: memberships } = useQuery({
    queryKey: ["my-tenants"],
    queryFn: myTenants,
  });

  // Map memberships to simple farms list for UI (no names available yet)
  const userFarms: Farm[] = (memberships ?? []).map((m) => ({
    id: m.tenant_id,
    name: "Finca Dos Hermanos",
    location: t('auth.farmLocationPlaceholder'),
    role: m.role.toLowerCase(),
    animalsCount: 0,
    lastAccess: new Date().toISOString(),
    isActive: true,
  }));

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "vet":
        return "secondary";
      case "worker":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return t('auth.admin');
      case "vet":
        return t('auth.vet');
      case "worker":
        return t('auth.worker');
      default:
        return role;
    }
  };

  const handleSelectFarm = (farmId: string) => {
    setSelectedFarm(farmId);
    setTenantId(farmId);

    // Redirigir al dashboard después de un breve delay
    setTimeout(() => {
      const must = localStorage.getItem('lf_must_change_password') === 'true';
      navigate(must ? "/force-change-password" : "/dashboard");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {t('auth.selectFarmTitle')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('auth.selectFarmSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userFarms.map((farm) => (
            <Card
              key={farm.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                selectedFarm === farm.id
                  ? "border-primary shadow-lg"
                  : "border-border hover:border-primary/50"
              } ${!farm.isActive ? "opacity-60" : ""}`}
              onClick={() => farm.isActive && handleSelectFarm(farm.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{farm.name}</CardTitle>
                  </div>
                  {selectedFarm === farm.id && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {farm.location}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={getRoleBadgeVariant(farm.role)}>
                    {getRoleDisplayName(farm.role)}
                  </Badge>
                  {!farm.isActive && (
                    <Badge variant="destructive">{t('auth.inactive')}</Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {t('auth.animals')}:
                    </span>
                    <span className="font-medium">{farm.animalsCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {t('auth.lastAccess')}:
                    </span>
                    <span className="font-medium">
                      {new Date(farm.lastAccess).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {farm.isActive && (
                  <Button
                    className="w-full"
                    variant={selectedFarm === farm.id ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectFarm(farm.id);
                    }}
                  >
                    {selectedFarm === farm.id ? t('auth.accessing') : t('auth.select')}
                  </Button>
                )}

                {!farm.isActive && (
                  <p className="text-xs text-muted-foreground text-center">
                    {t('auth.temporarilyInactive')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={async () => { await performLogout(); navigate("/login", { replace: true }); }}>
            {t('auth.logout')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectFarm;
