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
      const res = await getPendingProposal(truckId)
      setProposal(res.data)
      setResponded(false)
      if (res.data) toast.info('New proposal received')
    } catch {
      setProposal(mockProposal)
      setResponded(false)
      toast.info('Using mock proposal')
    }
  }

  const respond = async (accepted) => {
    setLoading(true)
    try {
      await respondProposal(truckId, { proposal_id: proposal.proposal_id, accepted })
      toast.success(accepted ? 'Proposal accepted! Route updated.' : 'Proposal rejected')
      setResponded(true)
    } catch {
      toast.success(accepted ? 'Proposal accepted (mock)' : 'Proposal rejected (mock)')
      setResponded(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Intermediate Pickup Proposals</h2>
        <p className="text-text-light text-sm">Review and respond to system-generated pickup proposals</p>
      </div>

      <div className="flex gap-3">
        <input
          className="input-field"
          value={truckId}
          onChange={(e) => setTruckId(e.target.value)}
          placeholder="Truck ID"
        />
        <button onClick={fetchProposal} className="btn-primary">
          <Bell size={16} /> Check Proposals
        </button>
      </div>

      {proposal && !responded ? (
        <div className="card border-l-4 border-l-accent p-5 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Bell size={20} className="text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-primary">New Pickup Proposal</h3>
              <p className="text-xs text-text-light">Proposal ID: {proposal.proposal_id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="card-sm">
              <div className="flex items-center gap-2 mb-1">
                <Package size={14} className="text-secondary" />
                <span className="text-xs text-text-light">Load Details</span>
              </div>
              <p className="font-medium">{proposal.load_id}</p>
              <p className="text-xs text-text-light">{proposal.load_type} · {proposal.load_weight}T</p>
            </div>
            <div className="card-sm">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} className="text-accent" />
                <span className="text-xs text-text-light">Pickup Node</span>
              </div>
              <p className="font-medium">{proposal.pickup_node}</p>
            </div>
            <div className="card-sm">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-amber-600" />
                <span className="text-xs text-text-light">Detour</span>
              </div>
              <p className="font-medium">{proposal.detour_km} km</p>
              <p className="text-xs text-text-light">+{proposal.extra_time_min} min</p>
            </div>
            <div className="card-sm">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={14} className="text-emerald-600" />
                <span className="text-xs text-text-light">Earnings</span>
              </div>
              <p className="font-bold text-lg">₹{proposal.estimated_earnings}</p>
              <p className="text-xs text-text-light">@₹{proposal.offered_rate}/km</p>
            </div>
          </div>

          <div className={`flex items-center gap-2 p-3 rounded-lg mb-4
            ${proposal.deadline_impact === 'none' ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
            <CheckCircle size={14} className={proposal.deadline_impact === 'none' ? 'text-emerald-600' : 'text-amber-600'} />
            <span className="text-sm">Deadline impact: <strong>{proposal.deadline_impact}</strong></span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => respond(true)}
              disabled={loading}
              className="btn-primary flex-1 justify-center"
            >
              <CheckCircle size={16} />
              Accept Proposal
            </button>
            <button
              onClick={() => respond(false)}
              disabled={loading}
              className="btn-outline flex-1 justify-center"
            >
              <XCircle size={16} />
              Reject
            </button>
          </div>
        </div>
      ) : responded ? (
        <div className="card text-center py-8 animate-fade-in">
          <CheckCircle size={40} className="text-emerald-600 mx-auto mb-3" />
          <p className="font-medium">Response submitted</p>
          <button onClick={() => setResponded(false)} className="btn-secondary mt-3 mx-auto">
            Check Again
          </button>
        </div>
      ) : (
        <div className="card text-center py-8">
          <Bell size={40} className="text-gray-400 mx-auto mb-3" />
          <p className="text-text-light">No pending proposals</p>
        </div>
      )}
    </div>
  )
}