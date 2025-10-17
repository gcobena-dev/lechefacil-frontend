import { Notification } from '@/services/notification-service';

/**
 * Mapeo de rutas del frontend según las rutas definidas en App.tsx
 */
const ROUTES = {
  // Dashboard
  DASHBOARD: '/dashboard',

  // Animals
  ANIMALS: '/animals',
  ANIMAL_DETAIL: (id: string) => `/animals/${id}`,

  // Milk
  MILK_COLLECTION: '/milk/collect',
  MILK_PRICES: '/settings?tab=prices',
  MILK_DELIVERIES: '/milk/deliveries', // Nota: parece que no existe en rutas, usar collect

  // Health
  HEALTH: '/health',

  // Reports
  REPORTS: '/reports',
} as const;

/**
 * Determina la ruta de navegación según el tipo de notificación
 * y sus datos asociados.
 *
 * @param notification - Objeto de notificación
 * @returns Ruta absoluta para navegar o null si no hay ruta específica
 */
export function getNotificationRoute(notification: Notification): string | null {
  const { type, data } = notification;

  switch (type) {
    // ==================== PRODUCCIÓN DE LECHE ====================
    case 'production_recorded':
    case 'production_low':
      // Si tiene animal_id, ir al detalle del animal
      if (data?.animal_id) {
        return ROUTES.ANIMAL_DETAIL(data.animal_id);
      }
      // Sino, ir a la colección de leche
      return ROUTES.MILK_COLLECTION;

    case 'production_bulk_recorded':
      // Para registro masivo, ir a milk collection con filtros si están disponibles
      if (data?.date && data?.shift) {
        return `${ROUTES.MILK_COLLECTION}?date=${data.date}&shift=${data.shift}`;
      }
      return ROUTES.MILK_COLLECTION;

    // ==================== ENTREGAS DE LECHE ====================
    case 'delivery_recorded':
      // Por ahora no hay ruta de deliveries separada, usar milk collection
      // TODO: Cuando se cree la ruta /milk/deliveries, actualizar aquí
      return ROUTES.MILK_COLLECTION;

    // ==================== EVENTOS DE ANIMALES ====================
    case 'animal_birth':
    case 'animal_sick':
    case 'animal_health_alert':
      // Navegar al detalle del animal si está disponible
      if (data?.animal_id) {
        return ROUTES.ANIMAL_DETAIL(data.animal_id);
      }
      // Sino, ir a la lista de animales
      return ROUTES.ANIMALS;

    // ==================== SALUD ====================
    case 'health_checkup_due':
    case 'vaccination_due':
      if (data?.animal_id) {
        return ROUTES.ANIMAL_DETAIL(data.animal_id);
      }
      return ROUTES.HEALTH;

    // ==================== PRECIOS ====================
    case 'price_updated':
    case 'price_change_alert':
      return ROUTES.MILK_PRICES;

    // ==================== MEMBRESÍAS Y SISTEMA ====================
    case 'membership_added':
    case 'membership_removed':
    case 'system':
      return ROUTES.DASHBOARD;

    // ==================== REPORTES ====================
    case 'report_generated':
    case 'report_ready':
      return ROUTES.REPORTS;

    // ==================== DEFAULT ====================
    default:
      // Si no reconocemos el tipo, intentar navegar según los datos
      if (data?.animal_id) {
        return ROUTES.ANIMAL_DETAIL(data.animal_id);
      }

      // Fallback al dashboard
      return ROUTES.DASHBOARD;
  }
}

/**
 * Verifica si una notificación tiene una ruta válida
 */
export function hasNotificationRoute(notification: Notification): boolean {
  return getNotificationRoute(notification) !== null;
}

/**
 * Obtiene el tipo de badge visual según el tipo de notificación
 */
export function getNotificationBadgeVariant(
  type: string
): 'default' | 'destructive' | 'secondary' | 'outline' {
  switch (type) {
    case 'production_low':
    case 'animal_sick':
    case 'health_checkup_due':
    case 'vaccination_due':
      return 'destructive';

    case 'delivery_recorded':
    case 'animal_birth':
      return 'default';

    case 'production_recorded':
    case 'production_bulk_recorded':
    case 'price_updated':
      return 'secondary';

    default:
      return 'outline';
  }
}

/**
 * Obtiene el color del icono según el tipo de notificación
 */
export function getNotificationIconColor(type: string): string {
  switch (type) {
    case 'production_low':
    case 'animal_sick':
    case 'health_checkup_due':
      return 'text-destructive';

    case 'delivery_recorded':
    case 'animal_birth':
      return 'text-green-500';

    case 'production_recorded':
    case 'production_bulk_recorded':
      return 'text-blue-500';

    case 'price_updated':
    case 'price_change_alert':
      return 'text-yellow-500';

    default:
      return 'text-muted-foreground';
  }
}

/**
 * Obtiene una etiqueta legible para el tipo de notificación
 */
export function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    production_recorded: 'Producción',
    production_low: 'Producción baja',
    production_bulk_recorded: 'Registro masivo',
    delivery_recorded: 'Entrega',
    animal_birth: 'Nacimiento',
    animal_sick: 'Animal enfermo',
    animal_health_alert: 'Alerta de salud',
    health_checkup_due: 'Chequeo pendiente',
    vaccination_due: 'Vacunación pendiente',
    price_updated: 'Precio actualizado',
    price_change_alert: 'Cambio de precio',
    membership_added: 'Nuevo miembro',
    membership_removed: 'Miembro removido',
    system: 'Sistema',
    report_generated: 'Reporte listo',
    report_ready: 'Reporte disponible',
  };

  return labels[type] || type;
}
