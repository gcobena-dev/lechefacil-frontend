import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createAnimal, getAnimal, updateAnimal, getAnimalStatuses } from "@/services/animals";
import { useTranslation } from "@/hooks/useTranslation";

interface AnimalFormData {
  tag: string;
  name: string;
  breed: string;
  birthDate: string;
  lot: string;
  statusId: string;
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
    statusId: "",
    notes: ""
  });

  const { data: existing, isLoading: loadingAnimal } = useQuery({
    queryKey: ["animal", id],
    queryFn: () => getAnimal(id as string),
    enabled: isEditing,
  });

  const { data: animalStatuses = [] } = useQuery({
    queryKey: ["animal-statuses"],
    queryFn: () => getAnimalStatuses('es'),
  });

  useEffect(() => {
    if (existing) {
      setFormData({
        tag: existing.tag ?? "",
        name: existing.name ?? "",
        breed: existing.breed ?? "",
        birthDate: existing.birth_date ? String(existing.birth_date).slice(0, 10) : "",
        lot: existing.lot ?? "",
        statusId: (existing as any).status_id ?? "",
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
    // Require status selection for both create and edit
    if (!formData.statusId) {
      toast({ title: t('animals.statusRequiredTitle'), description: t('animals.statusRequiredDesc'), variant: 'destructive', duration: 4000 });
      return;
    }
    try {
      if (isEditing && existing) {
        const body = {
          version: existing.version,
          name: formData.name || null,
          breed: formData.breed || null,
          birth_date: formData.birthDate || null,
          lot: formData.lot || null,
          status_id: formData.statusId || null,
        };
        await doUpdate({ id: id as string, body });
      } else {
        const body = {
          tag: formData.tag,
          name: formData.name || null,
          breed: formData.breed || null,
          birth_date: formData.birthDate || null,
          lot: formData.lot || null,
          status_id: formData.statusId || undefined,
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
                <Label htmlFor="status">{t('animals.status')} *</Label>
                <Select value={formData.statusId} onValueChange={(value: any) => handleInputChange("statusId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('animals.status')} />
                  </SelectTrigger>
                  <SelectContent>
                    {animalStatuses.map((status) => (
                      <SelectPrimitive.Item
                        key={status.id}
                        value={status.id}
                        className="relative flex w-full cursor-default select-none items-start gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground"
                      >
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                          <SelectPrimitive.ItemIndicator>
                            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8.5 11.086l6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          </SelectPrimitive.ItemIndicator>
                        </span>
                        <div className="flex flex-col">
                          <SelectPrimitive.ItemText>{status.name}</SelectPrimitive.ItemText>
                          {status.description && (
                            <div className="text-xs text-muted-foreground max-w-[260px]">
                              {status.description}
                            </div>
                          )}
                        </div>
                      </SelectPrimitive.Item>
                    ))}
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
