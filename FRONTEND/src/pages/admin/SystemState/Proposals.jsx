import { useState, useEffect } from 'react';
import { adminGetProposals } from '../../../services/api';
import StatusBadge from '../../../components/StatusBadge';
import ExportButton from '../../../components/ExportButton';
import toast from 'react-hot-toast';

export default function ProposalsAdmin() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminGetProposals();
        setProposals(res.data.proposals || []);
      } catch (err) { toast.error('Failed to load proposals'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-primary">Proposals History</h2><p className="text-text-light text-sm">All proposals ever generated</p></div><ExportButton data={proposals} filename="proposals.csv" /></div>
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-3 text-left">Proposal ID</th><th>Truck</th><th>Load</th><th>Type</th><th>Status</th><th>Score</th><th>Est. Earnings</th><th>Created</th></tr></thead><tbody>{proposals.map(p => (<tr key={p.proposal_id} className="border-b border-border"><td className="p-3 text-xs">{p.proposal_id}</td><td className="p-3">{p.truck_id}</td><td className="p-3">{p.load_id}</td><td className="p-3">{p.proposal_type}</td><td className="p-3"><StatusBadge status={p.status} /></td><td className="p-3">{p.score}</td><td className="p-3">₹{p.estimated_earnings}</td><td className="p-3">{new Date(p.created_at).toLocaleDateString()}</td></tr>))}</tbody></table></div>
    </div>
  );
}