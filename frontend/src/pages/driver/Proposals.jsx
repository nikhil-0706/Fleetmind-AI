import { useState } from 'react'
import { Bell, CheckCircle, XCircle, Package, Clock, DollarSign, MapPin } from 'lucide-react'
import { getPendingProposal, respondProposal } from '../../services/api'
import toast from 'react-hot-toast'

const mockProposal = {
  proposal_id: 'prop_1',
  load_id: 'L4',
  pickup_node: 'N4',
  detour_km: 12,
  extra_time_min: 18,
  offered_rate: 52,
  estimated_earnings: 624,
  deadline_impact: 'none',
  load_type: 'general',
  load_weight: 6,
}

export default function Proposals() {
  const [truckId, setTruckId] = useState('T1')
  const [proposal, setProposal] = useState(mockProposal)
  const [loading, setLoading] = useState(false)
  const [responded, setResponded] = useState(false)

  const fetchProposal = async () => {
    try {
      const r = await getPendingProposal(truckId)
      setProposal(r.data)
      setResponded(false)
    } catch {
      setProposal(mockProposal)
      setResponded(false)
    }
  }

  const respond = async (accepted) => {
    setLoading(true)
    try {
      await respondProposal(truckId, { proposal_id: proposal.proposal_id, accepted })
      toast.success(accepted ? '✅ Proposal accepted! Route updated.' : '❌ Proposal rejected')
      setResponded(true)
    } catch {
      toast.success(accepted ? '✅ Proposal accepted! (mock)' : '❌ Proposal rejected (mock)')
      setResponded(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
          <Bell className="text-amber-400" size={24} />
          Intermediate Pickup Proposals
        </h2>
        <p className="text-dark-400 text-sm mt-1">Review and respond to system-generated pickup proposals</p>
      </div>

      <div className="flex gap-3">
        <input className="input-field" value={truckId} onChange={(e) => setTruckId(e.target.value)} placeholder="Truck ID" />
        <button onClick={fetchProposal} className="btn-primary">
          <Bell size={16} /> Check Proposals
        </button>
      </div>

      {proposal && !responded ? (
        <div className="card border border-amber-500/30 bg-amber-500/5 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Bell size={20} className="text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-dark-100">New Pickup Proposal!</h3>
              <p className="text-xs text-dark-400">Proposal ID: {proposal.proposal_id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="card-sm">
              <div className="flex items-center gap-2 mb-1">
                <Package size={14} className="text-blue-400" />
                <span className="text-xs text-dark-400">Load Details</span>
              </div>
              <p className="text-dark-100 font-medium">{proposal.load_id}</p>
              <p className="text-xs text-dark-400">{proposal.load_type} · {proposal.load_weight}T</p>
            </div>

            <div className="card-sm">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} className="text-emerald-400" />
                <span className="text-xs text-dark-400">Pickup Node</span>
              </div>
              <p className="text-dark-100 font-medium">{proposal.pickup_node}</p>
            </div>

            <div className="card-sm">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-amber-400" />
                <span className="text-xs text-dark-400">Detour</span>
              </div>
              <p className="text-dark-100 font-medium">{proposal.detour_km} km</p>
              <p className="text-xs text-dark-400">+{proposal.extra_time_min} min</p>
            </div>

            <div className="card-sm">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={14} className="text-emerald-400" />
                <span className="text-xs text-dark-400">Earnings</span>
              </div>
              <p className="text-dark-100 font-bold text-lg">₹{proposal.estimated_earnings}</p>
              <p className="text-xs text-dark-400">@₹{proposal.offered_rate}/km</p>
            </div>
          </div>

          <div className={`flex items-center gap-2 p-3 rounded-lg mb-4
            ${proposal.deadline_impact === 'none' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
            <CheckCircle size={14} className={proposal.deadline_impact === 'none' ? 'text-emerald-400' : 'text-amber-400'} />
            <span className="text-sm text-dark-300">
              Deadline impact: <strong>{proposal.deadline_impact}</strong>
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => respond(true)}
              disabled={loading}
              className="btn-success flex-1 justify-center"
            >
              <CheckCircle size={16} />
              Accept Proposal
            </button>
            <button
              onClick={() => respond(false)}
              disabled={loading}
              className="btn-danger flex-1 justify-center"
            >
              <XCircle size={16} />
              Reject
            </button>
          </div>
        </div>
      ) : responded ? (
        <div className="card text-center py-8 animate-fade-in">
          <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-dark-200 font-medium">Response submitted</p>
          <button onClick={() => setResponded(false)} className="btn-secondary mt-3 mx-auto">
            Check Again
          </button>
        </div>
      ) : (
        <div className="card text-center py-8">
          <Bell size={40} className="text-dark-600 mx-auto mb-3" />
          <p className="text-dark-500">No pending proposals</p>
        </div>
      )}
    </div>
  )
}