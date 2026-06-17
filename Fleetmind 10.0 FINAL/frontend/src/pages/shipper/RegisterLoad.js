import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerLoad, adminGetWarehouses } from '../../services/api';
import { getCurrentUser } from '../../services/auth'; // <-- use this

export default function RegisterLoad() {
  const [loading, setLoading] = useState(false);
  const [warehouseNodes, setWarehouseNodes] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const navigate = useNavigate();

  // Get user directly from localStorage
  const user = getCurrentUser();
  const shipperId = user?.id;

  // Fetch all warehouses to get the nodes where loads can be placed
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await adminGetWarehouses();
        const nodes = res.data.warehouses.map(w => w.node_id).filter(Boolean);
        setWarehouseNodes(nodes);
      } catch (err) {
        toast.error('Failed to load warehouse nodes');
        setWarehouseNodes([]);
      } finally {
        setWarehousesLoading(false);
      }
    };
    fetchWarehouses();
  }, []);

  const onSubmit = async (data) => {
    if (warehouseNodes.length === 0) {
      toast.error('No warehouses available. Please register a warehouse first.');
      return;
    }
    if (!shipperId) {
      toast.error('You must be logged in as a shipper.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        load_id: data.load_id,
        shipper_id: shipperId,
        type: data.type,
        weight: parseFloat(data.weight),
        pickup_node_id: data.pickup_node,
        drop_node_id: data.drop_node,
        offered_rs_per_km: parseFloat(data.rate),
        delivery_deadline: data.deadline,
        pickup_time: data.pickup_time,
        delay_limit: parseInt(data.delay_limit) || 30,
        status: 'PENDING'
      };
      await registerLoad(payload);
      toast.success(`Load ${data.load_id} registered`);
      reset();
      navigate('/shipper');
    } catch (err) {
      toast.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (warehousesLoading) {
    return <div className="p-8 text-center">Loading warehouse data...</div>;
  }

  if (warehouseNodes.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div><h2 className="text-2xl font-bold text-primary">Register Load</h2></div>
        <div className="card p-6 text-center text-text-light">
          <p className="text-lg">No warehouses available.</p>
          <p className="text-sm mt-2">Please register a warehouse first before creating a load.</p>
          <button
            onClick={() => window.location.href = '/warehouse/details'}
            className="btn-primary mt-4"
          >
            Go to Warehouse Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h2 className="text-2xl font-bold text-primary">Register Load</h2><p className="text-text-light text-sm">Add a new shipment</p></div>
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Load ID *</label>
            <input className="input-field" {...register('load_id', { required: 'Required' })} />
            {errors.load_id && <p className="text-red-500 text-xs mt-1">{errors.load_id.message}</p>}
          </div>
          <div>
            <label className="label">Type *</label>
            <select className="input-field" {...register('type', { required: 'Required' })}>
              <option value="">Select</option>
              <option value="general">General</option>
              <option value="fragile">Fragile</option>
              <option value="perishable">Perishable</option>
              <option value="hazardous">Hazardous</option>
            </select>
            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
          </div>
          <div>
            <label className="label">Weight (tons) *</label>
            <input type="number" step="0.1" className="input-field" {...register('weight', { required: 'Required', min: 0.1, max: 100 })} />
            {errors.weight && <p className="text-red-500 text-xs mt-1">Valid weight required</p>}
          </div>
          <div>
            <label className="label">Rate (₹/km) *</label>
            <input type="number" step="0.5" className="input-field" {...register('rate', { required: 'Required', min: 0, max: 200 })} />
            {errors.rate && <p className="text-red-500 text-xs mt-1">Rate 0-200</p>}
          </div>

          {/* Pickup Node – only warehouse nodes */}
          <div>
            <label className="label">Pickup Node (Warehouse) *</label>
            <select className="input-field" {...register('pickup_node', { required: 'Required' })}>
              <option value="">Select a warehouse node</option>
              {warehouseNodes.map(node => (
                <option key={node} value={node}>{node}</option>
              ))}
            </select>
            {errors.pickup_node && <p className="text-red-500 text-xs mt-1">{errors.pickup_node.message}</p>}
          </div>

          {/* Drop Node – only warehouse nodes */}
          <div>
            <label className="label">Drop Node (Warehouse) *</label>
            <select className="input-field" {...register('drop_node', { required: 'Required' })}>
              <option value="">Select a warehouse node</option>
              {warehouseNodes.map(node => (
                <option key={node} value={node}>{node}</option>
              ))}
            </select>
            {errors.drop_node && <p className="text-red-500 text-xs mt-1">{errors.drop_node.message}</p>}
          </div>

          <div>
            <label className="label">Pickup Time *</label>
            <input type="time" className="input-field" {...register('pickup_time', { required: 'Required' })} />
            {errors.pickup_time && <p className="text-red-500 text-xs mt-1">{errors.pickup_time.message}</p>}
          </div>
          <div>
            <label className="label">Delivery Deadline *</label>
            <input type="time" className="input-field" {...register('deadline', { required: 'Required' })} />
            {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline.message}</p>}
          </div>
          <div>
            <label className="label">Delay Limit (min)</label>
            <input type="number" className="input-field" defaultValue={30} {...register('delay_limit')} />
          </div>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading || warehouseNodes.length === 0}>
          <Save size={16} /> {loading ? 'Registering...' : 'Register Load'}
        </button>
      </form>
    </div>
  );
}