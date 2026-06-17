export const formatDate = (date) => new Date(date).toLocaleDateString();
export const formatDateTime = (date) => new Date(date).toLocaleString();
export const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;
export const formatDistance = (km) => `${km.toFixed(1)} km`;
export const truncate = (str, len) => str.length > len ? str.slice(0, len) + '...' : str;

export const downloadCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const getStatusColor = (status) => {
  const map = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    IDLE: 'bg-emerald-100 text-emerald-700',
    AT_NODE: 'bg-blue-100 text-blue-700',
    TRAVELING: 'bg-blue-100 text-blue-700',
    EN_ROUTE: 'bg-blue-100 text-blue-700',
    WAITING: 'bg-amber-100 text-amber-700',
    PAUSED: 'bg-amber-100 text-amber-700',
    SCHEDULED: 'bg-amber-100 text-amber-700',
    DELIVERED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-red-100 text-red-700',
    INACTIVE: 'bg-gray-100 text-gray-600',
    PENDING: 'bg-amber-100 text-amber-700',
    ASSIGNED: 'bg-blue-100 text-blue-700',
    PICKED_UP: 'bg-blue-100 text-blue-700',
  };
  return map[status?.toUpperCase()] || 'bg-gray-100 text-gray-600';
};