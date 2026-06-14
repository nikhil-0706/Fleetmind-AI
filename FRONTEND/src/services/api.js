import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = 'http://localhost:8005';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error toasts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let msg = error?.response?.data?.detail || error.message || 'API Error';
    if (typeof msg === 'object') {
      if (Array.isArray(msg)) msg = msg.map(err => err.msg || JSON.stringify(err)).join(', ');
      else msg = JSON.stringify(msg);
    }
    toast.error(msg);
    return Promise.reject(error);
  }
);

// ========== Auth ==========
export const register = (role, id, password) => api.post('/auth/register', { role, id, password });
export const login = (role, id, password) => api.post('/auth/login', null, { params: { role, id, password } });

// ========== Map ==========
export const getMap = () => api.get('/map');

// ========== Truck / Driver ==========
export const registerTruck = (data) => api.post('/register/truck', data);
export const getDriverTruck = (driverId) => api.get(`/driver/${driverId}/truck`);
export const getTruckStatus = (truckId) => api.get(`/truck/${truckId}/status`);
export const startSession = (truckId) => api.post('/truck/session/start', null, { params: { truck_id: truckId } });
export const endSession = (truckId) => api.post('/truck/session/end', null, { params: { truck_id: truckId } });
export const getProposals = (truckId) => api.get(`/truck/${truckId}/proposals`);
export const acceptProposal = (truckId, proposalId) => api.post(`/truck/${truckId}/proposals/${proposalId}/accept`);
export const rejectProposal = (truckId, proposalId) => api.post(`/truck/${truckId}/proposals/${proposalId}/reject`);
export const getPendingDeliveries = (truckId) => api.get(`/truck/${truckId}/pending`);
export const getNextAction = (truckId) => api.get(`/truck/${truckId}/next-action`);
export const depart = (truckId, toNodeId) => api.post(`/truck/${truckId}/depart`, null, { params: { to_node_id: toNodeId } });
export const arrive = (truckId, nodeId) => api.post(`/truck/${truckId}/arrive`, null, { params: { node_id: nodeId } });
export const completeDelivery = (truckId, pairId) => api.post('/delivery/complete', null, { params: { truck_id: truckId, pair_id: pairId } });
export const getEarnings = (driverId, period) => api.get(`/driver/${driverId}/earnings`, { params: { period } });
export const getEarningsBreakdown = (driverId) => api.get(`/driver/${driverId}/earnings/breakdown`);

// ========== Load / Shipper ==========
export const registerLoad = (data) => api.post('/register/load', data);
export const getShipperLoads = (shipperId) => api.get(`/shipper/${shipperId}/loads`);
export const getLoadStatus = (loadId) => api.get(`/load/${loadId}/status`);
export const getShipperHistory = (shipperId) => api.get(`/shipper/${shipperId}/history`);
export const getShipperAnalytics = (shipperId) => api.get(`/shipper/${shipperId}/analytics`);
export const getShipperMapData = (shipperId) => api.get(`/shipper/${shipperId}/map-data`);

// ========== Warehouse ==========
export const registerWarehouse = (data) => api.post('/register/warehouse', data);
export const getWarehouseDetails = (warehouseId) => api.get(`/warehouse/${warehouseId}/details`);
export const updateWarehouseDetails = (warehouseId, compatibleLoadTypes) => api.put(`/warehouse/${warehouseId}/details`, { compatible_load_types: compatibleLoadTypes });
export const getWarehouseSchedule = (warehouseId) => api.get(`/warehouse/${warehouseId}/schedule`);
export const getWarehouseActiveLoads = (warehouseId) => api.get(`/warehouse/${warehouseId}/active-loads`);
export const freeDock = (warehouseId, dockNumber) => api.put(`/warehouse/${warehouseId}/dock/${dockNumber}/free`);
export const getWarehouseHistory = (warehouseId) => api.get(`/warehouse/${warehouseId}/history`);
export const getWarehouseAnalytics = (warehouseId) => api.get(`/warehouse/${warehouseId}/analytics`);

// ========== Admin ==========
export const adminGetTrucks = () => api.get('/admin/state/trucks');
export const adminGetLoads = () => api.get('/admin/state/loads');
export const adminGetWarehouses = () => api.get('/admin/state/warehouses');
export const adminGetPairs = () => api.get('/admin/state/pairs');
export const adminGetProposals = () => api.get('/admin/state/proposals');
export const adminGetEarnings = () => api.get('/admin/earnings/trucks');
export const adminGetLogs = (params) => api.get('/admin/logs', { params });
export const adminGetUsers = () => api.get('/admin/users');
export const adminGetAgentStatus = () => api.get('/admin/agents/status');
export const adminGetConfig = () => api.get('/admin/config');
export const adminUpdateConfig = (config) => api.post('/admin/config', config);