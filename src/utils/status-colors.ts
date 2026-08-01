/**
 * Colores de estado y categoría del design system.
 *
 * Dos jobs distintos, no mezclar:
 *  - ESTADO (bien / atención / grave): tokens semánticos reservados. Siempre
 *    acompañados de texto o icono, nunca color solo.
 *  - CATEGORÍA (identidad: etapa del animal, tipo de evento): paleta categórica
 *    `--chart-1..8`, en orden fijo. No se cicla ni se genera un tono nuevo.
 *
 * Todo se expresa en tokens para que funcione igual en claro y en oscuro.
 */

/** Clases tonales de estado, para badges y chips. */
export const statusTone = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/15 text-warning border-warning/25",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-info/10 text-info border-info/20",
  neutral: "bg-muted text-muted-foreground border-border",
} as const;

export type StatusTone = keyof typeof statusTone;

/** Clases tonales por slot categórico (orden fijo de la paleta validada). */
export const categoryTone = {
  1: "bg-chart-1/10 text-chart-1 border-chart-1/25",
  2: "bg-chart-2/10 text-chart-2 border-chart-2/25",
  3: "bg-chart-3/10 text-chart-3 border-chart-3/25",
  4: "bg-chart-4/15 text-chart-4 border-chart-4/25",
  5: "bg-chart-5/10 text-chart-5 border-chart-5/25",
  6: "bg-chart-6/10 text-chart-6 border-chart-6/25",
  7: "bg-chart-7/10 text-chart-7 border-chart-7/25",
  8: "bg-chart-8/10 text-chart-8 border-chart-8/25",
} as const;

export type CategorySlot = keyof typeof categoryTone;

/**
 * Etapa productiva del animal → slot categórico.
 * Los estados terminales (vendido/muerto/descartado) usan tono de estado,
 * porque ahí el color sí significa algo, no solo distingue.
 */
const ANIMAL_STATUS_TONE: Record<string, string> = {
  CALF: categoryTone[1],
  HEIFER: categoryTone[7],
  PREGNANT_HEIFER: categoryTone[5],
  LACTATING: categoryTone[3],
  DRY: categoryTone[4],
  PREGNANT_DRY: categoryTone[2],
  BULL: categoryTone[6],
  SOLD: statusTone.neutral,
  DEAD: statusTone.destructive,
  CULLED: statusTone.destructive,
};

export function getAnimalStatusTone(code: string): string {
  return ANIMAL_STATUS_TONE[code?.toUpperCase()] ?? statusTone.neutral;
}

/** Tipo de evento del animal → tono. */
const EVENT_TYPE_TONE: Record<string, string> = {
  CALVING: statusTone.success,
  BIRTH: statusTone.success,
  DRY_OFF: categoryTone[1],
  SERVICE: categoryTone[7],
  EMBRYO_TRANSFER: categoryTone[5],
  TRANSFER: statusTone.neutral,
  SALE: statusTone.warning,
  CULL: categoryTone[2],
  DEATH: statusTone.destructive,
  ABORTION: statusTone.destructive,
};

export function getEventTypeTone(type: string): string {
  return EVENT_TYPE_TONE[type?.toUpperCase()] ?? statusTone.neutral;
}
