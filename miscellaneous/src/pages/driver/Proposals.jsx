import { useState } from 'react'
import { Bell, CheckCircle, XCircle, Package, Clock, DollarSign, MapPin } from 'lucide-react'
import { getPendingProposal, respondProposal } from '../../services/api'
import toast from 'react-hot-toast'

export default function Proposals() {
  const [truckId, setTruckId] = useState('')
  const [proposal, setProposal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [responded, setResponded] = useState(false)

  const fetchProposal = async () => {
    if (!truckId) {
      toast.error('Enter a Truck ID')
      return
    }
    setLoading(true)
    try {
      const res = await getPendingProposal(truckId)
      if (res.data) {
        setProposal(res.data)
        setResponded(false)
        toast.info('New proposal received')
      } else {
        setProposal(null)
        toast.info('No pending proposals')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch proposal')
      setProposal(null)
    } finally {
      setLoading(false)
    }
  }

  const respond = async (accepted) => {
    setLoading(true)
    try {
      await respondProposal(truckId, { proposal_id: proposal.proposal_id, accepted })
      toast.success(accepted ? 'Proposal accepted! Route updated.' : 'Proposal rejected')
      setResponded(true)
    } catch (err) {
      console.error(err)
      toast.error('Failed to respond')
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
        <button onClick={fetchProposal} disabled={loading} className="btn-primary">
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
              <p className="font-medium">{proposal.pickup_node_id}</p>
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

          <div className="flex gap-3">
            <button onClick={() => respond(true)} disabled={loading} className="btn-primary flex-1 justify-center">
              <CheckCircle size={16} /> Accept Proposal
            </button>
            <button onClick={() => respond(false)} disabled={loading} className="btn-outline flex-1 justify-center">
              <XCircle size={16} /> Reject
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