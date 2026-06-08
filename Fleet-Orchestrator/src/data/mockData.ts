import { Truck, MarketplaceListing, CapacityRequest } from '../types';

const cities = [
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  { city: 'Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { city: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867 },
  { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { city: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
];

const truckMakes = ['Tata', 'Ashok Leyland', 'Mahindra', 'BharatBenz', 'Eicher', 'Volvo'];
const truckModels: Record<string, string[]> = {
  'Tata': ['Prima', 'Signa', 'Ultra', 'LPT'],
  'Ashok Leyland': ['Captain', 'Boss', 'Guru', 'ecomet'],
  'Mahindra': ['Blazo', 'Furio', 'Jayo'],
  'BharatBenz': ['1617R', '2823R', '3723R'],
  'Eicher': ['Pro 2000', 'Pro 3000', 'Pro 6000'],
  'Volvo': ['FM', 'FH', 'FMX'],
};

const driverNames = [
  'Rajesh Kumar', 'Amit Singh', 'Suresh Patel', 'Vikram Yadav', 'Ramesh Sharma',
  'Deepak Verma', 'Anil Gupta', 'Sanjay Mishra', 'Manoj Tiwari', 'Pradeep Joshi',
  'Ravi Chauhan', 'Dinesh Rawat', 'Ashok Nair', 'Kiran Reddy', 'Mohan Das',
  'Prakash Rao', 'Vijay Pillai', 'Ganesh Iyer', 'Sunil Menon', 'Harish Kulkarni',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function generatePhone(): string {
  return `+91 ${Math.floor(7000000000 + Math.random() * 3000000000)}`;
}

function generateDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function generateFutureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

const truckTypes: Array<'flatbed' | 'refrigerated' | 'tanker' | 'box' | 'container' | 'lowboy'> = ['flatbed', 'refrigerated', 'tanker', 'box', 'container', 'lowboy'];
const fuelTypes: Array<'diesel' | 'electric' | 'hybrid' | 'cng'> = ['diesel', 'electric', 'hybrid', 'cng'];
const statuses: Array<'available' | 'in-transit' | 'loading' | 'maintenance' | 'idle'> = ['available', 'in-transit', 'loading', 'maintenance', 'idle'];

export function generateTrucks(count: number = 20): Truck[] {
  const trucks: Truck[] = [];
  for (let i = 0; i < count; i++) {
    const make = randomFrom(truckMakes);
    const model = randomFrom(truckModels[make]);
    const maxCap = randomFrom([10, 15, 20, 25, 30, 40]);
    const status = randomFrom(statuses);
    const currentLoc = randomFrom(cities);
    const destLoc = randomFrom(cities.filter(c => c.city !== currentLoc.city));
    const currentLoad = status === 'available' ? 0 : status === 'maintenance' ? 0 : randomBetween(0, maxCap);

    trucks.push({
      id: `TRK-${String(i + 1).padStart(4, '0')}`,
      registrationNumber: `${randomFrom(['MH', 'DL', 'KA', 'TN', 'GJ', 'RJ', 'UP', 'WB'])}${Math.floor(10 + Math.random() * 90)}${randomFrom(['A', 'B', 'C', 'D'])}${randomFrom(['A', 'B', 'C', 'D'])}${Math.floor(1000 + Math.random() * 9000)}`,
      driverName: driverNames[i % driverNames.length],
      driverPhone: generatePhone(),
      type: randomFrom(truckTypes),
      fuelType: randomFrom(fuelTypes),
      maxCapacityTons: maxCap,
      currentLoadTons: currentLoad,
      status,
      currentLocation: currentLoc,
      destination: status === 'in-transit' ? destLoc : undefined,
      lastUpdated: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      mileage: Math.floor(50000 + Math.random() * 450000),
      year: 2018 + Math.floor(Math.random() * 8),
      make,
      model,
      registeredDate: generateDate(Math.floor(Math.random() * 1000)),
      fuelEfficiency: randomBetween(2.5, 5.5),
      nextServiceDate: generateFutureDate(Math.floor(Math.random() * 90)),
      insurance: {
        provider: randomFrom(['ICICI Lombard', 'Bajaj Allianz', 'New India Assurance', 'HDFC ERGO', 'Tata AIG']),
        expiryDate: generateFutureDate(Math.floor(Math.random() * 365)),
        policyNumber: `POL-${Math.floor(100000 + Math.random() * 900000)}`,
      },
    });
  }
  return trucks;
}

export function generateMarketplaceListings(trucks: Truck[]): MarketplaceListing[] {
  const availableTrucks = trucks.filter(t => t.status === 'available' || t.status === 'idle');
  return availableTrucks.slice(0, Math.min(8, availableTrucks.length)).map((truck, i) => ({
    id: `LST-${String(i + 1).padStart(4, '0')}`,
    truckId: truck.id,
    truckRegistration: truck.registrationNumber,
    driverName: truck.driverName,
    truckType: truck.type,
    availableCapacityTons: truck.maxCapacityTons - truck.currentLoadTons,
    currentCity: truck.currentLocation.city,
    currentState: truck.currentLocation.state,
    preferredDestinations: [randomFrom(cities).city, randomFrom(cities).city, randomFrom(cities).city].filter((v, i, a) => a.indexOf(v) === i),
    pricePerTonPerKm: randomBetween(1.5, 4.5),
    availableFrom: generateDate(0),
    availableUntil: generateFutureDate(Math.floor(7 + Math.random() * 14)),
    notes: randomFrom([
      'Available for long haul routes',
      'Prefer highway routes only',
      'Can handle fragile cargo',
      'Temperature controlled available',
      'Experienced with hazardous materials',
      'Ready for immediate dispatch',
    ]),
    isActive: true,
    createdAt: new Date().toISOString(),
    contactPhone: truck.driverPhone,
  }));
}

export function generateCapacityRequests(): CapacityRequest[] {
  const cargoTypes = ['Electronics', 'FMCG', 'Automotive Parts', 'Textiles', 'Chemicals', 'Food Grains', 'Construction Material', 'Pharmaceuticals'];
  const requests: CapacityRequest[] = [];

  for (let i = 0; i < 10; i++) {
    const pickup = randomFrom(cities);
    const delivery = randomFrom(cities.filter(c => c.city !== pickup.city));
    requests.push({
      id: `REQ-${String(i + 1).padStart(4, '0')}`,
      requiredCapacityTons: randomFrom([5, 8, 10, 12, 15, 20, 25]),
      cargoType: randomFrom(cargoTypes),
      pickupCity: pickup.city,
      pickupState: pickup.state,
      deliveryCity: delivery.city,
      deliveryState: delivery.state,
      requiredTruckType: randomFrom([...truckTypes, 'any' as const]),
      requiredDate: generateFutureDate(Math.floor(Math.random() * 14)),
      budget: randomBetween(10000, 80000),
      status: randomFrom(['open', 'open', 'open', 'matched', 'closed']),
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      contactName: randomFrom(driverNames),
      contactPhone: generatePhone(),
    });
  }
  return requests;
}
