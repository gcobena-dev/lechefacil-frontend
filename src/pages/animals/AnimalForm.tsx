import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, X, Sparkles, Check, Info, FileText, GitBranch } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createAnimal, getAnimal, updateAnimal, getAnimalStatuses, uploadMultiplePhotos, listAnimalPhotos, deleteAnimalPhoto, updateAnimalPhoto, getNextTag, listAnimals } from "@/services/animals";
import { getAnimalCertificate, createCertificate, updateCertificate } from "@/services/animalCertificates";
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
  // Genealogy
  sex: string;
  damId: string;
  sireType: "internal" | "external";
  sireId: string;
  externalSireCode: string;
  externalSireRegistry: string;
  // Certificate
  registryNumber: string;
  bolusId: string;
  tattooLeft: string;
  tattooRight: string;
  issueDate: string;
  breeder: string;
  owner: string;
  farm: string;
  certificateName: string;
  associationCode: string;
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
    notes: "",
    // Genealogy
    sex: "",
    damId: "",
    sireType: "external",
    sireId: "",
    externalSireCode: "",
    externalSireRegistry: "",
    // Certificate
    registryNumber: "",
    bolusId: "",
    tattooLeft: "",
    tattooRight: "",
    issueDate: "",
    breeder: "",
    owner: "",
    farm: "",
    certificateName: "",
    associationCode: "",
    notes: "",
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

  // Fetch all animals for dam/sire selection (max 100 per backend limit)
  const { data: animalsListData } = useQuery({
    queryKey: ["animals-list"],
    queryFn: () => listAnimals({ limit: 100 }),
  });

  // Fetch existing certificate
  const { data: existingCertificate } = useQuery({
    queryKey: ["animal-certificate", id],
    queryFn: () => getAnimalCertificate(id as string),
    enabled: isEditing,
  });

  const femaleAnimals = animalsListData?.items?.filter((a: any) => a.sex === 'FEMALE') || [];
  const maleAnimals = animalsListData?.items?.filter((a: any) => a.sex === 'MALE') || [];

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
        // Genealogy
        sex: (existing as any).sex ?? "",
        damId: (existing as any).dam_id ?? "",
        sireType: (existing as any).sire_id ? "internal" : "external",
        sireId: (existing as any).sire_id ?? "",
        externalSireCode: (existing as any).external_sire_code ?? "",
        externalSireRegistry: (existing as any).external_sire_registry ?? "",
        // Certificate - will be loaded separately
        registryNumber: "",
        bolusId: "",
        tattooLeft: "",
        tattooRight: "",
        issueDate: "",
        breeder: "",
        owner: "",
        farm: "",
      });
    }
  }, [existing]);

  useEffect(() => {
    if (existingCertificate) {
      setFormData(prev => ({
        ...prev,
        registryNumber: existingCertificate.registry_number ?? "",
        bolusId: existingCertificate.bolus_id ?? "",
        tattooLeft: existingCertificate.tattoo_left ?? "",
        tattooRight: existingCertificate.tattoo_right ?? "",
        issueDate: existingCertificate.issue_date ? String(existingCertificate.issue_date).slice(0, 10) : "",
        breeder: existingCertificate.breeder ?? "",
        owner: existingCertificate.owner ?? "",
        farm: existingCertificate.farm ?? "",
        certificateName: existingCertificate.certificate_name ?? "",
        associationCode: existingCertificate.association_code ?? "",
        notes: existingCertificate.notes ?? "",
      }));
    }
  }, [existingCertificate]);

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
          // Genealogy
          sex: formData.sex || null,
          dam_id: formData.damId || null,
          sire_id: formData.sireType === "internal" ? (formData.sireId || null) : null,
          external_sire_code: formData.sireType === "external" ? (formData.externalSireCode || null) : null,
          external_sire_registry: formData.sireType === "external" ? (formData.externalSireRegistry || null) : null,
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
          // Genealogy
          sex: formData.sex || null,
          dam_id: formData.damId || null,
          sire_id: formData.sireType === "internal" ? (formData.sireId || null) : null,
          external_sire_code: formData.sireType === "external" ? (formData.externalSireCode || null) : null,
          external_sire_registry: formData.sireType === "external" ? (formData.externalSireRegistry || null) : null,
        };
        const created = await doCreate(body);
        animalId = created.id;
      }

      // Handle certificate (save separately if any field has data)
      if (animalId) {
        const hasCertificateData = formData.registryNumber || formData.bolusId || formData.tattooLeft || formData.tattooRight || formData.breeder || formData.owner || formData.farm || formData.issueDate || formData.certificateName || formData.associationCode || formData.notes;

        if (hasCertificateData) {
          const certificatePayload = {
            registry_number: formData.registryNumber || undefined,
            bolus_id: formData.bolusId || undefined,
            tattoo_left: formData.tattooLeft || undefined,
            tattoo_right: formData.tattooRight || undefined,
            issue_date: formData.issueDate || undefined,
            breeder: formData.breeder || undefined,
            owner: formData.owner || undefined,
            farm: formData.farm || undefined,
            certificate_name: formData.certificateName || undefined,
            association_code: formData.associationCode || undefined,
            notes: formData.notes || undefined,
          };

          try {
            if (existingCertificate) {
              await updateCertificate(animalId, {
                version: existingCertificate.version,
                ...certificatePayload,
              });
            } else {
              await createCertificate(animalId, certificatePayload);
            }
          } catch (certError) {
            console.error("Error saving certificate:", certError);
            // Don't fail the whole operation if certificate save fails
          }
        }
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

  const handleSetPrimaryPhoto = async (photoId: string) => {
    if (!id) return;

    try {
      // Update the clicked photo to be primary
      await updateAnimalPhoto(id, photoId, { is_primary: true });

      // Update local state
      setExistingPhotos(prev => prev.map(p => ({
        ...p,
        is_primary: p.id === photoId
      })));

      toast({
        title: t('animals.primaryPhotoUpdated'),
        description: t('animals.primaryPhotoUpdatedDesc'),
      });
    } catch (err) {
      console.error(err);
      toast({
        title: t('common.error'),
        description: t('animals.couldNotUpdatePrimary'),
        variant: "destructive"
      });
    }
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
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="basic" className="flex items-center gap-1.5">
                  <Info className="h-4 w-4" />
                  <span>{t('animals.basicInfo')}</span>
                </TabsTrigger>
                <TabsTrigger value="genealogy" className="flex items-center gap-1.5">
                  <GitBranch className="h-4 w-4" />
                  <span>{t('animals.genealogy')}</span>
                </TabsTrigger>
                <TabsTrigger value="certificate" className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  <span>{t('animals.certificate')}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
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

            <div className="p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">{t('animals.catalogsConfig')}</p>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <p>
                      {t('animals.catalogsConfigDescPrefix')}{' '}
                      <Link
                        to="/settings?tab=catalogs"
                        className="underline hover:text-blue-900 dark:hover:text-blue-100 font-medium"
                      >
                        {t('animals.catalogsConfigLink')}
                      </Link>
                    </p>
                  </div>
                </div>
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
                        <button
                          onClick={() => handleSetPrimaryPhoto(photo.id)}
                          className={`absolute top-2 left-2 rounded-full p-1.5 shadow-lg transition-all ${
                            photo.is_primary
                              ? 'bg-white dark:bg-gray-200 text-black scale-110'
                              : 'bg-gray-300/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-gray-400/70 dark:hover:bg-gray-600/70 hover:scale-105'
                          }`}
                          type="button"
                          title={photo.is_primary ? t('animals.primaryPhoto') : t('animals.setPrimary')}
                        >
                          <Check className="h-4 w-4" />
                        </button>
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
              </TabsContent>

              <TabsContent value="genealogy" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('animals.gender')}</Label>
                    <RadioGroup
                      value={formData.sex}
                      onValueChange={(value) => handleInputChange("sex", value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="FEMALE" id="female" />
                        <Label htmlFor="female" className="font-normal cursor-pointer">{t('animals.female')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="MALE" id="male" />
                        <Label htmlFor="male" className="font-normal cursor-pointer">{t('animals.male')}</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dam">{t('animals.dam')}</Label>
                    <Select value={formData.damId || "none"} onValueChange={(value) => handleInputChange("damId", value === "none" ? "" : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('animals.selectDam')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectPrimitive.Item value="none" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
                          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                            <SelectPrimitive.ItemIndicator>
                              <Check className="h-4 w-4" />
                            </SelectPrimitive.ItemIndicator>
                          </span>
                          <SelectPrimitive.ItemText>{t('common.none')}</SelectPrimitive.ItemText>
                        </SelectPrimitive.Item>
                        {femaleAnimals.map((animal: any) => (
                          <SelectPrimitive.Item
                            key={animal.id}
                            value={animal.id}
                            className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
                          >
                            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                              <SelectPrimitive.ItemIndicator>
                                <Check className="h-4 w-4" />
                              </SelectPrimitive.ItemIndicator>
                            </span>
                            <SelectPrimitive.ItemText>{animal.tag} - {animal.name || t('common.none')}</SelectPrimitive.ItemText>
                          </SelectPrimitive.Item>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('animals.sire')}</Label>
                    <RadioGroup
                      value={formData.sireType}
                      onValueChange={(value: any) => handleInputChange("sireType", value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="internal" id="sire-internal" />
                        <Label htmlFor="sire-internal" className="font-normal cursor-pointer">{t('animals.sireInternal')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="external" id="sire-external" />
                        <Label htmlFor="sire-external" className="font-normal cursor-pointer">{t('animals.sireExternal')}</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.sireType === "internal" ? (
                    <div className="space-y-2">
                      <Label htmlFor="sire">{t('animals.selectSire')}</Label>
                      <Select value={formData.sireId || "none"} onValueChange={(value) => handleInputChange("sireId", value === "none" ? "" : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('animals.selectSire')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectPrimitive.Item value="none" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
                            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                              <SelectPrimitive.ItemIndicator>
                                <Check className="h-4 w-4" />
                              </SelectPrimitive.ItemIndicator>
                            </span>
                            <SelectPrimitive.ItemText>Ninguno</SelectPrimitive.ItemText>
                          </SelectPrimitive.Item>
                          {maleAnimals.map((animal: any) => (
                            <SelectPrimitive.Item
                              key={animal.id}
                              value={animal.id}
                              className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
                            >
                              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                <SelectPrimitive.ItemIndicator>
                                  <Check className="h-4 w-4" />
                                </SelectPrimitive.ItemIndicator>
                              </span>
                              <SelectPrimitive.ItemText>{animal.tag} - {animal.name || 'Sin nombre'}</SelectPrimitive.ItemText>
                            </SelectPrimitive.Item>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="externalSireCode">Código del Toro</Label>
                        <Input
                          id="externalSireCode"
                          value={formData.externalSireCode}
                          onChange={(e) => handleInputChange("externalSireCode", e.target.value)}
                          placeholder="Ej: USA123456"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="externalSireRegistry">{t('animals.registry')}</Label>
                        <Input
                          id="externalSireRegistry"
                          value={formData.externalSireRegistry}
                          onChange={(e) => handleInputChange("externalSireRegistry", e.target.value)}
                          placeholder={t('animals.registryExample')}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="certificate" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="certificateName">Nombre del Certificado</Label>
                    <Input
                      id="certificateName"
                      value={formData.certificateName}
                      onChange={(e) => handleInputChange("certificateName", e.target.value)}
                      placeholder="Ej: Certificado de Registro Holstein"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="associationCode">Código de Asociación</Label>
                    <Input
                      id="associationCode"
                      value={formData.associationCode}
                      onChange={(e) => handleInputChange("associationCode", e.target.value)}
                      placeholder="Ej: ASOHOLSTEIN-EC-2024-001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registryNumber">{t('animals.registryNumber')}</Label>
                    <Input
                      id="registryNumber"
                      value={formData.registryNumber}
                      onChange={(e) => handleInputChange("registryNumber", e.target.value)}
                      placeholder={t('animals.registryNumberExample')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bolusId">{t('animals.bolusId')}</Label>
                    <Input
                      id="bolusId"
                      value={formData.bolusId}
                      onChange={(e) => handleInputChange("bolusId", e.target.value)}
                      placeholder={t('animals.bolusIdExample')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tattooLeft">{t('animals.tattooLeft')}</Label>
                    <Input
                      id="tattooLeft"
                      value={formData.tattooLeft}
                      onChange={(e) => handleInputChange("tattooLeft", e.target.value)}
                      placeholder={t('animals.tattooExample')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tattooRight">{t('animals.tattooRight')}</Label>
                    <Input
                      id="tattooRight"
                      value={formData.tattooRight}
                      onChange={(e) => handleInputChange("tattooRight", e.target.value)}
                      placeholder={t('animals.tattooExample')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issueDate">{t('animals.issueDate')}</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => handleInputChange("issueDate", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="breeder">{t('animals.breeder')}</Label>
                    <Input
                      id="breeder"
                      value={formData.breeder}
                      onChange={(e) => handleInputChange("breeder", e.target.value)}
                      placeholder={t('animals.breederNamePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner">{t('animals.owner')}</Label>
                    <Input
                      id="owner"
                      value={formData.owner}
                      onChange={(e) => handleInputChange("owner", e.target.value)}
                      placeholder={t('animals.ownerNamePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="farm">{t('animals.farm')}</Label>
                    <Input
                      id="farm"
                      value={formData.farm}
                      onChange={(e) => handleInputChange("farm", e.target.value)}
                      placeholder={t('animals.farmNamePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="Notas adicionales sobre el certificado..."
                      rows={3}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

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
