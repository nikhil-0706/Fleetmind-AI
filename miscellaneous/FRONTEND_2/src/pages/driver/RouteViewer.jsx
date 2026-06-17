import { useState, useEffect } from 'react';
import { Navigation, MapPin, Package, Play, CheckCircle } from 'lucide-react';
import { getTruckStatus, getPendingDeliveries, getNextAction, depart, arrive, completeDelivery, getDriverTruck } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';

export default function RouteViewer() {
  const [truckId, setTruckId] = useState(null);
  const [truckData, setTruckData] = useState(null);
  const [pending, setPending] = useState([]);
  const [nextAction, setNextAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  const fetchData = async () => {
    if (!user) return;
    try {
      const truckRes = await getDriverTruck(user.id);
      const tid = truckRes.data.truck_id;
      setTruckId(tid);
      const status = await getTruckStatus(tid);
      setTruckData(status.data);
      const pendingRes = await getPendingDeliveries(tid);
      setPending(pendingRes.data.pending || []);
      const action = await getNextAction(tid);
      setNextAction(action.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load route data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 5000); return () => clearInterval(interval); }, []);

  const handleDepart = async () => {
    if (!nextAction || !nextAction.target_node_id) return toast.error('No target node');
    try {
      await depart(truckId, nextAction.target_node_id);
      toast.success(`Departed to ${nextAction.target_node_id}`);
      fetchData();
    } catch (err) { toast.error('Depart failed'); }
  };

  const handleArrive = async () => {
    if (!truckData || !truckData.next_destination) return toast.error('No destination');
    try {
      await arrive(truckId, truckData.next_destination);
      toast.success(`Arrived at ${truckData.next_destination}`);
      fetchData();
    } catch (err) { toast.error('Arrive failed'); }
  };

  const handleComplete = async (pairId) => {
    try {
      await completeDelivery(truckId, pairId);
      toast.success('Delivery completed');
      fetchData();
    } catch (err) { toast.error('Completion failed'); }
  };

  if (loading) return <div className="p-8 text-center">Loading route...</div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-primary">Route Viewer</h2><p className="text-text-light text-sm">Track and manage your journey</p></div>
      <div className="card p-5"><h3 className="font-semibold text-primary mb-4">Next Action</h3>{nextAction ? (<div><p className="text-lg font-medium">{nextAction.action === 'pickup' ? `Pickup load ${nextAction.load_id} at ${nextAction.target_node_id}` : nextAction.action === 'drop' ? `Deliver load ${nextAction.load_id} at ${nextAction.target_node_id}` : nextAction.action}</p><p className="text-sm text-text-light">Score: {nextAction.score}</p></div>) : (<p className="text-text-light">No suggestion yet</p>)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5"><h3 className="font-semibold text-primary mb-4">Pending Deliveries</h3>{pending.length === 0 ? <p className="text-text-light">None</p> : pending.map(p => (<div key={p.pair_id} className="card-sm mb-2"><p><strong>{p.load_id}</strong> from {p.pickup_node_id} → {p.drop_node_id}</p><button onClick={() => handleComplete(p.pair_id)} className="btn-primary text-sm mt-2">Complete Delivery</button></div>))}</div>
        <div className="card p-5"><h3 className="font-semibold text-primary mb-4">Actions</h3><div className="flex gap-3"><button onClick={handleDepart} className="btn-primary flex-1"><Play size={16} /> Depart</button><button onClick={handleArrive} className="btn-primary flex-1"><MapPin size={16} /> Arrive</button></div></div>
      </div>
    </div>
  );
}