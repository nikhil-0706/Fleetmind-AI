import { Download } from 'lucide-react';

export default function ExportButton({ data, filename }) {
  const handleExport = () => {
    if (!data.length) return;
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));
    for (const row of data) {
      const values = headers.map(h => JSON.stringify(row[h] ?? ''));
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

  return (
    <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
      <Download size={16} /> Export CSV
    </button>
  );
}