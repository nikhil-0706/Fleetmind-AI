import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import { getWarehouseDetails, updateWarehouseDetails, registerWarehouse } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import toast from 'react-hot-toast';

export default function WarehouseDetails() {
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const user = getCurrentUser();
  const warehouseId = user?.id;

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getWarehouseDetails(warehouseId);
        setWarehouse(res.data);
        reset({ compatible_load_types: res.data.compatible_load_types?.join(',') || '' });
      } catch (err) {
        if (err.response?.status === 404) setWarehouse(null);
        else toast.error('Failed to load warehouse');
      } finally { setLoading(false); }
    };
    fetch();
  }, [warehouseId, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const compatible = data.compatible_load_types.split(',').map(s => s.trim()).filter(Boolean);
      if (warehouse) {
        await updateWarehouseDetails(warehouseId, compatible);
        toast.success('Warehouse updated');
      } else {
        // Register new warehouse
        await registerWarehouse({
          warehouse_id: warehouseId,
          node_id: data.node_id,
          compatible_load_types: compatible,
          status: 'ACTIVE'
        });
        toast.success('Warehouse registered');
      }
      window.location.reload();
    } catch (err) {
      toast.error('Operation failed');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h2 className="text-2xl font-bold text-primary">Warehouse Details</h2><p className="text-text-light text-sm">{warehouse ? 'Edit warehouse information' : 'Register your warehouse'}</p></div>
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        {!warehouse && (
          <div><label className="label">Node ID *</label><input className="input-field" {...register('node_id', { required: 'Required' })} />{errors.node_id && <p className="text-red-500 text-xs mt-1">{errors.node_id.message}</p>}</div>
        )}
        <div><label className="label">Compatible Load Types (comma separated)</label><input className="input-field" placeholder="e.g., general, fragile" {...register('compatible_load_types')} /></div>
        <div className="text-sm text-text-light bg-gray-50 p-3 rounded">Docks: 5 (fixed)</div>
        <button type="submit" className="btn-primary w-full" disabled={saving}><Save size={16} /> {saving ? 'Saving...' : (warehouse ? 'Update' : 'Register')}</button>
      </form>
    </div>
  );
}