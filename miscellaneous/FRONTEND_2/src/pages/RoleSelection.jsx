import { useNavigate } from 'react-router-dom';
import { Truck, Package, Warehouse, Shield } from 'lucide-react';

const roles = [
  { id: 'driver', name: 'Driver', icon: Truck, color: 'border-blue-200 bg-blue-50', textColor: 'text-blue-700' },
  { id: 'shipper', name: 'Shipper', icon: Package, color: 'border-emerald-200 bg-emerald-50', textColor: 'text-emerald-700' },
  { id: 'warehouse', name: 'Warehouse', icon: Warehouse, color: 'border-amber-200 bg-amber-50', textColor: 'text-amber-700' },
  { id: 'admin', name: 'Administrator', icon: Shield, color: 'border-purple-200 bg-purple-50', textColor: 'text-purple-700' },
];

export default function RoleSelection() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center mb-10"><h1 className="text-4xl font-bold text-primary">FleetMind</h1><p className="text-text-light mt-2">Logistics Intelligence Platform</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl w-full">
        {roles.map((role) => (
          <button key={role.id} onClick={() => navigate(`/login/${role.id}`)} className={`flex flex-col items-center p-6 rounded-2xl border-2 ${role.color} hover:shadow-lg transition-all transform hover:-translate-y-1`}>
            <role.icon size={40} className={role.textColor} /><span className={`mt-3 font-semibold ${role.textColor}`}>{role.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}