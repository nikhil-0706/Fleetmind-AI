import { useState, useEffect } from 'react';
import { adminGetLogs } from '../../../services/api';
import ExportButton from '../../../components/ExportButton';
import { Bell, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LogsNotifications() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState({ entity: '', event: '', isNotification: '' });
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const params = {};
      if (filter.entity) params.entity_id = filter.entity;
      if (filter.event) params.event_type = filter.event;
      if (filter.isNotification !== '') params.is_notification = filter.isNotification === 'true';
      const res = await adminGetLogs(params);
      setLogs(res.data.logs || []);
    } catch (err) { toast.error('Failed to load logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [filter]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-primary">Logs & Notifications</h2><p className="text-text-light text-sm">Combined timeline</p></div><ExportButton data={logs} filename="logs.csv" /></div>
      <div className="card p-4"><div className="grid grid-cols-3 gap-3"><input className="input-field" placeholder="Entity ID" value={filter.entity} onChange={e => setFilter({...filter, entity: e.target.value})} /><input className="input-field" placeholder="Event type" value={filter.event} onChange={e => setFilter({...filter, event: e.target.value})} /><select className="input-field" value={filter.isNotification} onChange={e => setFilter({...filter, isNotification: e.target.value})}><option value="">All</option><option value="true">Notifications only</option><option value="false">Logs only</option></select></div></div>
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-3 text-left">Timestamp</th><th>Type</th><th>Entity</th><th>Event</th><th>Details</th></tr></thead><tbody>{logs.map((l, i) => (<tr key={i} className="border-b border-border"><td className="p-3 text-xs">{new Date(l.timestamp).toLocaleString()}</td><td className="p-3">{l.is_notification ? <Bell size={14} className="text-accent" /> : <FileText size={14} className="text-gray-500" />}</td><td className="p-3">{l.entity_id}</td><td className="p-3">{l.event_type}</td><td className="p-3 text-xs">{JSON.stringify(l.details)}</td></tr>))}</tbody></table></div>
    </div>
  );
}