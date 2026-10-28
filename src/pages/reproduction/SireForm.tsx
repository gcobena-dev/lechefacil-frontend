import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useSire, useCreateSire, useUpdateSire, useHerdBullCandidates } from "@/hooks/useReproduction";
import { useQuery } from "@tanstack/react-query";
import { getAnimal } from "@/services/animals";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function SireForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const isEditing = !!id;

  const { data: existingSire } = useSire(id);
  const createMutation = useCreateSire();
  const updateMutation = useUpdateSire();

  const [name, setName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [registryCode, setRegistryCode] = useState("");
  const [registryName, setRegistryName] = useState("");
  const [geneticNotes, setGeneticNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [animalId, setAnimalId] = useState("");

  // Herd males not in the catalog yet, plus the one this sire already points at
  const { data: candidates = [] } = useHerdBullCandidates();
  const { data: linkedAnimal } = useQuery({
    queryKey: ["animal", existingSire?.animal_id],
    queryFn: () => getAnimal(existingSire!.animal_id as string),
    enabled: !!existingSire?.animal_id,
  });
  const herdOptions = [
    ...(linkedAnimal ? [{ id: linkedAnimal.id, tag: linkedAnimal.tag, name: linkedAnimal.name }] : []),
    ...candidates,
  ];

  const handleAnimalChange = (value: string) => {
    const id = value === "none" ? "" : value;
    setAnimalId(id);
    // A new sire picked from the herd takes the animal's name and tag
    const animal = herdOptions.find((a) => a.id === id);
    if (animal && !isEditing) {
      if (!name.trim()) setName(animal.name || animal.tag);
      if (!shortCode.trim()) setShortCode(animal.tag);
    }
  };

  useEffect(() => {
    if (existingSire) {
      setName(existingSire.name);
      setShortCode(existingSire.short_code || "");
      setRegistryCode(existingSire.registry_code || "");
      setRegistryName(existingSire.registry_name || "");
      setGeneticNotes(existingSire.genetic_notes || "");
      setIsActive(existingSire.is_active);
      setAnimalId(existingSire.animal_id || "");
    }
  }, [existingSire]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync({
          id,
          payload: {
            name: name.trim(),
            short_code: shortCode.trim() || null,
            registry_code: registryCode.trim() || null,
            registry_name: registryName.trim() || null,
            genetic_notes: geneticNotes.trim() || null,
            is_active: isActive,
            animal_id: animalId || null,
          },
        });
        toast({ title: t("reproduction.sireUpdated") });
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          short_code: shortCode.trim() || null,
          registry_code: registryCode.trim() || null,
          registry_name: registryName.trim() || null,
          genetic_notes: geneticNotes.trim() || null,
          animal_id: animalId || null,
        });
        toast({ title: t("reproduction.sireCreated") });
      }
      navigate("/reproduction/sires");
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">
          {isEditing ? t("reproduction.editSire") : t("reproduction.newSire")}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isEditing ? t("reproduction.editSire") : t("reproduction.newSire")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("reproduction.herdAnimal")}</Label>
            <Select value={animalId || "none"} onValueChange={handleAnimalChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("reproduction.noHerdAnimal")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("reproduction.noHerdAnimal")}</SelectItem>
                {herdOptions.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    #{a.tag}{a.name ? ` · ${a.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t("reproduction.herdAnimalHint")}</p>
          </div>

          <div className="space-y-2">
            <Label>{t("reproduction.sireName")} *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("reproduction.sireNamePlaceholder")}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("reproduction.shortCode")}</Label>
              <Input
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                placeholder={t("reproduction.shortCodePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("reproduction.registryCode")}</Label>
              <Input
                value={registryCode}
                onChange={(e) => setRegistryCode(e.target.value)}
                placeholder={t("reproduction.registryCodePlaceholder")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("reproduction.registryName")}</Label>
            <Input
              value={registryName}
              onChange={(e) => setRegistryName(e.target.value)}
              placeholder={t("reproduction.registryNamePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("reproduction.geneticNotes")}</Label>
            <Textarea
              value={geneticNotes}
              onChange={(e) => setGeneticNotes(e.target.value)}
              placeholder={t("reproduction.geneticNotesPlaceholder")}
              rows={3}
            />
          </div>

          {isEditing && (
            <div className="flex items-center justify-between">
              <Label>{t("reproduction.active")}</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
              {t("reproduction.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || isPending}
              className="flex-1"
            >
              {isPending ? t("reproduction.saving") : t("reproduction.save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
