import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { Truck, MarketplaceListing, CapacityRequest, FleetStats, TruckStatus } from '../types';
import { generateTrucks, generateMarketplaceListings, generateCapacityRequests } from '../data/mockData';

interface FleetContextType {
  trucks: Truck[];
  listings: MarketplaceListing[];
  requests: CapacityRequest[];
  stats: FleetStats;
  addTruck: (truck: Truck) => void;
  updateTruckStatus: (id: string, status: TruckStatus) => void;
  removeTruck: (id: string) => void;
  addListing: (listing: MarketplaceListing) => void;
  removeListing: (id: string) => void;
  addRequest: (request: CapacityRequest) => void;
  matchRequest: (requestId: string, truckId: string) => void;
  getMatchingTrucks: (request: CapacityRequest) => Truck[];
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export function FleetProvider({ children }: { children: ReactNode }) {
  const [trucks, setTrucks] = useState<Truck[]>(() => generateTrucks(20));
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [requests, setRequests] = useState<CapacityRequest[]>(() => generateCapacityRequests());

  useEffect(() => {
    setListings(generateMarketplaceListings(trucks));
  }, []);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTrucks(prev => prev.map(truck => {
        if (truck.status === 'in-transit') {
          return {
            ...truck,
            lastUpdated: new Date().toISOString(),
            currentLocation: {
              ...truck.currentLocation,
              lat: truck.currentLocation.lat + (Math.random() - 0.5) * 0.05,
              lng: truck.currentLocation.lng + (Math.random() - 0.5) * 0.05,
            },
          };
        }
        return truck;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats: FleetStats = {
    totalTrucks: trucks.length,
    activeTrucks: trucks.filter(t => t.status !== 'maintenance').length,
    inTransit: trucks.filter(t => t.status === 'in-transit').length,
    availableTrucks: trucks.filter(t => t.status === 'available').length,
    maintenanceTrucks: trucks.filter(t => t.status === 'maintenance').length,
    totalCapacity: trucks.reduce((sum, t) => sum + t.maxCapacityTons, 0),
    usedCapacity: trucks.reduce((sum, t) => sum + t.currentLoadTons, 0),
    emptyCapacity: trucks.reduce((sum, t) => sum + (t.maxCapacityTons - t.currentLoadTons), 0),
    avgFuelEfficiency: trucks.length > 0
      ? Math.round(trucks.reduce((sum, t) => sum + t.fuelEfficiency, 0) / trucks.length * 100) / 100
      : 0,
    activeListings: listings.filter(l => l.isActive).length,
  };

  const addTruck = useCallback((truck: Truck) => {
    setTrucks(prev => [truck, ...prev]);
  }, []);

  const updateTruckStatus = useCallback((id: string, status: TruckStatus) => {
    setTrucks(prev => prev.map(t => t.id === id ? { ...t, status, lastUpdated: new Date().toISOString() } : t));
  }, []);

  const removeTruck = useCallback((id: string) => {
    setTrucks(prev => prev.filter(t => t.id !== id));
    setListings(prev => prev.filter(l => l.truckId !== id));
  }, []);

  const addListing = useCallback((listing: MarketplaceListing) => {
    setListings(prev => [listing, ...prev]);
  }, []);

  const removeListing = useCallback((id: string) => {
    setListings(prev => prev.filter(l => l.id !== id));
  }, []);

  const addRequest = useCallback((request: CapacityRequest) => {
    setRequests(prev => [request, ...prev]);
  }, []);

  const matchRequest = useCallback((requestId: string, truckId: string) => {
    setRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status: 'matched' as const, matchedTruckId: truckId } : r
    ));
  }, []);

  const getMatchingTrucks = useCallback((request: CapacityRequest) => {
    return trucks.filter(truck => {
      if (truck.status !== 'available' && truck.status !== 'idle') return false;
      const availableCapacity = truck.maxCapacityTons - truck.currentLoadTons;
      if (availableCapacity < request.requiredCapacityTons) return false;
      if (request.requiredTruckType !== 'any' && truck.type !== request.requiredTruckType) return false;
      return true;
    });
  }, [trucks]);

  return (
    <FleetContext.Provider value={{
      trucks, listings, requests, stats,
      addTruck, updateTruckStatus, removeTruck,
      addListing, removeListing,
      addRequest, matchRequest, getMatchingTrucks,
    }}>
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  const context = useContext(FleetContext);
  if (!context) throw new Error('useFleet must be used within FleetProvider');
  return context;
}
