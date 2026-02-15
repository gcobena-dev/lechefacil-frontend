import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CalendarIcon, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useRegisterAnimalEvent } from "@/hooks/useAnimalEvents";
import type { EventType } from "@/services/animalEvents";
import { getLocalDateTimeInputValue } from "@/utils/dateUtils";
import { useTranslation } from "@/hooks/useTranslation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getNextTag } from "@/services/animals";
import { getBreeds } from "@/services/breeds";
import { useToast } from "@/hooks/use-toast";
import * as SelectPrimitive from "@radix-ui/react-select";

interface RegisterEventDialogProps {
  animalId: string;
  isOpen: boolean;
  onClose: () => void;
  animalSex?: string;
  animalBreed?: string;
  animalBreedId?: string;
  animalBreedVariant?: string;
}

const EVENT_TYPES: { value: EventType; labelKey: string; descriptionKey: string }[] = [
  { value: "CALVING", labelKey: "animals.event.calving", descriptionKey: "animals.event.calvingDesc" },
  { value: "DRY_OFF", labelKey: "animals.event.dryOff", descriptionKey: "animals.event.dryOffDesc" },
  { value: "BIRTH", labelKey: "animals.event.birth", descriptionKey: "animals.event.birthDesc" },
  { value: "ABORTION", labelKey: "animals.event.abortion", descriptionKey: "animals.event.abortionDesc" },
  { value: "SALE", labelKey: "animals.event.sale", descriptionKey: "animals.event.saleDesc" },
  { value: "DEATH", labelKey: "animals.event.death", descriptionKey: "animals.event.deathDesc" },
  { value: "CULL", labelKey: "animals.event.cull", descriptionKey: "animals.event.cullDesc" },
  { value: "TRANSFER", labelKey: "animals.event.transfer", descriptionKey: "animals.event.transferDesc" },
];

