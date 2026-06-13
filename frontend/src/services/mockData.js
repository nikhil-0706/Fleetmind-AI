// Mock data for development when backend isn't ready

export const mockHealth = {
  status: 'ok',
  agents: { truck: 'up', load: 'up', warehouse: 'up', backhaul: 'up', coordinator: 'up' },
}

export const mockMap = {
  nodes: [
    { node_id: 'N1', x: 100, y: 200, label: 'Mumbai Hub', is_warehouse: true },
    { node_id: 'N2', x: 300, y: 150, label: 'Pune Gate', is_warehouse: true },
    { node_id: 'N3', x: 500, y: 300, label: 'Nashik Depot', is_warehouse: true },
    { node_id: 'N4', x: 200, y: 400, label: 'Thane Junction', is_warehouse: false },
    { node_id: 'N5', x: 450, y: 100, label: 'Aurangabad WH', is_warehouse: true },
    { node_id: 'N6', x: 350, y: 350, label: 'Ahmednagar', is_warehouse: false },
  ],
  edges: [
    { edge_id: 'E1', from_node: 'N1', to_node: 'N2', distance_km: 150 },
    { edge_id: 'E2', from_node: 'N2', to_node: 'N3', distance_km: 200 },
    { edge_id: 'E3', from_node: 'N1', to_node: 'N4', distance_km: 40 },
    { edge_id: 'E4', from_node: 'N4', to_node: 'N6', distance_km: 100 },
    { edge_id: 'E5', from_node: 'N3', to_node: 'N5', distance_km: 120 },
    { edge_id: 'E6', from_node: 'N2', to_node: 'N6', distance_km: 80 },
    { edge_id: 'E7', from_node: 'N5', to_node: 'N2', distance_km: 170 },
  ],
}

export const mockTrucks = [
  {
    truck_id: 'T1',
    status: 'TRAVELING',
    current_edge_id: 'E1',
    progress_km: 75,
    next_destination: 'N2',
    remaining_capacity: 12,
    remaining_drive_hours: 6.5,
    current_load_weight: 8,
    assigned_pairs: ['pair_001'],
  },
  {
    truck_id: 'T2',
    status: 'IDLE',
    current_edge_id: null,
    progress_km: 0,
    next_destination: null,
    remaining_capacity: 20,
    remaining_drive_hours: 8,
    current_load_weight: 0,
    assigned_pairs: [],
  },
  {
    truck_id: 'T3',
    status: 'AT_NODE',
    current_edge_id: null,
    progress_km: 0,
    next_destination: 'N3',
    remaining_capacity: 5,
    remaining_drive_hours: 3,
    current_load_weight: 15,
    assigned_pairs: ['pair_002', 'pair_003'],
  },
]

export const mockLoads = [
  {
    load_id: 'L1',
    status: 'EN_ROUTE',
    type: 'fragile',
    weight: 8,
    assigned_truck: 'T1',
    pickup_node: 'N1',
    drop_node: 'N2',
    offered_rs_per_km: 50,
    delivery_deadline: '18:00',
    current_eta: '16:45',
  },
  {
    load_id: 'L2',
    status: 'WAITING',
    type: 'general',
    weight: 12,
    assigned_truck: null,
    pickup_node: 'N2',
    drop_node: 'N5',
    offered_rs_per_km: 45,
    delivery_deadline: '20:00',
    current_eta: null,
  },
  {
    load_id: 'L3',
    status: 'DELIVERED',
    type: 'perishable',
    weight: 5,
    assigned_truck: 'T2',
    pickup_node: 'N3',
    drop_node: 'N1',
    offered_rs_per_km: 60,
    delivery_deadline: '14:00',
    current_eta: '13:30',
  },
]

export const mockWarehouses = [
  {
    warehouse_id: 'WH1',
    node_id: 'N1',
    name: 'Mumbai Hub',
    status: 'ACTIVE',
    total_docks: 4,
    active_loads: ['L2'],
    scheduled_trucks: [
      { truck_id: 'T1', eta: '10:30', unloading_duration: 30 },
      { truck_id: 'T3', eta: '14:00', unloading_duration: 45 },
    ],
    compatible_load_types: ['fragile', 'general'],
  },
  {
    warehouse_id: 'WH2',
    node_id: 'N2',
    name: 'Pune Gate',
    status: 'ACTIVE',
    total_docks: 2,
    active_loads: [],
    scheduled_trucks: [{ truck_id: 'T2', eta: '12:00', unloading_duration: 20 }],
    compatible_load_types: ['general'],
  },
]

export const mockPairs = [
  {
    pair_id: 'pair_001',
    truck_id: 'T1',
    load_id: 'L1',
    status: 'EN_ROUTE',
    pickup_node: 'N1',
    drop_node: 'N2',
    assigned_warehouse: 'WH1',
    assigned_eta: '10:30',
    delivery_deadline: '18:00',
    utility_score: 78.5,
  },
  {
    pair_id: 'pair_002',
    truck_id: 'T3',
    load_id: 'L3',
    status: 'DELIVERED',
    pickup_node: 'N3',
    drop_node: 'N1',
    assigned_warehouse: 'WH1',
    assigned_eta: '13:30',
    delivery_deadline: '14:00',
    utility_score: 85.2,
  },
]

export const mockLogs = [
  { id: 1, timestamp: '2025-01-15T09:00:00Z', event: 'REGISTRATION', entity: 'truck/T1', details: 'Truck T1 registered' },
  { id: 2, timestamp: '2025-01-15T09:05:00Z', event: 'SESSION_START', entity: 'truck/T1', details: 'Session started, 8h drive hours' },
  { id: 3, timestamp: '2025-01-15T09:10:00Z', event: 'MATCH', entity: 'pair/pair_001', details: 'T1 matched to L1, score: 78.5' },
  { id: 4, timestamp: '2025-01-15T09:15:00Z', event: 'DEPART', entity: 'truck/T1', details: 'T1 departed N1 → N2' },
  { id: 5, timestamp: '2025-01-15T10:30:00Z', event: 'ARRIVE', entity: 'truck/T1', details: 'T1 arrived N2' },
  { id: 6, timestamp: '2025-01-15T10:35:00Z', event: 'DELIVERY', entity: 'pair/pair_002', details: 'L3 delivered by T3, earnings ₹360' },
  { id: 7, timestamp: '2025-01-15T11:00:00Z', event: 'BACKHAUL', entity: 'truck/T3', details: 'Backhaul evaluated, action: pickup_L2' },
]

export const mockEarnings = {
  daily: { '2025-01-13': 980, '2025-01-14': 1450, '2025-01-15': 1250 },
  weekly: { 'Week 1': 6200, 'Week 2': 7100, 'Week 3': 5800 },
  total: 19100,
}