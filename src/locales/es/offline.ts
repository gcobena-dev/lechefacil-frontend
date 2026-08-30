export default {
  // Estado de conexión
  noConnection: "Sin conexión",
  connected: "Conectado",
  onlineWithQueue: "Hay registros sin enviar",
  checking: "Verificando conexión...",

  // Cola de envío
  savedOnDevice: "Guardado en el dispositivo",
  willQueueOnConfirm:
    "Sin conexión: el registro se guardará en el dispositivo y se enviará automáticamente cuando vuelvas a tener señal.",
  pendingCount_one: "{{count}} registro pendiente de enviar",
  pendingCount_other: "{{count}} registros pendientes de enviar",
  needsAttention_one: "{{count}} requiere tu atención",
  needsAttention_other: "{{count}} requieren tu atención",
  syncNow: "Sincronizar ahora",
  syncDone: "Registros enviados",
  syncDoneCount_one: "Se envió {{count}} registro pendiente.",
  syncDoneCount_other: "Se enviaron {{count}} registros pendientes.",
  syncDoneWithSkips:
    "Se enviaron {{sent}}; {{skipped}} ya estaban registrados en el servidor y se omitieron.",
  syncNeedsAttention: "Algunos registros no se pudieron enviar",
  viewPending: "Ver pendientes",
  staleQueue:
    "Hay registros sin enviar desde hace semanas. Conéctate pronto para no perder la sesión.",

  // Duplicados locales
  alreadyQueued:
    "{{animal}} ya tiene un registro pendiente de enviar para esta fecha y turno.",
  alreadyQueuedMany_one:
    "{{animals}} ya tiene un registro pendiente para esta fecha y turno.",
  alreadyQueuedMany_other:
    "{{count}} animales ya tienen registros pendientes para esta fecha y turno ({{animals}}...).",

  // Pantalla de pendientes
  pendingTitle: "Registros pendientes",
  pendingSubtitle: "Lo que está guardado en este dispositivo y aún no se envía",
  allSynced: "Todo sincronizado",
  allSyncedDesc: "No hay registros esperando en este dispositivo.",
  typedAt: "Registrado",
  attempts_one: "{{count}} intento",
  attempts_other: "{{count}} intentos",
  statusPending: "Pendiente",
  statusConflict: "Conflicto",
  statusFailed: "Rechazado",
  retry: "Reintentar",
  discard: "Descartar",
  discardTitle: "¿Descartar este registro?",
  discardWarning:
    "Este registro solo existe en este dispositivo. Si lo descartas, se pierde definitivamente.",
  conflictLine:
    "intentando registrar {{trying}}, pero el servidor ya tiene {{existing}} del {{when}}",

  // Datos en caché
  cachedData: "Datos guardados del {{when}}",
  cachedDataNoConnection:
    "Sin conexión: mostrando los últimos datos guardados en el dispositivo.",
  loadFailed: "No se pudieron cargar los datos",
  loadFailedNoCache:
    "No hay datos guardados en este dispositivo para mostrar sin conexión.",
  retryLoad: "Reintentar",
  pendingBadge: "Pendiente",
};
