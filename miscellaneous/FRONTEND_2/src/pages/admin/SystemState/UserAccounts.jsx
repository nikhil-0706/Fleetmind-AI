import { useState, useEffect } from 'react';
import { adminGetUsers } from '../../../services/api';
import ExportButton from '../../../components/ExportButton';
import toast from 'react-hot-toast';

export default function UserAccounts() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminGetUsers();
        setUsers(res.data.users || []);
      } catch (err) { toast.error('Failed to load users'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-primary">User Accounts</h2><p className="text-text-light text-sm">All registered users (backend storage)</p></div><ExportButton data={users} filename="users.csv" /></div>
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-3 text-left">Role</th><th>User ID</th></tr></thead><tbody>{users.map((u, idx) => (<tr key={idx} className="border-b border-border"><td className="p-3 capitalize">{u.role}</td><td className="p-3 font-mono">{u.id}</td></tr>))}</tbody></table></div>
    </div>
  );
}