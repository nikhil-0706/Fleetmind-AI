import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type {
  Load,
  Carrier,
  Vehicle,
  Hub,
  LifecycleEvent,
  ConsolidatedGroup,
  LoadStatus,
} from "./types";
import {
  INITIAL_LOADS,
  CARRIERS,
  VEHICLES,
  HUBS,
  INITIAL_EVENTS,
  INITIAL_GROUPS,
} from "./data/seed";

interface AppState {
  loads: Load[];
  carriers: Carrier[];
  vehicles: Vehicle[];
  hubs: Hub[];
  events: LifecycleEvent[];
  groups: ConsolidatedGroup[];
}

interface AppContextValue extends AppState {
  createLoad: (
    load: Omit<Load, "id" | "reference" | "status" | "createdAt"> & {
      status?: LoadStatus;
    }
  ) => Load;
  updateLoad: (id: string, updates: Partial<Load>) => void;
  advanceLoad: (id: string, note: string, actor: string) => void;
  cancelLoad: (id: string, note: string) => void;
  assignCarrier: (loadId: string, carrierId: string, vehicleId: string, cost: number) => void;
  addEvent: (e: Omit<LifecycleEvent, "id">) => void;
  addGroup: (g: Omit<ConsolidatedGroup, "id" | "createdAt">) => ConsolidatedGroup;
  removeGroup: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const STATUS_FLOW: LoadStatus[] = [
  "draft",
  "pending_match",
  "matched",
  "consolidating",
  "in_transit",
  "at_hub",
  "out_for_delivery",
  "delivered",
];

function nextStatus(s: LoadStatus): LoadStatus {
  if (s === "delivered" || s === "cancelled") return s;
  if (s === "consolidating") return "in_transit";
  const idx = STATUS_FLOW.indexOf(s);
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return s;
  return STATUS_FLOW[idx + 1];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    loads: INITIAL_LOADS,
    carriers: CARRIERS,
    vehicles: VEHICLES,
    hubs: HUBS,
    events: INITIAL_EVENTS,
    groups: INITIAL_GROUPS,
  });

  const createLoad = useCallback<AppContextValue["createLoad"]>((data) => {
    const id = `ld-${Math.floor(Math.random() * 90000 + 10000)}`;
    const refCount = Math.floor(Math.random() * 900 + 1000);
    const reference = `SHP-${refCount}`;
    const load: Load = {
      ...data,
      id,
      reference,
      status: data.status ?? "pending_match",
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      loads: [load, ...s.loads],
      events: [
        {
          id: `ev-${Date.now()}`,
          loadId: id,
          status: load.status,
          timestamp: new Date().toISOString(),
          location: `${load.origin.city}, ${load.origin.region}`,
          note: "Load created in system",
          actor: "Dispatch",
        },
        ...s.events,
      ],
    }));
    return load;
  }, []);

  const updateLoad = useCallback<AppContextValue["updateLoad"]>((id, updates) => {
    setState((s) => ({
      ...s,
      loads: s.loads.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  }, []);

  const addEvent = useCallback<AppContextValue["addEvent"]>((e) => {
    setState((s) => ({
      ...s,
      events: [{ ...e, id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }, ...s.events],
    }));
  }, []);

  const advanceLoad = useCallback<AppContextValue["advanceLoad"]>(
    (id, note, actor) => {
      setState((s) => {
        const load = s.loads.find((l) => l.id === id);
        if (!load) return s;
        const ns = nextStatus(load.status);
        if (ns === load.status) return s;
        const event: LifecycleEvent = {
          id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          loadId: id,
          status: ns,
          timestamp: new Date().toISOString(),
          location:
            ns === "delivered"
              ? `${load.destination.city}, ${load.destination.region}`
              : ns === "in_transit"
                ? `${load.origin.city}, ${load.origin.region}`
                : `${load.destination.city}, ${load.destination.region}`,
          note: note || `Status updated to ${ns.replace("_", " ")}`,
          actor,
        };
        return {
          ...s,
          loads: s.loads.map((l) => (l.id === id ? { ...l, status: ns } : l)),
          events: [event, ...s.events],
        };
      });
    },
    []
  );

  const cancelLoad = useCallback<AppContextValue["cancelLoad"]>((id, note) => {
    setState((s) => {
      const load = s.loads.find((l) => l.id === id);
      if (!load) return s;
      const event: LifecycleEvent = {
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        loadId: id,
        status: "cancelled",
        timestamp: new Date().toISOString(),
        location: `${load.origin.city}, ${load.origin.region}`,
        note: note || "Load cancelled",
        actor: "Operations",
      };
      return {
        ...s,
        loads: s.loads.map((l) => (l.id === id ? { ...l, status: "cancelled" } : l)),
        events: [event, ...s.events],
      };
    });
  }, []);

  const assignCarrier = useCallback<AppContextValue["assignCarrier"]>(
    (loadId, carrierId, vehicleId, cost) => {
      setState((s) => {
        const load = s.loads.find((l) => l.id === loadId);
        const carrier = s.carriers.find((c) => c.id === carrierId);
        if (!load || !carrier) return s;
        const event: LifecycleEvent = {
          id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          loadId,
          status: "matched",
          timestamp: new Date().toISOString(),
          location: `${load.origin.city}, ${load.origin.region}`,
          note: `Matched with ${carrier.name} - Vehicle ${vehicleId} (${formatMoneyShort(cost)})`,
          actor: "Match Engine",
        };
        return {
          ...s,
          loads: s.loads.map((l) =>
            l.id === loadId
              ? { ...l, carrierId, vehicleId, cost, status: "matched" }
              : l
          ),
          events: [event, ...s.events],
        };
      });
    },
    []
  );

  const addGroup = useCallback<AppContextValue["addGroup"]>((g) => {
    const group: ConsolidatedGroup = {
      ...g,
      id: `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      groups: [group, ...s.groups],
      loads: s.loads.map((l) =>
        g.loadIds.includes(l.id)
          ? { ...l, status: "consolidating", consolidatedGroupId: group.id }
          : l
      ),
    }));
    return group;
  }, []);

  const removeGroup = useCallback<AppContextValue["removeGroup"]>((id) => {
    setState((s) => ({
      ...s,
      groups: s.groups.filter((g) => g.id !== id),
      loads: s.loads.map((l) =>
        l.consolidatedGroupId === id
          ? { ...l, status: "pending_match", consolidatedGroupId: undefined }
          : l
      ),
    }));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      createLoad,
      updateLoad,
      advanceLoad,
      cancelLoad,
      assignCarrier,
      addEvent,
      addGroup,
      removeGroup,
    }),
    [state, createLoad, updateLoad, advanceLoad, cancelLoad, assignCarrier, addEvent, addGroup, removeGroup]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

function formatMoneyShort(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}
