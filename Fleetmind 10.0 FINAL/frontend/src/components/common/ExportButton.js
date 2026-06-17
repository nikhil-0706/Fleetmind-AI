import { Download } from 'lucide-react';
import { downloadCSV } from '../../utils/helpers';

export default function ExportButton({ data, filename = 'export.csv' }) {
  if (!data || data.length === 0) return null;
  return (
    <button onClick={() => downloadCSV(data, filename)} className="btn-outline text-sm flex items-center gap-2">
      <Download size={16} /> Export CSV
    </button>
  );
}