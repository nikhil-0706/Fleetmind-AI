import { useState, useEffect } from 'react';
import { adminGetAgentStatus } from '../../services/api';
import { Server, RefreshCw, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const agents = [
  { name: 'Truck Agent', key: 'truck', port: 8000 },
  { name: 'Load Agent', key: 'load', port: 8001 },
  { name: 'Warehouse Agent', key: 'warehouse', port: 8002 },
  { name: 'Backhaul Agent', key: 'backhaul', port: 8003 },
  { name: 'Coordinator', key: 'coordinator', port: 8005 },
];

export default function AgentStatus() {
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await adminGetAgentStatus();
      setStatuses(res.data);
    } catch (err) {
      toast.error('Failed to fetch agent status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); const interval = setInterval(fetchStatus, 10000); return () => clearInterval(interval); }, []);

  if (loading) return <div className="p-8 text-center">Loading agent status...</div>;

  const allUp = Object.values(statuses).every(s => s === 'up');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-primary">Agent Status</h2><p className="text-text-light text-sm">Microservice health</p></div><button onClick={fetchStatus} className="btn-secondary"><RefreshCw size={16} /> Refresh</button></div>
      <div className={`card p-4 mb-4 ${allUp ? 'bg-emerald-50' : 'bg-red-50'}`}><div className="flex items-center gap-2"><Activity size={20} /> <span className="font-semibold">{allUp ? 'All agents operational' : 'Some agents are down'}</span></div></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map(agent => (
          <div key={agent.key} className="card p-5 flex items-start justify-between">
            <div><div className="flex items-center gap-2"><Server size={20} className="text-accent" /><h3 className="font-semibold text-primary">{agent.name}</h3></div><p className="text-xs text-text-light mt-1">Port {agent.port}</p></div>
            <div><div className={`w-3 h-3 rounded-full ${statuses[agent.key] === 'up' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} /><span className="ml-2 text-sm">{statuses[agent.key] === 'up' ? 'Online' : 'Offline'}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}