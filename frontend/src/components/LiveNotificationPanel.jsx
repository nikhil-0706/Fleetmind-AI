import { useState, useEffect } from 'react'
import { X, Bell, Truck, Package, Warehouse, Zap } from 'lucide-react'

const mockNotifications = [
  { id: 1, type: 'intermediate_proposal', title: 'New Pickup Proposal', message: 'Truck T1: Intermediate pickup L4 available, detour 12km', time: '2m ago', icon: Truck, color: 'text-blue-400' },
  { id: 2, type: 'load_assigned', title: 'Load Assigned', message: 'Load L2 assigned to Truck T3', time: '5m ago', icon: Package, color: 'text-emerald-400' },
  { id: 3, type: 'truck_arriving', title: 'Truck Arriving', message: 'T1 arriving at WH1 in 15 min', time: '8m ago', icon: Warehouse, color: 'text-amber-400' },
  { id: 4, type: 'backhaul_suggestion', title: 'Backhaul Decision', message: 'T2: Best action = pickup_L5, score 72.3', time: '12m ago', icon: Zap, color: 'text-purple-400' },
  { id: 5, type: 'delivery_confirmed', title: 'Delivery Complete', message: 'L3 delivered by T2, earnings ₹480', time: '20m ago', icon: Package, color: 'text-emerald-400' },
]

export default function LiveNotificationPanel({ onClose }) {
  const [notifications, setNotifications] = useState(mockNotifications)

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-dark-900 border-l border-dark-700 
      shadow-2xl z-50 flex flex-col animate-slide-in">
      <div className="flex items-center justify-between p-4 border-b border-dark-700">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary-400" />
          <span className="font-semibold text-dark-100">Live Notifications</span>
          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {notifications.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {notifications.map((notif) => (
          <div key={notif.id} className="card-sm hover:border-dark-500 transition-all cursor-pointer">
            <div className="flex items-start gap-3">
              <div className={`p-2 bg-dark-800 rounded-lg ${notif.color}`}>
                <notif.icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-dark-100">{notif.title}</p>
                  <span className="text-xs text-dark-500 shrink-0">{notif.time}</span>
                </div>
                <p className="text-xs text-dark-400 mt-0.5">{notif.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-dark-700">
        <button
          onClick={() => setNotifications([])}
          className="w-full btn-secondary text-xs justify-center"
        >
          Clear All
        </button>
      </div>
    </div>
  )
}