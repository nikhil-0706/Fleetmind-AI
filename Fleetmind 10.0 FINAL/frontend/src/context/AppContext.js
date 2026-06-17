import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/auth';
import { getDriverTruck } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [truckId, setTruckId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = getCurrentUser();
    setUser(userData);
    if (userData?.role === 'driver') {
      getDriverTruck(userData.id)
        .then(res => setTruckId(res.data.truck_id))
        .catch(() => setTruckId(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const refreshTruck = async () => {
    if (user?.role === 'driver') {
      try {
        const res = await getDriverTruck(user.id);
        setTruckId(res.data.truck_id);
      } catch {
        setTruckId(null);
      }
    }
  };

  return (
    <AppContext.Provider value={{ user, setUser, truckId, setTruckId, loading, refreshTruck }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}