export const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString();
};

export const formatCurrency = (amount) => {
  return `₹${amount.toFixed(2)}`;
};

export const formatDistance = (km) => {
  return `${km.toFixed(1)} km`;
};

export const truncate = (str, len) => {
  if (str.length <= len) return str;
  return str.slice(0, len) + '...';
};

export const getStatusColor = (status) => {
  const map = {
    ACTIVE: 'badge-active',
    IDLE: 'badge-active',
    AT_NODE: 'badge-info',
    TRAVELING: 'badge-info',
    EN_ROUTE: 'badge-info',
    WAITING: 'badge-warning',
    PAUSED: 'badge-warning',
    SCHEDULED: 'badge-warning',
    DELIVERED: 'badge-active',
    REJECTED: 'badge-danger',
    CANCELLED: 'badge-danger',
    INACTIVE: 'badge-inactive',
    PENDING: 'badge-warning',
    ASSIGNED: 'badge-info',
    PICKED_UP: 'badge-info'
  };
  return map[status?.toUpperCase()] || 'badge-inactive';
};

export const downloadCSV = (data, filename) => {
  const csvRows = [];
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(','));
  for (const row of data) {
    const values = headers.map(header => JSON.stringify(row[header] || ''));
    csvRows.push(values.join(','));
  }
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};