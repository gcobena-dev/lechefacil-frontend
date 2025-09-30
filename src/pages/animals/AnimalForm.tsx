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
import { ArrowLeft, X, Sparkles } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createAnimal, getAnimal, updateAnimal, getAnimalStatuses, uploadMultiplePhotos, listAnimalPhotos, deleteAnimalPhoto, getNextTag } from "@/services/animals";
import { getBreeds } from "@/services/breeds";
import { getLots } from "@/services/lots";
import { useTranslation } from "@/hooks/useTranslation";
import { AnimalPhotoUpload, PhotoFile } from "@/components/animals/AnimalPhotoUpload";

interface AnimalFormData {
  tag: string;
  name: string;
  breed: string;
  breedId: string;
  breedVariant: string;
  birthDate: string;
  lot: string;
  lotId: string;
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
    breedId: "",
    breedVariant: "",
    birthDate: "",
    lot: "",
    lotId: "",
    statusId: "",
    notes: ""
  });

  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<any[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const { data: existing, isLoading: loadingAnimal } = useQuery({
    queryKey: ["animal", id],
    queryFn: () => getAnimal(id as string),
    enabled: isEditing,
  });

  const { data: animalStatuses = [] } = useQuery({
    queryKey: ["animal-statuses"],
    queryFn: () => getAnimalStatuses('es'),
  });

  const { data: breeds = [] } = useQuery({
    queryKey: ["breeds", { active: true }],
    queryFn: () => getBreeds({ active: true }),
  });
  const { data: lots = [] } = useQuery({
    queryKey: ["lots", { active: true }],
    queryFn: () => getLots({ active: true }),
  });

  const { data: existingPhotosData } = useQuery({
    queryKey: ["animal-photos", id],
    queryFn: () => listAnimalPhotos(id as string),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existing) {
      setFormData({
        tag: existing.tag ?? "",
        name: existing.name ?? "",
        breed: existing.breed ?? "",
        breedId: (existing as any).breed_id ?? "",
        breedVariant: (existing as any).breed_variant ?? "",
        birthDate: existing.birth_date ? String(existing.birth_date).slice(0, 10) : "",
        lot: existing.lot ?? "",
        lotId: (existing as any).lot_id ?? "",
        statusId: (existing as any).status_id ?? "",
        notes: "",
      });
    }
  }, [existing]);

  useEffect(() => {
    if (existingPhotosData) {
      setExistingPhotos(existingPhotosData);
    }
  }, [existingPhotosData]);

  // Determine if selected breed is Girolando (by code or name); fallback to legacy name
  const isGirolando = useMemo(() => {
    const b = (breeds as any[]).find((x: any) => x.id === formData.breedId);
    if (!b) return (formData.breed ?? '').toLowerCase() === 'girolando';
    const code = (b?.code ?? '').toString().toUpperCase();
    const name = (b?.name ?? '').toString().toLowerCase();
    return code === 'GIROLANDO' || name === 'girolando';
  }, [breeds, formData.breedId, formData.breed]);

  // Clear variant when not Girolando
  useEffect(() => {
    if (!isGirolando && formData.breedVariant) {
      setFormData(prev => ({ ...prev, breedVariant: '' }));
    }
  }, [isGirolando]);

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
      let animalId = id;

      if (isEditing && existing) {
        const body = {
          version: existing.version,
          name: formData.name || null,
          // send IDs when provided; backend resolves legacy names
          breed_id: formData.breedId || null,
          birth_date: formData.birthDate || null,
          lot_id: formData.lotId || null,
          status_id: formData.statusId || null,
        };
        await doUpdate({ id: id as string, body });
      } else {
        const body = {
          tag: formData.tag,
          name: formData.name || null,
          breed_id: formData.breedId || null,
          birth_date: formData.birthDate || null,
          lot_id: formData.lotId || null,
          status_id: formData.statusId || undefined,
        };
        const created = await doCreate(body);
        animalId = created.id;
      }

      // Handle photos
      if (animalId) {
        setUploadingPhotos(true);

        // Delete marked photos
        for (const photoId of photosToDelete) {
          await deleteAnimalPhoto(animalId, photoId);
        }

        // Upload new photos
        if (photos.length > 0) {
          const files = photos.map(p => p.file);
          await uploadMultiplePhotos(animalId, files);
        }

        setUploadingPhotos(false);
      }

      toast({
        title: isEditing ? t('animals.animalUpdatedMsg') : t('animals.animalCreatedMsg'),
        description: `${formData.tag} ${t('animals.savedSuccessfully')}`,
      });
      navigate("/animals");
    } catch (err: any) {
      console.error(err);
      setUploadingPhotos(false);
      toast({ title: t('common.error'), description: t('animals.couldNotSave'), variant: "destructive" });
    }
  };

  const handleDeleteExistingPhoto = (photoId: string) => {
    setPhotosToDelete(prev => [...prev, photoId]);
    setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleInputChange = (field: keyof AnimalFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const { mutateAsync: generateTag, isPending: generatingTag } = useMutation({
    mutationFn: getNextTag,
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, tag: data.next_tag }));
      toast({
        title: t('animals.tagGenerated'),
        description: t('animals.tagGeneratedDesc').replace('{tag}', data.next_tag),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('animals.couldNotGenerateTag'),
        variant: "destructive",
      });
    },
  });

  const handleGenerateTag = async () => {
    await generateTag();
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="tag">{t('animals.tagNumber')} *</Label>
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateTag}
                      disabled={generatingTag}
                      className="h-7 text-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {generatingTag ? t('animals.generatingTag') : t('animals.generateTag')}
                    </Button>
                  )}
                </div>
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
                <Select
                  value={formData.breedId}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, breedId: value === '__none__' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.breed || t('animals.breedExample')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectPrimitive.Item value="__none__" className="relative flex w-full cursor-default select-none items-start gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm">
                      <SelectPrimitive.ItemText>{t("animals.noBreed")}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                    {breeds.map((b: any) => (
                      <SelectPrimitive.Item key={b.id} value={b.id} className="relative flex w-full cursor-default select-none items-start gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground">
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                          <SelectPrimitive.ItemIndicator>
                            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8.5 11.086l6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          </SelectPrimitive.ItemIndicator>
                        </span>
                        <SelectPrimitive.ItemText>{b.name}</SelectPrimitive.ItemText>
                      </SelectPrimitive.Item>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">{t('animals.birthDate')}</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange("birthDate", e.target.value)}
                  onClick={(e) => {
                    // Show the date picker when clicking anywhere on the input
                    const input = e.currentTarget;
                    if (input && typeof input.showPicker === 'function') {
                      try {
                        input.showPicker();
                      } catch (error) {
                        // Fallback for browsers that don't support showPicker
                        input.focus();
                      }
                    }
                  }}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {isGirolando && (
              <div className="space-y-2">
                <Label htmlFor="breedVariant">{t("animals.breedVariant")}</Label>
                <Select
                  value={formData.breedVariant || "__none__"}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, breedVariant: value === '__none__' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("animals.selectVariant")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectPrimitive.Item value="__none__" className="relative flex w-full cursor-default select-none items-start gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm">
                      <SelectPrimitive.ItemText>{t("animals.noVariant")}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                    {['F1', '3/4', '5/8'].map(v => (
                      <SelectPrimitive.Item key={v} value={v} className="relative flex w-full cursor-default select-none items-start gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground">
                        <SelectPrimitive.ItemText>{v}</SelectPrimitive.ItemText>
                      </SelectPrimitive.Item>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lot">{t('animals.lot')}</Label>
                <Select
                  value={formData.lotId}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, lotId: value === '__none__' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.lot || t('animals.lotExample')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectPrimitive.Item value="__none__" className="relative flex w-full cursor-default select-none items-start gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm">
                      <SelectPrimitive.ItemText>{t("animals.noLot")}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                    {lots.map((l: any) => (
                      <SelectPrimitive.Item key={l.id} value={l.id} className="relative flex w-full cursor-default select-none items-start gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground">
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                          <SelectPrimitive.ItemIndicator>
                            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8.5 11.086l6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          </SelectPrimitive.ItemIndicator>
                        </span>
                        <SelectPrimitive.ItemText>{l.name}</SelectPrimitive.ItemText>
                      </SelectPrimitive.Item>
                    ))}
                  </SelectContent>
                </Select>
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

            <div className="space-y-2">
              <Label>{t('animals.animalPhotos')}</Label>
              {isEditing && existingPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  {existingPhotos.map((photo, index) => (
                    <Card key={photo.id} className="relative group overflow-hidden">
                      <div className="aspect-square relative">
                        <img
                          src={photo.url}
                          alt={photo.title || `Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {photo.is_primary && (
                          <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                            {t('animals.primaryPhoto')}
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteExistingPhoto(photo.id)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              <AnimalPhotoUpload
                photos={photos}
                onPhotosChange={setPhotos}
                maxPhotos={6 - existingPhotos.length}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button type="submit" className="flex-1" disabled={creating || updating || uploadingPhotos || (isEditing && loadingAnimal)}>
                {uploadingPhotos ? t('animals.uploadingPhotos') : isEditing ? (updating ? t('animals.updating') : t('animals.updateAnimal')) : (creating ? t('animals.creating') : t('animals.createAnimal'))}
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
