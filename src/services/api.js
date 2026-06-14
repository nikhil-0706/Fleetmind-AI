import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = 'http://localhost:8005'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let msg = error?.response?.data?.detail || error.message || 'API Error'
    // If msg is an array (FastAPI validation errors) or an object, convert to readable string
    if (typeof msg === 'object') {
      if (Array.isArray(msg)) {
        msg = msg.map(err => err.msg || JSON.stringify(err)).join(', ')
      } else {
        msg = JSON.stringify(msg)
      }
    }
    toast.error(msg)
    return Promise.reject(error)
  }
)
// Health
export const getHealth = () => api.get('/health')
export const getMap = () => api.get('/map')

// Truck / Driver
export const registerTruck = (data) => api.post('/register/truck', data)
export const getTruckStatus = (id) => api.get(`/truck/${id}/status`)
export const getTruckRoute = (id) => api.get(`/truck/${id}/route`)
export const startSession = (data) => api.post('/truck/session/start', data)
export const endSession = (data) => api.post('/truck/session/end', data)
export const getSessionStatus = (id) => api.get(`/truck/${id}/session/status`)
export const depart = (id, data) => api.post(`/truck/${id}/depart`, data)
export const updateLocation = (id, data) => api.post(`/truck/${id}/location`, data)
export const arrive = (id, data) => api.post(`/truck/${id}/arrive`, data)
export const completeDelivery = (data) => api.post('/delivery/complete', data)
export const getPendingProposal = (id) => api.get(`/truck/${id}/pending_proposal`)
export const respondProposal = (id, data) => api.post(`/truck/${id}/respond_proposal`, data)

// Earnings
export const getCompletedDeliveries = (driverId, params) =>
  api.get(`/driver/${driverId}/deliveries/completed`, { params })
export const getEarnings = (driverId) => api.get(`/driver/${driverId}/earnings`)
export const getEarningsBreakdown = (driverId) =>
  api.get(`/driver/${driverId}/earnings/breakdown`)

// Load / Shipper
export const registerLoad = (data) => api.post('/register/load', data)
export const getLoadStatus = (id) => api.get(`/load/${id}/status`)
export const getShipperLoads = (shipperId) => api.get(`/shipper/${shipperId}/loads`)

// Warehouse
export const registerWarehouse = (data) => api.post('/register/warehouse', data)
export const updateDocks = (id, data) => api.put(`/warehouse/${id}/docks`, data)
export const getWarehouseSchedule = (id) => api.get(`/warehouse/${id}/schedule`)
export const getActiveLoads = (id) => api.get(`/warehouse/${id}/active_loads`)

// Admin
export const getAdminState = () => api.get('/admin/state')
export const forceMatch = (data) => api.post('/admin/match/force', data)
export const cancelPair = (data) => api.post('/admin/pair/cancel', data)
export const overrideRateCap = (data) => api.post('/admin/override/rate_cap', data)
export const getLogs = (params) => api.get('/admin/logs', { params })
export const exportLogs = () => api.get('/admin/logs/export', { responseType: 'blob' })