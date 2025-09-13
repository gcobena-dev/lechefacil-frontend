// Mock data para la aplicación de finca lechera

export interface Animal {
  id: string;
  tag: string;
  name: string;
  breed: string;
  birth_date: string;
  lot: string;
  status: 'active' | 'sold' | 'dead' | 'culled';
  photo_url?: string;
  created_at: string;
}

export interface MilkPrice {
  id: string;
  date: string;
  buyer_id?: string;
  price_per_liter: number;
  notes?: string;
}

export interface Buyer {
  id: string;
  name: string;
  notes?: string;
}

export interface MilkCollection {
  id: string;
  animal_id?: string;
  date: string;
  shift: 'AM' | 'PM';
  input_value: number;
  input_unit: 'L' | 'KG' | 'LB';
  density_used: number;
  liters: number;
  buyer_id?: string;
  price_per_liter: number;
  amount: number;
  created_by: string;
  created_at: string;
}

export interface HealthEvent {
  id: string;
  animal_id: string;
  date: string;
  type: string;
  diagnosis: string;
  treatment: string;
  dose: string;
  route: string;
  withdrawal_until?: string;
  files: string[];
  created_by: string;
}

// Mock data
export const mockAnimals: Animal[] = [
  {
    id: '1',
    tag: 'A001',
    name: 'Esperanza',
    breed: 'Holstein',
    birth_date: '2020-03-15',
    lot: 'Lote A',
    status: 'active',
    created_at: '2023-01-01'
  },
  {
    id: '2',
    tag: 'A002',
    name: 'Bonita',
    breed: 'Jersey',
    birth_date: '2019-08-22',
    lot: 'Lote A',
    status: 'active',
    created_at: '2023-01-01'
  },
  {
    id: '3',
    tag: 'B001',
    name: 'Paloma',
    breed: 'Holstein',
    birth_date: '2021-01-10',
    lot: 'Lote B',
    status: 'active',
    created_at: '2023-01-01'
  },
  {
    id: '4',
    tag: 'B002',
    name: 'Luna',
    breed: 'Normando',
    birth_date: '2020-11-05',
    lot: 'Lote B',
    status: 'active',
    created_at: '2023-01-01'
  }
];

export const mockBuyers: Buyer[] = [
  { id: '1', name: 'Lácteos del Valle', notes: 'Comprador principal' },
  { id: '2', name: 'Cooperativa San Pedro', notes: 'Pago semanal' },
  { id: '3', name: 'Procesadora Regional', notes: 'Calidad premium' }
];

export const mockMilkPrices: MilkPrice[] = [
  { id: '1', date: '2024-09-13', price_per_liter: 0.45, notes: 'Precio base' },
  { id: '2', date: '2024-09-13', buyer_id: '1', price_per_liter: 0.48, notes: 'Precio preferencial' },
  { id: '3', date: '2024-09-12', price_per_liter: 0.44 },
];

export const mockMilkCollections: MilkCollection[] = [
  {
    id: '1',
    animal_id: '1',
    date: '2024-09-13',
    shift: 'AM',
    input_value: 15,
    input_unit: 'L',
    density_used: 1.03,
    liters: 15,
    buyer_id: '1',
    price_per_liter: 0.48,
    amount: 7.2,
    created_by: 'user1',
    created_at: '2024-09-13T06:00:00Z'
  },
  {
    id: '2',
    animal_id: '2',
    date: '2024-09-13',
    shift: 'AM',
    input_value: 25,
    input_unit: 'LB',
    density_used: 1.03,
    liters: 11.03,
    buyer_id: '1',
    price_per_liter: 0.48,
    amount: 5.29,
    created_by: 'user1',
    created_at: '2024-09-13T06:15:00Z'
  },
  {
    id: '3',
    animal_id: '3',
    date: '2024-09-13',
    shift: 'AM',
    input_value: 18,
    input_unit: 'L',
    density_used: 1.03,
    liters: 18,
    buyer_id: '2',
    price_per_liter: 0.45,
    amount: 8.1,
    created_by: 'user1',
    created_at: '2024-09-13T06:30:00Z'
  }
];

export const mockHealthEvents: HealthEvent[] = [
  {
    id: '1',
    animal_id: '1',
    date: '2024-09-10',
    type: 'Vacunación',
    diagnosis: 'Prevención IBR',
    treatment: 'Vacuna IBR',
    dose: '2ml',
    route: 'Intramuscular',
    withdrawal_until: '2024-09-17',
    files: [],
    created_by: 'vet1'
  },
  {
    id: '2',
    animal_id: '2',
    date: '2024-09-08',
    type: 'Tratamiento',
    diagnosis: 'Mastitis leve',
    treatment: 'Antibiótico',
    dose: '10ml',
    route: 'Intramamario',
    withdrawal_until: '2024-09-15',
    files: [],
    created_by: 'vet1'
  }
];

// Utility functions
export const convertToLiters = (value: number, unit: 'L' | 'KG' | 'LB', density: number = 1.03): number => {
  switch (unit) {
    case 'L':
      return value;
    case 'KG':
      return value / density;
    case 'LB':
      return (value * 0.45359237) / density;
    default:
      return value;
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
};