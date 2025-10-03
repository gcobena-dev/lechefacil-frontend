import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Milk,
  Heart,
  DollarSign,
  Skull,
  AlertTriangle,
  Users,
  Baby,
  XCircle,
  ArrowRightLeft,
  Droplets,
} from "lucide-react";
import { formatDate } from "@/utils/format";
import {
  type AnimalEvent,
  getEventTypeLabel,
  getEventTypeColor,
} from "@/services/animalEvents";
import { useTranslation } from "@/hooks/useTranslation";

interface EventTimelineCardProps {
  event: AnimalEvent;
}

const getEventIcon = (type: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    CALVING: <Milk className="h-5 w-5" />,
    DRY_OFF: <Droplets className="h-5 w-5" />,
    SALE: <DollarSign className="h-5 w-5" />,
    DEATH: <Skull className="h-5 w-5" />,
    CULL: <AlertTriangle className="h-5 w-5" />,
    SERVICE: <Heart className="h-5 w-5" />,
    EMBRYO_TRANSFER: <Users className="h-5 w-5" />,
    BIRTH: <Baby className="h-5 w-5" />,
    ABORTION: <XCircle className="h-5 w-5" />,
    TRANSFER: <ArrowRightLeft className="h-5 w-5" />,
  };
  return iconMap[type] || <AlertTriangle className="h-5 w-5" />;
};

const EventDetails = ({ event }: { event: AnimalEvent }) => {
  const { t } = useTranslation();
  if (!event.data) return null;

  const renderBirthData = () => (
    <div className="text-sm space-y-1">
      <p><strong>{t('animals.calf')}:</strong> {event.data?.calf_tag}</p>
      <p><strong>{t('animals.gender')}:</strong> {event.data?.calf_sex === 'MALE' ? t('animals.male') : t('animals.female')}</p>
      {event.data?.calf_name && <p><strong>{t('animals.name')}:</strong> {event.data.calf_name}</p>}
      {event.data?.birth_weight && <p><strong>{t('animals.weight')}:</strong> {event.data.birth_weight} kg</p>}
    </div>
  );

  const renderServiceData = () => (
    <div className="text-sm space-y-1">
      {event.data?.external_sire_code && (
        <p><strong>{t('animals.sire')}:</strong> {event.data.external_sire_code}</p>
      )}
      {event.data?.method && (
        <p><strong>{t('animals.method')}:</strong> {event.data.method}</p>
      )}
      {event.data?.technician && (
        <p><strong>{t('animals.technician')}:</strong> {event.data.technician}</p>
      )}
    </div>
  );

  const renderDispositionData = () => (
    <div className="text-sm space-y-1">
      {event.data?.reason && <p><strong>{t('animals.reason')}:</strong> {event.data.reason}</p>}
      {event.data?.buyer && <p><strong>{t('animals.buyer')}:</strong> {event.data.buyer}</p>}
      {event.data?.price && <p><strong>{t('animals.price')}:</strong> ${event.data.price}</p>}
      {event.data?.cause && <p><strong>{t('animals.cause')}:</strong> {event.data.cause}</p>}
    </div>
  );

  switch (event.type) {
    case 'BIRTH':
      return renderBirthData();
    case 'SERVICE':
    case 'EMBRYO_TRANSFER':
      return renderServiceData();
    case 'SALE':
    case 'DEATH':
    case 'CULL':
      return renderDispositionData();
    default:
      return null;
  }
};

export default function EventTimelineCard({ event }: EventTimelineCardProps) {
  const { t } = useTranslation();
  const formattedDate = formatDate(event.occurred_at);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              {getEventIcon(event.type)}
            </div>
            <div>
              <CardTitle className="text-lg">
                {t(getEventTypeLabel(event.type))}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </div>
          </div>
          <Badge className={getEventTypeColor(event.type)} variant="secondary">
            {t(getEventTypeLabel(event.type))}
          </Badge>
        </div>
      </CardHeader>

      {(event.data || event.data?.notes) && (
        <CardContent className="pt-0">
          <EventDetails event={event} />
          {event.data?.notes && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-sm text-muted-foreground">{event.data.notes}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
