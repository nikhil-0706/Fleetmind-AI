import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerLoad } from '../../services/api';
import { getCurrentUser } from '../../services/auth';

export default function RegisterLoad() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const shipperId = user?.id;

  const onSubmit = async (data) => {
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h2 className="text-2xl font-bold text-primary">Register Load</h2><p className="text-text-light text-sm">Add a new shipment</p></div>
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Load ID *</label><input className="input-field" {...register('load_id', { required: 'Required' })} />{errors.load_id && <p className="text-red-500 text-xs mt-1">{errors.load_id.message}</p>}</div>
          <div><label className="label">Type *</label><select className="input-field" {...register('type', { required: 'Required' })}><option value="">Select</option><option value="general">General</option><option value="fragile">Fragile</option><option value="perishable">Perishable</option><option value="hazardous">Hazardous</option></select>{errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}</div>
          <div><label className="label">Weight (tons) *</label><input type="number" step="0.1" className="input-field" {...register('weight', { required: 'Required', min: 0.1, max: 100 })} />{errors.weight && <p className="text-red-500 text-xs mt-1">Valid weight required</p>}</div>
          <div><label className="label">Rate (₹/km) *</label><input type="number" step="0.5" className="input-field" {...register('rate', { required: 'Required', min: 0, max: 200 })} />{errors.rate && <p className="text-red-500 text-xs mt-1">Rate 0-200</p>}</div>
          <div><label className="label">Pickup Node *</label><input className="input-field" {...register('pickup_node', { required: 'Required' })} />{errors.pickup_node && <p className="text-red-500 text-xs mt-1">{errors.pickup_node.message}</p>}</div>
          <div><label className="label">Drop Node *</label><input className="input-field" {...register('drop_node', { required: 'Required' })} />{errors.drop_node && <p className="text-red-500 text-xs mt-1">{errors.drop_node.message}</p>}</div>
          <div><label className="label">Pickup Time *</label><input type="time" className="input-field" {...register('pickup_time', { required: 'Required' })} />{errors.pickup_time && <p className="text-red-500 text-xs mt-1">{errors.pickup_time.message}</p>}</div>
          <div><label className="label">Delivery Deadline *</label><input type="time" className="input-field" {...register('deadline', { required: 'Required' })} />{errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline.message}</p>}</div>
          <div><label className="label">Delay Limit (min)</label><input type="number" className="input-field" defaultValue={30} {...register('delay_limit')} /></div>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}><Save size={16} /> {loading ? 'Registering...' : 'Register Load'}</button>
      </form>
    </div>
  );
}