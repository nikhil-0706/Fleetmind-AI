import { useState, useEffect } from 'react';
import { Navigation, MapPin, Package, Play, CheckCircle, Box, Zap } from 'lucide-react';
import { getTruckStatus, getPendingDeliveries, getNextAction, depart, arrive, completeDelivery, pickupLoad, instantArrive } from '../../services/api';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';

export default function RouteViewer() {
  const { truckId } = useApp();
  const [truckData, setTruckData] = useState(null);
  const [pending, setPending] = useState([]);
  const [nextAction, setNextAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departing, setDeparting] = useState(false);
  const [arriving, setArriving] = useState(false);

  const fetchData = async () => {
    if (!truckId) { setLoading(false); return; }
    try {
      const [status, pendingRes, action] = await Promise.all([
        getTruckStatus(truckId),
        getPendingDeliveries(truckId),
        getNextAction(truckId)
      ]);
      setTruckData(status.data);
      setPending(pendingRes.data.pending || []);
      setNextAction(action.data);
    } catch (err) {
      if (err.response?.status !== 404) toast.error('Failed to load route data');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [truckId]);

  const handleDepart = async () => {
    if (!nextAction || !nextAction.target_node_id) {
      toast.error('No target node. Please wait for suggestion.');
      return;
    }
    setDeparting(true);
    try {
      await depart(truckId, nextAction.target_node_id);
      toast.success(`Departed to ${nextAction.target_node_id}`);
      await fetchData();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Depart failed';
      toast.error(msg);
    } finally {
      setDeparting(false);
    }
  };

  const handleArrive = async () => {
    const targetNode = truckData?.next_destination;
    if (!targetNode) {
      toast.error('No destination to arrive at.');
      return;
    }
    setArriving(true);
    try {
      await arrive(truckId, targetNode);
      toast.success(`Arrived at ${targetNode}`);
      await fetchData();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Arrive failed';
      toast.error(msg);
    } finally {
      setArriving(false);
    }
  };

  const handlePickup = async (pairId) => {
    try {
      await pickupLoad(truckId, pairId);
      toast.success('Load picked up');
      await fetchData();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Pickup failed';
      toast.error(msg);
    }
  };

  const handleComplete = async (pairId) => {
    try {
      await completeDelivery(truckId, pairId);
      toast.success('Delivery completed');
      await fetchData();
    } catch (err) {
      toast.error('Completion failed');
    }
  };

  const handleInstantArrive = async () => {
    if (!truckId) return;
    try {
      await instantArrive(truckId);
      toast.success('Instant arrival!');
      await fetchData();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Instant arrive failed';
      toast.error(msg);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading route...</div>;

  const isTraveling = truckData?.status === 'TRAVELING';
  const isAtNode = truckData?.status === 'AT_NODE' || truckData?.status === 'IDLE';
  const hasRoute = truckData?.route && truckData.route.length > 0;
  const remainingRoute = truckData?.route || [];
  const currentPos = truckData?.current_node_id || (truckData?.current_edge_id ? 'en route' : '?');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Route Viewer</h2>
        <p className="text-text-light text-sm">Track and manage your journey</p>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">Status:</span>
            <StatusBadge status={truckData?.status} />
            {isTraveling && (
              <span className="text-xs text-text-light ml-2">
                Progress: {truckData?.progress_km?.toFixed(1)} km
              </span>
            )}
          </div>
          <div className="text-sm text-text-light">
            {truckData?.current_node_id && `At: ${truckData.current_node_id}`}
            {truckData?.next_destination && ` → Next: ${truckData.next_destination}`}
          </div>
        </div>

        {hasRoute && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Navigation size={16} className="text-blue-700" />
              <span className="text-sm font-medium text-blue-800">Route:</span>
            </div>
            <div className="text-sm text-blue-700 font-mono overflow-x-auto whitespace-nowrap">
              {currentPos} → {remainingRoute.join(' → ')}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {remainingRoute.length} hop(s) remaining
            </div>
          </div>
        )}
      </div>

      {nextAction && nextAction.action !== 'wait' && (
        <div className="card p-4 bg-accent/10 border-accent">
          <p className="text-sm font-semibold text-primary">Suggested Next Action</p>
          <p className="text-sm">
            {nextAction.action === 'pickup' ? `Pickup load ${nextAction.load_id} at ${nextAction.target_node_id}` :
             nextAction.action === 'drop' ? `Deliver load ${nextAction.load_id} at ${nextAction.target_node_id}` :
             nextAction.action}
          </p>
          <p className="text-xs text-text-light mt-1">Score: {nextAction.score}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-primary mb-4">Actions</h3>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDepart}
              disabled={!isAtNode || !nextAction?.target_node_id || departing}
              className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play size={16} />
              {departing ? 'Departing...' : 'Depart'}
            </button>
            <button
              onClick={handleArrive}
              disabled={!isTraveling || !truckData?.next_destination || arriving}
              className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <MapPin size={16} />
              {arriving ? 'Arriving...' : 'Arrive'}
            </button>
            {isTraveling && (
              <button
                onClick={handleInstantArrive}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <Zap size={16} /> Instant Arrive
              </button>
            )}
          </div>
          <p className="text-xs text-text-light mt-3">
            {isTraveling ? 'Traveling to next node. Click Arrive when reached.' :
             isAtNode ? 'At node. Click Depart to continue.' :
             'Awaiting instruction.'}
          </p>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-primary mb-4">Pending Deliveries</h3>
          {pending.length === 0 ? (
            <p className="text-text-light">No pending deliveries.</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {pending.map(p => {
                const isAtPickup = truckData?.current_node_id === p.pickup_node_id && p.status === 'PENDING';
                const isAtDrop = truckData?.current_node_id === p.drop_node_id && p.status === 'PICKED_UP';
                return (
                  <div key={p.pair_id} className="card-sm border-l-4 border-l-accent">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono text-sm">{p.load_id}</p>
                        <p className="text-xs text-text-light">
                          {p.pickup_node_id} → {p.drop_node_id}
                        </p>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="flex flex-col gap-1">
                        {isAtPickup && (
                          <button
                            onClick={() => handlePickup(p.pair_id)}
                            className="btn-primary text-xs py-1 px-3"
                          >
                            <Box size={14} /> Pickup
                          </button>
                        )}
                        {isAtDrop && (
                          <button
                            onClick={() => handleComplete(p.pair_id)}
                            className="btn-primary text-xs py-1 px-3"
                          >
                            <CheckCircle size={14} /> Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}