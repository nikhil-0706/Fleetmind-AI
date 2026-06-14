const statusMap = {
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
  PICKED_UP: 'badge-info',
}

export default function StatusBadge({ status }) {
  const cls = statusMap[status?.toUpperCase()] || 'badge-inactive'
  return <span className={cls}>{status}</span>
}