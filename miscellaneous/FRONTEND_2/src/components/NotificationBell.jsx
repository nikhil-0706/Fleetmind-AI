import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { adminGetLogs } from '../services/api';
import { getCurrentUser } from '../services/auth';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [show, setShow] = useState(false);
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const res = await adminGetLogs({ is_notification: true, entity_id: user.id });
        setNotifications(res.data.logs.slice(0, 10));
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button onClick={() => setShow(!show)} className="relative p-2 rounded-full hover:bg-gray-100 transition">
        <Bell size={18} className="text-text-light" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
        )}
      </button>
      {show && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-border font-semibold text-primary">Notifications</div>
          {notifications.length === 0 ? (
            <div className="p-3 text-sm text-text-light">No notifications</div>
          ) : (
            notifications.map((notif, idx) => (
              <div key={idx} className="p-3 border-b border-border text-sm hover:bg-gray-50">
                <div className="text-text">{notif.details?.message || notif.event_type}</div>
                <div className="text-xs text-text-light mt-1">{new Date(notif.timestamp).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}