export default function RegisterEventDialog({
  animalId,
  isOpen,
  onClose,
  animalSex,
  animalBreed,
  animalBreedId,
  animalBreedVariant,
}: RegisterEventDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<EventType | null>(null);
  const { mutate: registerEvent, isPending } = useRegisterAnimalEvent(animalId);

  // Fetch breeds
  const { data: breeds = [] } = useQuery({
    queryKey: ["breeds", { active: true }],
    queryFn: () => getBreeds({ active: true }),
  });

  // Autogenerate tag mutation
  const { mutateAsync: generateTag, isPending: generatingTag } = useMutation({
    mutationFn: getNextTag,
    onSuccess: (data) => {
      form.setValue("calf_tag", data.next_tag);
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

  const form = useForm({
    defaultValues: {
      type: "",
      occurred_at: getLocalDateTimeInputValue(),
      // Common fields
      notes: "",
      // Birth fields
      calf_tag: "",
      calf_sex: "",
      calf_name: "",
      birth_weight: "",
      breed: animalBreed || "",
      breed_id: animalBreedId || "",
      breed_variant: animalBreedVariant || "",
      // Disposition fields
      reason: "",
      buyer: "",
      price: "",
      cause: "",
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const data: Record<string, any> = {};

    // Build data object based on event type
    switch (selectedType) {
      case "BIRTH":
        data.calf_tag = values.calf_tag;
        data.calf_sex = values.calf_sex;
        if (values.calf_name) data.calf_name = values.calf_name;
        if (values.birth_weight) data.birth_weight = parseFloat(values.birth_weight);
        if (values.breed) data.breed = values.breed;
        if (values.breed_id) data.breed_id = values.breed_id;
        if (values.breed_variant) data.breed_variant = values.breed_variant;
        break;

      case "SALE":
        data.reason = values.reason || t('animals.event.sale');
        if (values.buyer) data.buyer = values.buyer;
        if (values.price) data.price = parseFloat(values.price);
        break;

      case "DEATH":
        if (values.cause) data.cause = values.cause;
        data.reason = values.reason || values.cause || t('animals.event.death');
        break;

      case "CULL":
        data.reason = values.reason || t('animals.event.cull');
        break;
    }

    if (values.notes) data.notes = values.notes;

    registerEvent(
      {
        type: values.type as EventType,
        occurred_at: values.occurred_at,
        data: Object.keys(data).length > 0 ? data : undefined,
      },
      {
        onSuccess: () => {
          form.reset();
          setSelectedType(null);
          onClose();
        },
      }
    );
  });

  const handleTypeChange = (value: EventType) => {
    setSelectedType(value);
    form.setValue("type", value);
  };

  const renderDynamicFields = () => {
    if (!selectedType) return null;

    switch (selectedType) {
      case "BIRTH":
        return (
          <>
            <FormField
              control={form.control}
              name="calf_tag"
              rules={{ required: t('animals.calfTagRequired') as unknown as string }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('animals.calfTag')} *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} placeholder={t('animals.tagExample')} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => generateTag()}
                      disabled={generatingTag}
                      title={t('animals.autoGenerate')}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="calf_sex"
              rules={{ required: t('animals.genderRequired') as unknown as string }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('animals.gender')} *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('animals.selectGender')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FEMALE">{t('animals.female')}</SelectItem>
                      <SelectItem value="MALE">{t('animals.male')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="calf_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('animals.calfName')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('common.optional')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birth_weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('animals.birthWeightKg')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.1" placeholder={t('animals.birthWeightExample')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="breed_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('animals.breed')} *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const selectedBreed = breeds.find((b: any) => b.id === value);
                      if (selectedBreed) {
                        form.setValue("breed", selectedBreed.name);
                        // Reset variant if breed is not Girolando
                        if (selectedBreed.name !== "Girolando") {
                          form.setValue("breed_variant", "");
                        }
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('animals.selectBreed')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {breeds.map((breed: any) => (
                        <SelectPrimitive.Item key={breed.id} value={breed.id} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                            <SelectPrimitive.ItemIndicator>
                              <span className="h-2 w-2 rounded-full bg-primary" />
                            </SelectPrimitive.ItemIndicator>
                          </span>
                          <SelectPrimitive.ItemText>{breed.name}</SelectPrimitive.ItemText>
                        </SelectPrimitive.Item>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("breed") === "Girolando" && (
              <FormField
                control={form.control}
                name="breed_variant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('animals.variant')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('animals.selectVariant')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="5/8">5/8</SelectItem>
                        <SelectItem value="3/4">3/4</SelectItem>
                        <SelectItem value="7/8">7/8</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        );

      case "SALE":
        return (
          <>
            <FormField
              control={form.control}
              name="buyer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('animals.buyer')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('animals.buyerNamePlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('animals.price')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" placeholder={t('animals.priceExample')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('animals.reason')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('animals.saleReasonPlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );

      case "DEATH":
        return (
          <>
            <FormField
              control={form.control}
              name="cause"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('animals.cause')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('animals.deathCausePlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );

      case "CULL":
        return (
          <>
            <FormField
              control={form.control}
              name="reason"
              rules={{ required: t('animals.reasonRequired') as unknown as string }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('animals.reason')} *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('animals.cullReasonPlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );

      default:
        return null;
    }
  };

  // Filter events based on animal sex
  const availableEvents = EVENT_TYPES.filter((event) => {
    if (animalSex === "MALE" && (event.value === "CALVING" || event.value === "DRY_OFF")) {
      return false;
    }
    return true;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Evento</DialogTitle>
          <DialogDescription>
            Registra un evento en el historial del animal.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              rules={{ required: "Tipo de evento es requerido" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Evento *</FormLabel>
                  <Select onValueChange={handleTypeChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('animals.selectEventType')}>
                          {field.value && (() => {
                            const ev = availableEvents.find(e => e.value === field.value);
                            return ev ? t(ev.labelKey) : null;
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableEvents.map((event) => (
                        <SelectItem key={event.value} value={event.value}>
                          <div className="flex flex-col gap-0.5">
                            <div className="font-medium">{t(event.labelKey)}</div>
                            <div className="text-xs text-muted-foreground">
                              {t(event.descriptionKey)}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="occurred_at"
              rules={{ required: t('animals.dateRequired') as unknown as string }}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('animals.dateTime')} *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            new Date(field.value).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          ) : (
                            <span>{t('animals.selectDateTime')}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            // Preserve existing time or use current time
                            const existingDate = field.value ? new Date(field.value) : new Date();
                            date.setHours(existingDate.getHours());
                            date.setMinutes(existingDate.getMinutes());
                            field.onChange(getLocalDateTimeInputValue(date));
                          }
                        }}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                      <div className="p-3 border-t">
                        <FormLabel className="text-xs">{t('common.time')}</FormLabel>
                        <Input
                          type="time"
                          value={
                            field.value
                              ? (() => {
                                  const d = new Date(field.value);
                                  const h = String(d.getHours()).padStart(2, "0");
                                  const m = String(d.getMinutes()).padStart(2, "0");
                                  return `${h}:${m}`;
                                })()
                              : (() => {
                                  const d = new Date();
                                  const h = String(d.getHours()).padStart(2, "0");
                                  const m = String(d.getMinutes()).padStart(2, "0");
                                  return `${h}:${m}`;
                                })()
                          }
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(":");
                            const date = field.value ? new Date(field.value) : new Date();
                            date.setHours(parseInt(hours));
                            date.setMinutes(parseInt(minutes));
                            field.onChange(getLocalDateTimeInputValue(date));
                          }}
                          className="mt-1"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {renderDynamicFields()}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('animals.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('animals.notesPlaceholder')}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t('animals.registering') : t('animals.registerEvent')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
