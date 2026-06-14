import { useState } from 'react'
import { Map, Plus, GitBranch } from 'lucide-react'
import { addMapNode, addMapEdge, getMap } from '../../services/api'
import MapVisualizer from '../../components/MapVisualizer'
import { mockMap } from '../../services/mockData'
import toast from 'react-hot-toast'

export default function MapEditor() {
  const [mapData, setMapData] = useState(mockMap)
  const [nodeForm, setNodeForm] = useState({ node_id: '', x: '', y: '', label: '', is_warehouse: false })
  const [edgeForm, setEdgeForm] = useState({ edge_id: '', from_node: '', to_node: '', distance_km: '' })
  const [activeForm, setActiveForm] = useState('node')

  const fetchMap = async () => {
    try {
      const r = await getMap()
      setMapData(r.data)
    } catch {}
  }

  const handleAddNode = async () => {
    try {
      await addMapNode({ ...nodeForm, x: parseFloat(nodeForm.x), y: parseFloat(nodeForm.y) })
      toast.success(`Node ${nodeForm.node_id} added!`)
      setMapData((prev) => ({ ...prev, nodes: [...prev.nodes, { ...nodeForm, x: parseFloat(nodeForm.x), y: parseFloat(nodeForm.y) }] }))
      setNodeForm({ node_id: '', x: '', y: '', label: '', is_warehouse: false })
    } catch {
      toast.error('Failed to add node')
    }
  }

  const handleAddEdge = async () => {
    try {
      await addMapEdge({ ...edgeForm, distance_km: parseFloat(edgeForm.distance_km) })
      toast.success(`Edge ${edgeForm.edge_id} added!`)
      setMapData((prev) => ({ ...prev, edges: [...prev.edges, { ...edgeForm, distance_km: parseFloat(edgeForm.distance_km) }] }))
      setEdgeForm({ edge_id: '', from_node: '', to_node: '', distance_km: '' })
    } catch {
      toast.error('Failed to add edge')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
          <Map className="text-purple-400" size={24} />
          Map Editor
        </h2>
        <p className="text-dark-400 text-sm mt-1">Add nodes and edges to the logistics map</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forms */}
        <div className="space-y-4">
          <div className="flex gap-1 bg-dark-800 p-1 rounded-lg">
            {['node', 'edge'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveForm(f)}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all
                  ${activeForm === f ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-dark-200'}`}
              >
                {f === 'node' ? '📍 Node' : '🔗 Edge'}
              </button>
            ))}
          </div>

          {activeForm === 'node' ? (
            <div className="card space-y-3">
              <h3 className="font-semibold text-dark-200 flex items-center gap-2">
                <Plus size={16} className="text-primary-400" /> Add Node
              </h3>
              {[
                { key: 'node_id', label: 'Node ID', placeholder: 'N10' },
                { key: 'label', label: 'Label', placeholder: 'Mumbai Hub' },
                { key: 'x', label: 'X Position', placeholder: '150', type: 'number' },
                { key: 'y', label: 'Y Position', placeholder: '200', type: 'number' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input
                    type={type || 'text'}
                    className="input-field"
                    placeholder={placeholder}
                    value={nodeForm[key]}
                    onChange={(e) => setNodeForm({ ...nodeForm, [key]: e.target.value })}
                  />
                </div>
              ))}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nodeForm.is_warehouse}
                  onChange={(e) => setNodeForm({ ...nodeForm, is_warehouse: e.target.checked })}
                  className="w-4 h-4 accent-primary-600"
                />
                <span className="text-sm text-dark-300">Is Warehouse Node</span>
              </label>
              <button onClick={handleAddNode} className="btn-primary w-full justify-center">
                <Plus size={16} /> Add Node
              </button>
            </div>
          ) : (
            <div className="card space-y-3">
              <h3 className="font-semibold text-dark-200 flex items-center gap-2">
                <GitBranch size={16} className="text-primary-400" /> Add Edge
              </h3>
              {[
                { key: 'edge_id', label: 'Edge ID', placeholder: 'E20' },
                { key: 'from_node', label: 'From Node', placeholder: 'N10' },
                { key: 'to_node', label: 'To Node', placeholder: 'N11' },
                { key: 'distance_km', label: 'Distance (km)', placeholder: '35', type: 'number' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input
                    type={type || 'text'}
                    className="input-field"
                    placeholder={placeholder}
                    value={edgeForm[key]}
                    onChange={(e) => setEdgeForm({ ...edgeForm, [key]: e.target.value })}
                  />
                </div>
              ))}
              <button onClick={handleAddEdge} className="btn-primary w-full justify-center">
                <GitBranch size={16} /> Add Edge
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="card-sm">
            <p className="text-xs text-dark-400 mb-2">Map Statistics</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-dark-800 rounded p-2 text-center">
                <p className="text-lg font-bold text-primary-400">{mapData.nodes.length}</p>
                <p className="text-xs text-dark-500">Nodes</p>
              </div>
              <div className="bg-dark-800 rounded p-2 text-center">
                <p className="text-lg font-bold text-primary-400">{mapData.edges.length}</p>
                <p className="text-xs text-dark-500">Edges</p>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">Live Map Preview</h3>
            <button onClick={fetchMap} className="btn-secondary text-xs">
              Reload
            </button>
          </div>
          <MapVisualizer nodes={mapData.nodes} edges={mapData.edges} />

          {/* Node list */}
          <div className="mt-4">
            <p className="text-xs text-dark-400 mb-2">Nodes</p>
            <div className="flex flex-wrap gap-2">
              {mapData.nodes.map((n) => (
                <span key={n.node_id} className={n.is_warehouse ? 'badge-warning' : 'badge-info'}>
                  {n.node_id}: {n.label || n.node_id}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}