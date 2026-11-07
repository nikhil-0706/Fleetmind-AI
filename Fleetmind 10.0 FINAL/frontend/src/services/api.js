import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8005';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 404) {
      return Promise.reject(error);
    }
    let msg = error?.response?.data?.detail || error.message || 'API Error';
    if (typeof msg === 'object') {
      if (Array.isArray(msg)) msg = msg.map(err => err.msg || JSON.stringify(err)).join(', ');
      else msg = JSON.stringify(msg);
    }
    toast.error(msg);
    return Promise.reject(error);
  }
);

export const register = (role, id, password) => api.post('/auth/register', { role, id, password });
export const login = (role, id, password) => api.post('/auth/login', { role, id, password });

export const getMap = () => api.get('/admin/map');

export const registerTruck = (data) => api.post('/driver/register/truck', data);
export const getDriverTruck = (driverId) => api.get(`/driver/${driverId}/truck`);
export const getTruckStatus = (truckId) => api.get(`/driver/truck/${truckId}/status`);
export const startSession = (truckId) => api.post(`/driver/truck/${truckId}/session/start`);
export const endSession = (truckId) => api.post(`/driver/truck/${truckId}/session/end`);
export const getProposals = (truckId) => api.get(`/driver/truck/${truckId}/proposals`);
export const acceptProposal = (truckId, proposalId) => api.post(`/driver/truck/${truckId}/proposals/${proposalId}/accept`);
export const rejectProposal = (truckId, proposalId) => api.post(`/driver/truck/${truckId}/proposals/${proposalId}/reject`);
export const getPendingDeliveries = (truckId) => api.get(`/driver/truck/${truckId}/pending`);
export const getNextAction = (truckId) => api.get(`/driver/truck/${truckId}/next-action`);
export const depart = (truckId, toNodeId) => api.post(`/driver/truck/${truckId}/depart`, null, { params: { to_node_id: toNodeId } });
export const arrive = (truckId, nodeId) => api.post(`/driver/truck/${truckId}/arrive`, null, { params: { node_id: nodeId } });
export const completeDelivery = (truckId, pairId) => api.post('/driver/delivery/complete', null, { params: { truck_id: truckId, pair_id: pairId } });
export const getEarnings = (driverId, period) => api.get(`/driver/${driverId}/earnings`, { params: { period } });
export const getEarningsBreakdown = (driverId) => api.get(`/driver/${driverId}/earnings/breakdown`);

export const registerLoad = (data) => api.post('/shipper/register/load', data);
export const getShipperLoads = (shipperId) => api.get(`/shipper/${shipperId}/loads`);
export const getLoadStatus = (loadId) => api.get(`/shipper/load/${loadId}/status`);
export const getShipperHistory = (shipperId) => api.get(`/shipper/${shipperId}/history`);
export const getShipperAnalytics = (shipperId) => api.get(`/shipper/${shipperId}/analytics`);
export const getShipperMapData = (shipperId) => api.get(`/shipper/${shipperId}/map-data`);

export const registerWarehouse = (data) => api.post('/warehouse/register', data);
export const getWarehouseDetails = (warehouseId) => api.get(`/warehouse/${warehouseId}/details`);
export const updateWarehouseDetails = (warehouseId, compatibleLoadTypes) => api.put(`/warehouse/${warehouseId}/details`, { compatible_load_types: compatibleLoadTypes });
export const getWarehouseSchedule = (warehouseId) => api.get(`/warehouse/${warehouseId}/schedule`);
export const getWarehouseActiveLoads = (warehouseId) => api.get(`/warehouse/${warehouseId}/active-loads`);
export const freeDock = (warehouseId, dockNumber) => api.put(`/warehouse/${warehouseId}/dock/${dockNumber}/free`);
export const getWarehouseHistory = (warehouseId) => api.get(`/warehouse/${warehouseId}/history`);
export const getWarehouseAnalytics = (warehouseId) => api.get(`/warehouse/${warehouseId}/analytics`);

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
export const pickupLoad = (truckId, pairId) => 
  api.post(`/driver/truck/${truckId}/pickup`, null, { params: { pair_id: pairId } });
export const instantArrive = (truckId) => 
  api.post(`/driver/truck/${truckId}/instant-arrive`);
export default api;