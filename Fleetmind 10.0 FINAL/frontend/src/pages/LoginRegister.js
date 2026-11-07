import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Truck,
  Package,
  Warehouse,
  Shield,
  ArrowLeft,
  Key,
  Lock,
  User,
  Zap,
} from 'lucide-react';
import { loginUser, registerUser } from '../services/auth';
import Logistics3DCanvas from '../components/landing/Logistics3DCanvas';

const roleConfig = {
  driver: {
    title: 'Driver Portal',
    code: 'AGENT.DRV',
    icon: Truck,
    themeColor: 'blue',
    accentBorder: 'border-blue-500/50',
    accentText: 'text-blue-400',
    accentBg: 'bg-blue-600',
    demoId: 'dr1',
  },
  shipper: {
    title: 'Shipper Portal',
    code: 'AGENT.SHP',
    icon: Package,
    themeColor: 'emerald',
    accentBorder: 'border-emerald-500/50',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-600',
    demoId: 'sh1',
  },
  warehouse: {
    title: 'Warehouse Portal',
    code: 'AGENT.WHS',
    icon: Warehouse,
    themeColor: 'amber',
    accentBorder: 'border-amber-500/50',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-600',
    demoId: 'wh1',
  },
  admin: {
    title: 'Admin Console',
    code: 'AGENT.ADM',
    icon: Shield,
    themeColor: 'purple',
    accentBorder: 'border-purple-500/50',
    accentText: 'text-purple-400',
    accentBg: 'bg-purple-600',
    demoId: 'a1',
  },
};

export default function LoginRegister() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const config = roleConfig[role];

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        <p className="text-red-400 font-mono mb-4">Invalid role specified.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-mono text-slate-300 hover:text-white"
        >
          Return to Portal Selection
        </button>
      </div>
    );
  }

  const Icon = config.icon;

  const handleAutofillDemo = () => {
    setValue('id', config.demoId);
    setValue('password', '1234');
    toast.success(`Demo credentials applied (${config.demoId})`);
  };

  const onSubmit = async (data) => {
    try {
      if (isLogin) {
        await loginUser(role, data.id, data.password);
        toast.success(`Authenticated as ${data.id}`);
        navigate(`/${role}`);
      } else {
        if (data.password !== data.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }
        await registerUser(role, data.id, data.password);
        toast.success('Registration successful! Please sign in.');
        setIsLogin(true);
      }
    } catch (err) {
      toast.error(err.message || 'Authentication error');
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-blue-500 selection:text-white overflow-hidden">
      {/* 3D Background Canvas */}
      <Logistics3DCanvas />

      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Back to Hub Nav */}
      <div className="relative z-20 w-full max-w-md mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white hover:border-slate-700 transition-all shadow-md backdrop-blur-md"
        >
          <ArrowLeft size={14} />
          <span>Hub Selection</span>
        </button>

        <button
          type="button"
          onClick={handleAutofillDemo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-mono transition-all shadow-md backdrop-blur-md"
        >
          <Key size={13} />
          <span>Autofill Demo ({config.demoId})</span>
        </button>
      </div>

      {/* Main Glassmorphic Login Container */}
      <div className="relative z-10 max-w-md w-full bg-slate-900/90 rounded-2xl shadow-2xl border border-slate-800/90 backdrop-blur-xl overflow-hidden">
        {/* Stitch corner crosshairs */}
        <span className="absolute top-2.5 left-3 text-slate-700 font-mono text-xs select-none">+</span>
        <span className="absolute top-2.5 right-3 text-slate-700 font-mono text-xs select-none">+</span>
        <span className="absolute bottom-2.5 left-3 text-slate-700 font-mono text-xs select-none">+</span>
        <span className="absolute bottom-2.5 right-3 text-slate-700 font-mono text-xs select-none">+</span>

        {/* Card Header */}
        <div className="px-7 pt-7 pb-5 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl bg-slate-800/80 border ${config.accentBorder} flex items-center justify-center ${config.accentText} shadow-inner`}>
                <Icon size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">{config.title}</h2>
                <p className="text-xs font-mono text-slate-400 tracking-wider uppercase mt-0.5">{config.code}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono border border-slate-700/60 bg-slate-800/50 text-slate-300">
              {isLogin ? 'Sign In' : 'Register'}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-7 space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User size={13} className="text-slate-400" />
              <span>Operator ID</span>
            </label>
            <input
              placeholder={`e.g. ${config.demoId}`}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              {...register('id', { required: 'Operator ID is required' })}
            />
            {errors.id && <p className="text-red-400 font-mono text-xs mt-1.5">{errors.id.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Lock size={13} className="text-slate-400" />
              <span>Access Password</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <p className="text-red-400 font-mono text-xs mt-1.5">{errors.password.message}</p>}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock size={13} className="text-slate-400" />
                <span>Confirm Access Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                {...register('confirmPassword', { required: 'Confirm password is required' })}
              />
              {errors.confirmPassword && <p className="text-red-400 font-mono text-xs mt-1.5">{errors.confirmPassword.message}</p>}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold font-mono text-sm tracking-wide text-white transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${config.accentBg} hover:brightness-110 active:scale-[0.99]`}
            >
              <Zap size={16} />
              <span>{isLogin ? 'Authenticate & Enter' : 'Register Operator'}</span>
            </button>
          </div>
        </form>

        {/* Toggle Mode Footer */}
        <div className="px-7 pb-6 pt-1 text-center border-t border-slate-800/60">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-mono text-slate-400 hover:text-blue-400 transition-colors"
          >
            {isLogin ? 'New operator? Switch to Registration →' : 'Existing operator? Switch to Sign In →'}
          </button>
        </div>
      </div>
    </div>
  );
}
