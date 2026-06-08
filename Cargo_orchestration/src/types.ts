// Core domain types for the Cargo Orchestrator

export type LoadStatus =
  | "draft"
  | "pending_match"
  | "matched"
  | "consolidating"
  | "in_transit"
  | "at_hub"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type CargoType =
  | "general"
  | "perishable"
  | "hazmat"
  | "fragile"
  | "oversized"
  | "refrigerated"
  | "liquid"
  | "electronic";

export type VehicleType =
  | "van"
  | "box_truck"
  | "semi"
  | "flatbed"
  | "reefer"
  | "tanker"
  | "container";

export type Priority = "standard" | "expedited" | "critical";

export interface Location {
  city: string;
  region: string;
  lat: number;
  lng: number;
}

export interface Load {
  id: string;
  reference: string;
  shipper: string;
  consignee: string;
  origin: Location;
  destination: Location;
  cargoType: CargoType;
  weight: number; // kg
  volume: number; // cubic meters
  pallets: number;
  value: number; // USD
  priority: Priority;
  hazmat: boolean;
  refrigerated: boolean;
  fragile: boolean;
  pickupWindow: { start: string; end: string };
  deliveryWindow: { start: string; end: string };
  status: LoadStatus;
  carrierId?: string;
  vehicleId?: string;
  consolidatedGroupId?: string;
  cost?: number;
  createdAt: string;
  notes?: string;
}

export interface Carrier {
  id: string;
  name: string;
  rating: number; // 0-5
  onTimeRate: number; // 0-1
  safetyScore: number; // 0-100
  fleetSize: number;
  coverageRegions: string[];
  baseRate: number; // USD per km per kg
  surgeMultiplier: number;
  hazmatCertified: boolean;
  refrigeratedCertified: boolean;
}

export interface Vehicle {
  id: string;
  carrierId: string;
  type: VehicleType;
  capacityKg: number;
  capacityM3: number;
  palletSlots: number;
  currentLat: number;
  currentLng: number;
  homeHub: string;
  availableFrom: string;
  refrigerated: boolean;
  hazmatReady: boolean;
}

export interface Hub {
  id: string;
  name: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  capacityM3: number;
  throughput: number; // shipments per day
  hasRefrigeration: boolean;
  hasHazmat: boolean;
  operatingCost: number; // USD per shipment
}

export interface ConsolidatedGroup {
  id: string;
  name: string;
  loadIds: string[];
  vehicleId: string;
  carrierId: string;
  route: Location[];
  totalWeight: number;
  totalVolume: number;
  utilization: number; // 0-1
  cost: number;
  savedCost: number;
  createdAt: string;
}

export interface LifecycleEvent {
  id: string;
  loadId: string;
  status: LoadStatus;
  timestamp: string;
  location: string;
  note: string;
  actor: string;
}

export interface MatchScore {
  carrierId: string;
  carrierName: string;
  vehicleId: string;
  vehicleType: VehicleType;
  score: number;
  cost: number;
  transitHours: number;
  distanceKm: number;
  reasons: string[];
}
