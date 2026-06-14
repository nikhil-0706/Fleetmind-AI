import { useState, useEffect } from 'react';
import { Truck, Clock } from 'lucide-react';
import { getWarehouseSchedule, freeDock } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import toast from 'react-hot-toast';

const DOCK_COUNT = 5;
const HOURS = Array.from({ length: 13 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return (h - 7) * 60 + (m || 0);
}

export default function DockSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();
  const warehouseId = user?.id;

  const fetchSchedule = async () => {
    if (!warehouseId) return;
    try {
      const res = await getWarehouseSchedule(warehouseId);
      setSchedule(res.data.scheduled_trucks || []);
    } catch (err) {
      toast.error('Failed to load schedule');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSchedule(); const interval = setInterval(fetchSchedule, 10000); return () => clearInterval(interval); }, [warehouseId]);

  const handleFreeDock = async (dockNumber) => {
    try {
      await freeDock(warehouseId, dockNumber);
      toast.success(`Dock ${dockNumber} freed`);
      fetchSchedule();
    } catch (err) { toast.error('Failed to free dock'); }
  };

  if (loading) return <div className="p-8 text-center">Loading schedule...</div>;

  // Build dot plot data: for each dock, list of scheduled trucks with their ETA time
  const dockAssignments = Array(DOCK_COUNT).fill().map(() => []);
  schedule.forEach(truck => {
    if (truck.dock_number >= 1 && truck.dock_number <= DOCK_COUNT) {
      dockAssignments[truck.dock_number - 1].push(truck);
    }
  });

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-primary">Dock Schedule</h2><p className="text-text-light text-sm">Dot plot of dock assignments</p></div>
      <div className="card p-5 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="flex mb-2"><div className="w-20 shrink-0"></div>{HOURS.map(h => <div key={h} className="w-20 text-center text-xs text-text-light">{h}</div>)}</div>
          {/* Docks */}
          {Array(DOCK_COUNT).fill().map((_, idx) => {
            const dockNumber = idx + 1;
            const trucks = dockAssignments[idx];
            return (
              <div key={dockNumber} className="flex items-center mb-4">
                <div className="w-20 shrink-0 text-sm font-medium text-primary">Dock {dockNumber}</div>
                <div className="relative h-12 flex-1 bg-gray-50 rounded border border-border">
                  {trucks.map((truck, ti) => {
                    const leftPercent = (parseTime(truck.eta) / (12 * 60)) * 100;
                    return (
                      <div key={ti} className="absolute top-1 w-3 h-8 rounded-full bg-accent cursor-pointer group" style={{ left: `${leftPercent}%` }} title={`${truck.truck_id} | ${truck.eta} | ${truck.unloading_duration} min`}>
                        <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap hidden group-hover:block">{truck.truck_id}</div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => handleFreeDock(dockNumber)} className="ml-2 text-xs text-red-500">Free</button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="card p-5"><h3 className="font-semibold text-primary mb-3">Incoming Trucks</h3><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-2 text-left">Truck ID</th><th>ETA</th><th>Load ID</th><th>Unload (min)</th><th>Dock</th></tr></thead><tbody>{schedule.map((t, i) => (<tr key={i} className="border-b border-border"><td className="p-2">{t.truck_id}</td><td className="p-2">{t.eta}</td><td className="p-2">{t.load_id}</td><td className="p-2">{t.unloading_duration}</td><td className="p-2">{t.dock_number}</td></tr>))}</tbody>}</table></div>
    </div>
  );
}