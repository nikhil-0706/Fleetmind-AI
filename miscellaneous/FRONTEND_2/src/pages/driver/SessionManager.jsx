import { useState, useEffect } from 'react';
import { Play, Square, Activity } from 'lucide-react';
import { startSession, endSession, getTruckStatus, getDriverTruck } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import toast from 'react-hot-toast';

export default function SessionManager() {
  const [truckId, setTruckId] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = getCurrentUser();

  const fetchTruckAndStatus = async () => {
    if (!user) return;
    try {
      const truckRes = await getDriverTruck(user.id);
      const tid = truckRes.data.truck_id;
      setTruckId(tid);
      const statusRes = await getTruckStatus(tid);
      setSessionActive(statusRes.data.status !== 'INACTIVE');
    } catch (err) {
      console.error(err);
      toast.error('Could not fetch truck');
    }
  };

  useEffect(() => { fetchTruckAndStatus(); }, []);

  const onStart = async () => {
    if (!truckId) return toast.error('No truck found');
    setLoading(true);
    try {
      await startSession(truckId);
      toast.success('Session started');
      setSessionActive(true);
    } catch (err) { toast.error('Failed to start session'); }
    finally { setLoading(false); }
  };

  const onEnd = async () => {
    if (!truckId) return;
    setLoading(true);
    try {
      await endSession(truckId);
      toast.success('Session ended');
      setSessionActive(false);
    } catch (err) { toast.error('Failed to end session'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h2 className="text-2xl font-bold text-primary">Session Manager</h2><p className="text-text-light text-sm">Start and manage your driving sessions</p></div>
      <div className="card p-6 space-y-4">
        <div className="flex gap-3">
          <button onClick={onStart} disabled={loading || sessionActive} className="btn-primary flex-1 justify-center"><Play size={16} /> Start Session</button>
          <button onClick={onEnd} disabled={loading || !sessionActive} className="btn-outline flex-1 justify-center"><Square size={16} /> End Session</button>
        </div>
        <p className="text-sm text-text-light">Session active: {sessionActive ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}