import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Package,
  Warehouse,
  Shield,
  Radio,
  Cpu,
  TrendingDown,
  Navigation,
  Key,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Zap,
} from 'lucide-react';
import Logistics3DCanvas from '../components/landing/Logistics3DCanvas';
import TiltCard from '../components/landing/TiltCard';

const roles = [
  {
    id: 'driver',
    name: 'Driver Portal',
    code: 'AGENT.DRV',
    icon: Truck,
    description: 'Autonomous load proposals, en-route intermediate pickups, smart multi-hop route planner, and live mileage payout tracking.',
    tags: ['Smart Routing', 'Intermediate Pickups', 'Live Payouts'],
    themeColor: 'blue',
    iconBg: 'bg-blue-500/10',
    iconBorder: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    textColor: 'text-blue-400',
    glowBg: 'bg-blue-600',
    demoUser: 'dr1',
  },
  {
    id: 'shipper',
    name: 'Shipper Portal',
    code: 'AGENT.SHP',
    icon: Package,
    description: 'Instant multi-stop freight registration, autonomous carrier matching, cost-curve analytics, and real-time cargo telemetry.',
    tags: ['Automated Dispatch', 'Cost Analytics', 'Cargo Telemetry'],
    themeColor: 'emerald',
    iconBg: 'bg-emerald-500/10',
    iconBorder: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    textColor: 'text-emerald-400',
    glowBg: 'bg-emerald-600',
    demoUser: 'sh1',
  },
  {
    id: 'warehouse',
    name: 'Warehouse Portal',
    code: 'AGENT.WHS',
    icon: Warehouse,
    description: '5-bay intelligent dock queue allocation, truck arrival scheduling, terminal congestion resolution, and cargo check-in.',
    tags: ['5-Bay Dock Matrix', 'Terminal Flow', 'Live Check-In'],
    themeColor: 'amber',
    iconBg: 'bg-amber-500/10',
    iconBorder: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    textColor: 'text-amber-400',
    glowBg: 'bg-amber-600',
    demoUser: 'wh1',
  },
  {
    id: 'admin',
    name: 'Administrator',
    code: 'AGENT.ADM',
    icon: Shield,
    description: 'Central coordinator console, live vector canvas telemetries, pair optimization heuristics, and granular system state auditing.',
    tags: ['Multi-Agent State', 'Network Canvas', 'System Logs'],
    themeColor: 'purple',
    iconBg: 'bg-purple-500/10',
    iconBorder: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    textColor: 'text-purple-400',
    glowBg: 'bg-purple-600',
    demoUser: 'a1',
  },
];

const telemetryStats = [
  { label: 'Network Throughput', value: '100%', detail: 'In-Memory Engine', icon: Cpu },
  { label: 'Deadhead Reduction', value: '-38.4%', detail: 'Backhaul Pairing', icon: TrendingDown },
  { label: 'Terminal Scheduling', value: '5 Bays', detail: 'Dynamic Allocation', icon: Layers },
  { label: 'Dispatch Latency', value: '< 45ms', detail: 'Sub-second Graph Routing', icon: Zap },
];

export default function RoleSelection() {
  const navigate = useNavigate();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [copiedUser, setCopiedUser] = useState(null);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedUser(text);
    setTimeout(() => setCopiedUser(null), 2000);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-blue-500 selection:text-white">
      {/* 3D Spatial Logistics Network Canvas Background */}
      <Logistics3DCanvas />

      {/* Cyber Grid Background Pattern & Glow Gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[350px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Navigation size={20} className="transform rotate-45" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          </div>
          <div>
            <h1 className="font-mono font-bold tracking-tight text-lg text-white flex items-center gap-2">
              FLEETMIND <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 font-sans font-semibold">10.0</span>
            </h1>
            <p className="text-[11px] font-mono text-slate-400 tracking-wider uppercase">Logistics Intelligence Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDemoModal(!showDemoModal)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-blue-500/60 text-xs font-mono text-slate-300 hover:text-white transition-all shadow-md"
          >
            <Key size={14} className="text-amber-400" />
            <span>Demo Accounts</span>
          </button>
          <a
            href="https://github.com/nikhil-0706/Fleetmind-AI"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-slate-500 text-xs font-mono text-slate-300 hover:text-white transition-all shadow-md"
          >
            <span>GitHub</span>
            <ExternalLink size={13} className="text-slate-400" />
          </a>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        {/* Top Status & Hero Typography */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/70 shadow-inner mb-6 backdrop-blur-md">
            <Radio size={14} className="text-emerald-400 animate-pulse" />
            <span className="text-xs font-mono tracking-wider text-slate-300 uppercase">
              Autonomous Multi-Agent Freight Network
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-xs font-mono text-emerald-400">All Nodes Active</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Next-Generation <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300">
              Freight Intelligence
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Select your operational role below to access dedicated real-time portals, dynamic multi-hop routing, and live canvas telemetry.
          </p>
        </div>

        {/* 3D Tilt Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role) => (
            <TiltCard
              key={role.id}
              role={role}
              onSelect={(roleId) => navigate(`/login/${roleId}`)}
            />
          ))}
        </div>

        {/* Telemetry Stats Bar */}
        <div className="mt-14 p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md grid grid-cols-2 lg:grid-cols-4 gap-4">
          {telemetryStats.map((stat, i) => {
            const StatIcon = stat.icon;
            return (
              <div key={i} className="flex items-center gap-3.5 px-3 py-1.5">
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-blue-400">
                  <StatIcon size={18} />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold font-mono text-white">{stat.value}</span>
                    <span className="text-[11px] font-mono text-slate-400">{stat.detail}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-3">
        <div>
          FleetMind 10.0 • Monolithic Fast-Path Logistics Engine (FastAPI + React 18)
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Undirected Highway Topology</span>
          <span>•</span>
          <span>In-Memory Graph Telemetry</span>
        </div>
      </footer>

      {/* Demo Credentials Drawer / Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key size={18} className="text-amber-400" />
                <h3 className="font-bold text-white text-base">Quick Demo Accounts</h3>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="text-slate-400 hover:text-white text-sm font-mono px-2 py-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              All demo user passwords are <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">1234</code>. Click any user to copy or jump to the portal:
            </p>
            <div className="space-y-2.5">
              {roles.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-slate-500 transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>{r.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">({r.code})</span>
                    </div>
                    <div className="text-xs font-mono text-amber-400/90 mt-0.5">
                      ID: <span className="font-bold">{r.demoUser}</span> | Pass: 1234
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(r.demoUser)}
                      title="Copy User ID"
                      className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"
                    >
                      {copiedUser === r.demoUser ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => {
                        setShowDemoModal(false);
                        navigate(`/login/${r.id}`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                    >
                      Login →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
