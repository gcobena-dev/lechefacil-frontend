export const getStatusKeyFromCode = (code?: string) => {
  const c = (code ?? '').toUpperCase();
  if (["LACTATING", "DRY", "PREGNANT_DRY", "CALF", "HEIFER", "PREGNANT_HEIFER", "BULL"].includes(c)) return 'active';
  if (c === 'SOLD') return 'sold';
  if (c === 'CULLED') return 'culled';
  if (c === 'DEAD') return 'dead';
  return '';
};

