import { useState, useEffect } from 'react';
import { Truck, Package, Warehouse, Link, Activity, RefreshCw, Maximize2 } from 'lucide-react';
import { adminGetTrucks, adminGetLoads, adminGetWarehouses, adminGetPairs, adminGetAgentStatus, getMap } from '../../services/api';
import StatCard from '../../components/StatCard';
import MapVisualizer from '../../components/MapVisualizer';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ trucks: 0, loads: 0, warehouses: 0, activePairs: 0 });
  const [agents, setAgents] = useState({});
  const [mapData, setMapData] = useState({ nodes: [], edges: [] });
  const [mapExpanded, setMapExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [trucksRes, loadsRes, whRes, pairsRes, agentsRes, mapRes] = await Promise.all([
        adminGetTrucks(), adminGetLoads(), adminGetWarehouses(), adminGetPairs(), adminGetAgentStatus(), getMap()
      ]);
      setStats({
        trucks: trucksRes.data.trucks.length,
        loads: loadsRes.data.loads.length,
        warehouses: whRes.data.warehouses.length,
        activePairs: pairsRes.data.pairs.filter(p => p.status !== 'DELIVERED').length
      });
      setAgents(agentsRes.data);
      setMapData(mapRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 15000); return () => clearInterval(interval); }, []);

  if (loading) return <div className="p-8 text-center">Loading admin dashboard...</div>;

  const agentList = ['truck', 'load', 'warehouse', 'backhaul', 'coordinator'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-primary">Admin Dashboard</h2><p className="text-text-light text-sm">System monitoring and control</p></div><button onClick={fetchData} className="btn-secondary"><RefreshCw size={16} /> Refresh</button></div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Trucks" value={stats.trucks} icon={Truck} />
        <StatCard title="Loads" value={stats.loads} icon={Package} />
        <StatCard title="Warehouses" value={stats.warehouses} icon={Warehouse} />
        <StatCard title="Active Pairs" value={stats.activePairs} icon={Link} />
      </div>

      {/* Map with expand button */}
      <div className="card p-4 relative">
        <div className="flex justify-between items-center mb-2"><h3 className="font-semibold text-primary">Live Logistics Map</h3><button onClick={() => setMapExpanded(!mapExpanded)} className="btn-outline text-sm py-1"><Maximize2 size={14} /> {mapExpanded ? 'Collapse' : 'Expand'}</button></div>
        <div className={mapExpanded ? 'fixed inset-4 z-50 bg-white p-4 rounded-xl shadow-2xl overflow-auto' : ''}>
          <MapVisualizer nodes={mapData.nodes} edges={mapData.edges} height={mapExpanded ? 600 : 350} />
          {mapExpanded && <button onClick={() => setMapExpanded(false)} className="absolute top-2 right-2 btn-outline">Close</button>}
        </div>
      </div>

      {/* Agent Status Line */}
      <div className="card p-3 flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-primary">Agent Status:</span>
        {agentList.map(agent => (
          <div key={agent} className="flex items-center gap-1"><div className={`w-2 h-2 rounded-full ${agents[agent] === 'up' ? 'bg-emerald-500' : 'bg-red-500'}`} /><span className="text-xs">{agent}</span></div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => window.location.href = '/admin/system-state/trucks'} className="btn-primary">System State</button>
        <button onClick={() => window.location.href = '/admin/agent-status'} className="btn-primary">Agent Status</button>
        <button onClick={() => window.location.href = '/admin/configuration'} className="btn-primary">Configuration</button>
      </div>
    </div>
  );
}