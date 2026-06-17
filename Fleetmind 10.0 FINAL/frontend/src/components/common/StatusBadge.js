import { getStatusColor } from '../../utils/helpers';

export default function StatusBadge({ status }) {
  const color = getStatusColor(status);
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{status || 'UNKNOWN'}</span>;
}