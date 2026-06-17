import { useState } from 'react';
import { Play, Square } from 'lucide-react';
import { startSession, endSession } from '../../services/api';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';

export default function SessionManager() {
  const { truckId, refreshTruck } = useApp();
  const [loading, setLoading] = useState(false);

  const onStart = async () => {
    if (!truckId) { toast.error('No truck found. Please register a truck first.'); return; }
    setLoading(true);
    try {
      await startSession(truckId);
      toast.success('Session started');
    } catch (err) { toast.error('Failed to start session'); }
    finally { setLoading(false); }
  };

  const onEnd = async () => {
    if (!truckId) return;
    setLoading(true);
    try {
      await endSession(truckId);
      toast.success('Session ended');
    } catch (err) { toast.error('Failed to end session'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h2 className="text-2xl font-bold text-primary">Session Manager</h2><p className="text-text-light text-sm">Start and manage your driving sessions</p></div>
      <div className="card p-6 space-y-4">
        <div className="flex gap-3">
          <button onClick={onStart} disabled={loading} className="btn-primary flex-1"><Play size={16} /> Start Session</button>
          <button onClick={onEnd} disabled={loading} className="btn-outline flex-1"><Square size={16} /> End Session</button>
        </div>
        <p className="text-sm text-text-light">Truck ID: {truckId || 'Not registered'}</p>
      </div>
    </div>
  );
}