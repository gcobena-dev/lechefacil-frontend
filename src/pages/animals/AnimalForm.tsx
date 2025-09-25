import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createAnimal, getAnimal, updateAnimal } from "@/services/animals";
import { useTranslation } from "@/hooks/useTranslation";

interface AnimalFormData {
  tag: string;
  name: string;
  breed: string;
  birthDate: string;
  lot: string;
  status: 'active' | 'sold' | 'culled';
  notes: string;
}

export default function AnimalForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<AnimalFormData>({
    tag: "",
    name: "",
    breed: "",
    birthDate: "",
    lot: "",
    status: "active",
    notes: ""
  });

  const { data: existing, isLoading: loadingAnimal } = useQuery({
    queryKey: ["animal", id],
    queryFn: () => getAnimal(id as string),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existing) {
      setFormData({
        tag: existing.tag ?? "",
        name: existing.name ?? "",
        breed: existing.breed ?? "",
        birthDate: existing.birth_date ? String(existing.birth_date).slice(0, 10) : "",
        lot: existing.lot ?? "",
        status: (existing.status as any) ?? "active",
        notes: "",
      });
    }
  }, [existing]);

  const { mutateAsync: doCreate, isPending: creating } = useMutation({
    mutationFn: (payload: any) => createAnimal(payload),
  });
  const { mutateAsync: doUpdate, isPending: updating } = useMutation({
    mutationFn: (payload: { id: string; body: any }) => updateAnimal(payload.id, payload.body),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && existing) {
        const body = {
          version: existing.version,
          name: formData.name || null,
          breed: formData.breed || null,
          birth_date: formData.birthDate || null,
          lot: formData.lot || null,
          status: formData.status || null,
        };
        await doUpdate({ id: id as string, body });
      } else {
        const body = {
          tag: formData.tag,
          name: formData.name || null,
          breed: formData.breed || null,
          birth_date: formData.birthDate || null,
          lot: formData.lot || null,
          status: formData.status || undefined,
        };
        await doCreate(body);
      }
      toast({
        title: isEditing ? t('animals.animalUpdatedMsg') : t('animals.animalCreatedMsg'),
        description: `${formData.tag} ${t('animals.savedSuccessfully')}`,
      });
      navigate("/animals");
    } catch (err: any) {
      console.error(err);
      toast({ title: t('common.error'), description: t('animals.couldNotSave'), variant: "destructive" });
    }
  };

  const handleInputChange = (field: keyof AnimalFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/animals")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? t('animals.editAnimal') : t('animals.newAnimal')}
        </h1>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{t('animals.animalInformation')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tag">{t('animals.tagNumber')} *</Label>
                <Input
                  id="tag"
                  value={formData.tag}
                  onChange={(e) => handleInputChange("tag", e.target.value)}
                  placeholder={t('animals.tagExample')}
                  required
                  disabled={isEditing}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">{t('common.name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder={t('animals.animalName')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breed">{t('animals.breed')}</Label>
                <Input
                  id="breed"
                  value={formData.breed}
                  onChange={(e) => handleInputChange("breed", e.target.value)}
                  placeholder={t('animals.breedExample')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birthDate">{t('animals.birthDate')}</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange("birthDate", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lot">{t('animals.lot')}</Label>
                <Input
                  id="lot"
                  value={formData.lot}
                  onChange={(e) => handleInputChange("lot", e.target.value)}
                  placeholder={t('animals.lotExample')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">{t('animals.status')}</Label>
                <Select value={formData.status} onValueChange={(value: any) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('animals.inProduction')}</SelectItem>
                    <SelectItem value="sold">{t('animals.sold')}</SelectItem>
                    <SelectItem value="culled">{t('animals.culled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('animals.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder={t('animals.additionalNotes')}
                rows={3}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button type="submit" className="flex-1" disabled={creating || updating || (isEditing && loadingAnimal)}>
                {isEditing ? (updating ? t('animals.updating') : t('animals.updateAnimal')) : (creating ? t('animals.creating') : t('animals.createAnimal'))}
              </Button>
              <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => navigate("/animals")}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
