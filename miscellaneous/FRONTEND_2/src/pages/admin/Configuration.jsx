import { useState, useEffect } from 'react';
import { adminGetConfig, adminUpdateConfig } from '../../services/api';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Configuration() {
  const [config, setConfig] = useState({ min_rate: 0, max_rate: 200, detour_threshold_km: 20, nearby_radius_km: 50, default_speed_kmph: 50, deadline_buffer_min: 15 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminGetConfig();
        setConfig(res.data);
      } catch (err) { toast.error('Failed to load config'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleChange = (key, value) => setConfig({ ...config, [key]: parseFloat(value) });

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminUpdateConfig(config);
      toast.success('Configuration saved');
    } catch (err) { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h2 className="text-2xl font-bold text-primary">System Configuration</h2><p className="text-text-light text-sm">Global parameters</p></div>
      <div className="card p-6 space-y-4">
        <div><label className="label">Min Rate (₹/km)</label><input type="number" className="input-field" value={config.min_rate} onChange={e => handleChange('min_rate', e.target.value)} /></div>
        <div><label className="label">Max Rate (₹/km)</label><input type="number" className="input-field" value={config.max_rate} onChange={e => handleChange('max_rate', e.target.value)} /></div>
        <div><label className="label">Detour Threshold (km)</label><input type="number" className="input-field" value={config.detour_threshold_km} onChange={e => handleChange('detour_threshold_km', e.target.value)} /></div>
        <div><label className="label">Nearby Radius (km)</label><input type="number" className="input-field" value={config.nearby_radius_km} onChange={e => handleChange('nearby_radius_km', e.target.value)} /></div>
        <div><label className="label">Default Speed (km/h)</label><input type="number" className="input-field" value={config.default_speed_kmph} onChange={e => handleChange('default_speed_kmph', e.target.value)} /></div>
        <div><label className="label">Deadline Buffer (min)</label><input type="number" className="input-field" value={config.deadline_buffer_min} onChange={e => handleChange('deadline_buffer_min', e.target.value)} /></div>
        <div className="text-sm text-text-light bg-gray-50 p-3 rounded">Dock count: 5 (fixed) | Session timer: disabled</div>
        <button onClick={handleSave} className="btn-primary w-full" disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}</button>
      </div>
    </div>
  );
}