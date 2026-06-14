import { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, Package, Clock, DollarSign, MapPin } from 'lucide-react';
import { getProposals, acceptProposal, rejectProposal, getDriverTruck } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import toast from 'react-hot-toast';

export default function Proposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  const fetchProposals = async () => {
    if (!user) return;
    try {
      const truckRes = await getDriverTruck(user.id);
      const tid = truckRes.data.truck_id;
      const res = await getProposals(tid);
      setProposals(res.data.proposals || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProposals(); }, []);

  const handleAccept = async (proposalId) => {
    try {
      const truckRes = await getDriverTruck(user.id);
      await acceptProposal(truckRes.data.truck_id, proposalId);
      toast.success('Proposal accepted');
      fetchProposals();
    } catch (err) {
      toast.error('Accept failed');
    }
  };

  const handleReject = async (proposalId) => {
    try {
      const truckRes = await getDriverTruck(user.id);
      await rejectProposal(truckRes.data.truck_id, proposalId);
      toast.success('Proposal rejected');
      fetchProposals();
    } catch (err) {
      toast.error('Reject failed');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading proposals...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div><h2 className="text-2xl font-bold text-primary">Proposals</h2><p className="text-text-light text-sm">Review and accept/reject load proposals</p></div>
      {proposals.length === 0 ? (<div className="card text-center py-8"><Bell size={40} className="text-gray-400 mx-auto mb-3" /><p className="text-text-light">No pending proposals</p></div>)
      : (<div className="space-y-4">{proposals.map(prop => (<div key={prop.proposal_id} className="card border-l-4 border-l-accent p-5"><div className="flex items-center gap-3 mb-4"><div className="p-2 bg-accent/10 rounded-lg"><Bell size={20} className="text-accent" /></div><div><h3 className="font-bold text-primary">{prop.proposal_type === 'initial' ? 'Initial Pickup' : prop.proposal_type === 'intermediate' ? 'Intermediate Pickup' : 'Backhaul'}</h3><p className="text-xs text-text-light">Proposal ID: {prop.proposal_id}</p></div></div>
      <div className="grid grid-cols-2 gap-4 mb-4"><div className="card-sm"><div className="flex items-center gap-2 mb-1"><Package size={14} className="text-secondary" /><span className="text-xs text-text-light">Load</span></div><p className="font-medium">{prop.load_id}</p></div><div className="card-sm"><div className="flex items-center gap-2 mb-1"><MapPin size={14} className="text-accent" /><span className="text-xs text-text-light">Pickup Node</span></div><p className="font-medium">{prop.pickup_node_id}</p></div><div className="card-sm"><div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-amber-600" /><span className="text-xs text-text-light">Detour</span></div><p className="font-medium">{prop.detour_km} km</p><p className="text-xs text-text-light">+{prop.extra_time_min} min</p></div><div className="card-sm"><div className="flex items-center gap-2 mb-1"><DollarSign size={14} className="text-emerald-600" /><span className="text-xs text-text-light">Earnings</span></div><p className="font-bold text-lg">₹{prop.estimated_earnings}</p><p className="text-xs text-text-light">@₹{prop.offered_rate}/km</p></div></div>
      <div className="flex gap-3"><button onClick={() => handleAccept(prop.proposal_id)} className="btn-primary flex-1 justify-center"><CheckCircle size={16} /> Accept</button><button onClick={() => handleReject(prop.proposal_id)} className="btn-outline flex-1 justify-center"><XCircle size={16} /> Reject</button></div></div>))}</div>)}
    </div>
  );
}