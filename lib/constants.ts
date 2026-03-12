import { GhanaRegion } from './types';

// Ghana Regions and Cities
export const GHANA_REGIONS: GhanaRegion[] = [
  {
    id: '1',
    name: 'Greater Accra',
    cities: [
      {
        id: '1-1',
        name: 'Accra',
        region_id: '1',
        areas: ['East Legon', 'West Legon', 'Airport Residential', 'Cantonments', 'Labone', 'Osu', 'Dansoman', 'Teshie', 'Nungua', 'Madina', 'Adenta', 'Spintex', 'Tema', 'Ashaiman']
      }
    ]
  },
  {
    id: '2',
    name: 'Ashanti',
    cities: [
      {
        id: '2-1',
        name: 'Kumasi',
        region_id: '2',
        areas: ['Asokwa', 'Ayeduase', 'Ayigya', 'Bantama', 'Bekwai', 'Ejisu', 'Fomena', 'Kotei', 'Kwadaso', 'Santasi', 'Suame']
      }
    ]
  },
  {
    id: '3',
    name: 'Western',
    cities: [
      {
        id: '3-1',
        name: 'Takoradi',
        region_id: '3',
        areas: ['Airport Ridge', 'Effiakuma', 'Kwesimintsim', 'Sekondi']
      }
    ]
  },
  {
    id: '4',
    name: 'Central',
    cities: [
      {
        id: '4-1',
        name: 'Cape Coast',
        region_id: '4',
        areas: ['University of Cape Coast', 'Ankaful', 'Elmina', 'Kokoado']
      }
    ]
  },
  {
    id: '5',
    name: 'Eastern',
    cities: [
      {
        id: '5-1',
        name: 'Koforidua',
        region_id: '5',
        areas: ['Adweso', 'Effiduase', 'Oyoko', 'Zongo']
      }
    ]
  },
  {
    id: '6',
    name: 'Volta',
    cities: [
      {
        id: '6-1',
        name: 'Ho',
        region_id: '6',
        areas: ['Airport', 'Bankoe', 'Ho Central', 'Hliha']
      }
    ]
  },
  {
    id: '7',
    name: 'Northern',
    cities: [
      {
        id: '7-1',
        name: 'Tamale',
        region_id: '7',
        areas: ['Central Business District', 'Kalpohin', 'Lamashegu', 'Sagnarigu']
      }
    ]
  },
  {
    id: '8',
    name: 'Upper East',
    cities: [
      {
        id: '8-1',
        name: 'Bolgatanga',
        region_id: '8',
        areas: ['Central', 'Navrongo', 'Zuarungu']
      }
    ]
  },
  {
    id: '9',
    name: 'Upper West',
    cities: [
      {
        id: '9-1',
        name: 'Wa',
        region_id: '9',
        areas: ['Central', 'Nadowli', 'Lawra']
      }
    ]
  },
  {
    id: '10',
    name: 'Brong Ahafo',
    cities: [
      {
        id: '10-1',
        name: 'Sunyani',
        region_id: '10',
        areas: ['Airport', 'Central', 'Fiapre', 'New Dormaa']
      }
    ]
  }
];

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'airbnb', label: 'Airbnb (Short-term)' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'house', label: 'House' },
  { value: 'store', label: 'Store/Shop' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'office', label: 'Office Space' },
  { value: 'land', label: 'Land/Plot' },
  { value: 'other', label: 'Other' }
] as const;

export const PAYMENT_TYPES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
] as const;

export const AMENITIES = [
  'WiFi',
  'Air Conditioning',
  'Security',
  'Parking',
  'Water',
  'Electricity',
  'Kitchen',
  'Furnished',
  'Generator',
  'Swimming Pool',
  'Gym',
  'Laundry',
  'CCTV',
  'Gated Community',
  'Near Public Transport'
] as const;

// Format Ghana phone numbers
export function formatGhanaPhone(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with +233
  if (cleaned.startsWith('0')) {
    return '+233' + cleaned.substring(1);
  }
  
  // If starts with 233, add +
  if (cleaned.startsWith('233')) {
    return '+' + cleaned;
  }
  
  // If doesn't start with country code, assume local and add +233
  if (cleaned.length === 9) {
    return '+233' + cleaned;
  }
  
  return '+' + cleaned;
}

// Format currency in GHS
export function formatCurrency(amount: number): string {
  return `₵${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

