export type TruckStatus = 'available' | 'in-transit' | 'loading' | 'maintenance' | 'idle';
export type TruckType = 'flatbed' | 'refrigerated' | 'tanker' | 'box' | 'container' | 'lowboy';
export type FuelType = 'diesel' | 'electric' | 'hybrid' | 'cng';

export interface Truck {
  id: string;
  registrationNumber: string;
  driverName: string;
  driverPhone: string;
  type: TruckType;
  fuelType: FuelType;
  maxCapacityTons: number;
  currentLoadTons: number;
  status: TruckStatus;
  currentLocation: {
    lat: number;
    lng: number;
    city: string;
    state: string;
  };
  destination?: {
    lat: number;
    lng: number;
    city: string;
    state: string;
  };
  lastUpdated: string;
  mileage: number;
  year: number;
  make: string;
  model: string;
  registeredDate: string;
  fuelEfficiency: number; // km per liter
  nextServiceDate: string;
  insurance: {
    provider: string;
    expiryDate: string;
    policyNumber: string;
  };
}

export interface MarketplaceListing {
  id: string;
  truckId: string;
  truckRegistration: string;
  driverName: string;
  truckType: TruckType;
  availableCapacityTons: number;
  currentCity: string;
  currentState: string;
  preferredDestinations: string[];
  pricePerTonPerKm: number;
  availableFrom: string;
  availableUntil: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  contactPhone: string;
}

export interface CapacityRequest {
  id: string;
  requiredCapacityTons: number;
  cargoType: string;
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  requiredTruckType: TruckType | 'any';
  requiredDate: string;
  budget: number;
  status: 'open' | 'matched' | 'closed';
  matchedTruckId?: string;
  createdAt: string;
  contactName: string;
  contactPhone: string;
}

export interface FleetStats {
  totalTrucks: number;
  activeTrucks: number;
  inTransit: number;
  availableTrucks: number;
  maintenanceTrucks: number;
  totalCapacity: number;
  usedCapacity: number;
  emptyCapacity: number;
  avgFuelEfficiency: number;
  activeListings: number;
}

export type Page = 'dashboard' | 'registration' | 'capacity' | 'tracking' | 'monitoring' | 'marketplace';
