import { useState, useMemo } from "react";
import { AppProvider, useApp } from "./store";
import { Card, SectionHeader, Pill, ProgressBar } from "./components/ui";
import {
  PackageIcon,
  TruckIcon,
  RouteIcon,
  LayersIcon,
  ActivityIcon,
  SparkleIcon,
  NetworkIcon,
  DollarIcon,
  ClockIcon,
  MapPinIcon,
  CheckIcon,
  AlertIcon,
} from "./components/Icons";
import { LoadCreator } from "./components/LoadCreator";
import { CargoMatcher } from "./components/CargoMatcher";
import { RouteOptimizer } from "./components/RouteOptimizer";
import { LoadConsolidator } from "./components/LoadConsolidator";
import { LifecycleTracker } from "./components/LifecycleTracker";
import { formatCurrency, formatRelative } from "./lib/logistics";

type Tab = "dashboard" | "create" | "match" | "route" | "consolidate" | "lifecycle";

const TABS: { id: Tab; label: string; icon: React.ReactNode; subtitle: string }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <SparkleIcon className="h-4 w-4" />,
    subtitle: "Network overview",
  },
  {
    id: "create",
    label: "Load Creation",
    icon: <PackageIcon className="h-4 w-4" />,
    subtitle: "Book new shipments",
  },
  {
    id: "match",
    label: "Cargo Matching",
    icon: <TruckIcon className="h-4 w-4" />,
    subtitle: "Carrier & vehicle assignment",
  },
  {
    id: "route",
    label: "Route Optimization",
    icon: <RouteIcon className="h-4 w-4" />,
    subtitle: "Intermediate hub routing",
  },
  {
    id: "consolidate",
    label: "Consolidation",
    icon: <LayersIcon className="h-4 w-4" />,
    subtitle: "Multi-load packing",
  },
  {
    id: "lifecycle",
    label: "Lifecycle",
    icon: <ActivityIcon className="h-4 w-4" />,
    subtitle: "Status & audit trail",
  },
];

function Shell() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <Header />
      <Nav tab={tab} setTab={setTab} />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 space-y-4">
        {tab === "dashboard" && <Dashboard onJump={setTab} />}
        {tab === "create" && (
          <div className="space-y-4">
            <FeatureHeader
              title="Load Creation"
              description="Capture new shipment requests with comprehensive validation. Hazmat, refrigerated, and special-handling flags drive downstream matching."
              icon={<PackageIcon className="h-6 w-6" />}
            />
            <LoadCreator />
            <RecentLoads />
          </div>
        )}
        {tab === "match" && (
          <div className="space-y-4">
            <FeatureHeader
              title="Cargo Matching Engine"
              description="Score-based assignment of loads to carriers and vehicles. Considers capacity, specialty certifications, geographic proximity, carrier rating, and on-time history."
              icon={<TruckIcon className="h-6 w-6" />}
            />
            <CargoMatcher />
          </div>
        )}
        {tab === "route" && (
          <div className="space-y-4">
            <FeatureHeader
              title="Intermediate Shipment Optimization"
              description="Analyze routes through intermediate hubs to reduce cost or transit time. Hub capabilities (hazmat, reefer) are factored into eligibility."
              icon={<RouteIcon className="h-6 w-6" />}
            />
            <RouteOptimizer />
          </div>
        )}
        {tab === "consolidate" && (
          <div className="space-y-4">
            <FeatureHeader
              title="Dynamic Load Consolidation"
              description="Pack multiple pending loads into shared vehicles using 3D bin-packing. Respects specialty requirements, origin regions, and capacity constraints."
              icon={<LayersIcon className="h-6 w-6" />}
            />
            <LoadConsolidator />
          </div>
        )}
        {tab === "lifecycle" && (
          <div className="space-y-4">
            <FeatureHeader
              title="Load Lifecycle Tracking"
              description="Track every load from draft to delivery with a complete audit trail. Advance statuses, add notes, and cancel with full visibility."
              icon={<ActivityIcon className="h-6 w-6" />}
            />
            <LifecycleTracker />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <NetworkIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-slate-900">
              Cargo Orchestrator
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
              Load Management Platform
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live network · 6 hubs · 5 carriers · 8 vehicles
          </div>
        </div>
      </div>
    </header>
  );
}

function Nav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <nav className="border-b border-slate-200/70 bg-white/60 backdrop-blur-sm sticky top-[57px] z-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex gap-1 overflow-x-auto py-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                tab === t.id
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <span
                className={
                  tab === t.id ? "text-indigo-700" : "text-slate-500"
                }
              >
                {t.icon}
              </span>
              <span>{t.label}</span>
              <span
                className={`hidden sm:inline text-[10px] font-normal ${
                  tab === t.id ? "text-indigo-500" : "text-slate-400"
                }`}
              >
                · {t.subtitle}
              </span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

function FeatureHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-5 bg-gradient-to-br from-indigo-50/60 via-white to-violet-50/40 border-indigo-100/60">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
          {icon}
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">{description}</p>
        </div>
      </div>
    </Card>
  );
}

function Dashboard({ onJump }: { onJump: (t: Tab) => void }) {
  const { loads, vehicles, carriers, hubs, groups, events } = useApp();

  const stats = useMemo(() => {
    const inTransit = loads.filter((l) => l.status === "in_transit").length;
    const pending = loads.filter(
      (l) => l.status === "pending_match" || l.status === "draft"
    ).length;
    const delivered = loads.filter((l) => l.status === "delivered").length;
    const totalValue = loads.reduce((s, l) => s + l.value, 0);
    const utilization =
      vehicles.reduce((s, v) => s + v.capacityKg, 0) > 0
        ? loads
            .filter((l) => l.status === "in_transit" || l.status === "matched")
            .reduce((s, l) => s + l.weight, 0) /
          vehicles.reduce((s, v) => s + v.capacityKg, 0)
        : 0;
    return { inTransit, pending, delivered, totalValue, utilization };
  }, [loads, vehicles]);

  const recentEvents = events.slice(0, 6);

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-900 text-white border-0 overflow-hidden relative">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 20% 30%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 70%, #a855f7 0%, transparent 50%)" }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Pill tone="violet" size="xs">
              <SparkleIcon className="h-3 w-3" /> Orchestration Engine
            </Pill>
            <Pill tone="success" size="xs">Operational</Pill>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to the Cargo Orchestrator
          </h1>
          <p className="text-indigo-100 mt-2 max-w-2xl text-sm">
            A unified platform for end-to-end load management — from booking
            and carrier matching, through route optimization and load
            consolidation, to real-time lifecycle tracking.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <DashButton onClick={() => onJump("create")}>
              <PackageIcon className="h-4 w-4" /> Create a load
            </DashButton>
            <DashButton variant="secondary" onClick={() => onJump("match")}>
              <TruckIcon className="h-4 w-4" /> Match carriers
            </DashButton>
            <DashButton variant="secondary" onClick={() => onJump("lifecycle")}>
              <ActivityIcon className="h-4 w-4" /> Track shipments
            </DashButton>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI
          label="Total Loads"
          value={loads.length}
          icon={<PackageIcon className="h-4 w-4" />}
          tone="info"
        />
        <KPI
          label="In Transit"
          value={stats.inTransit}
          icon={<TruckIcon className="h-4 w-4" />}
          tone="info"
        />
        <KPI
          label="Pending Match"
          value={stats.pending}
          icon={<ClockIcon className="h-4 w-4" />}
          tone="warn"
        />
        <KPI
          label="Delivered"
          value={stats.delivered}
          icon={<CheckIcon className="h-4 w-4" />}
          tone="success"
        />
        <KPI
          label="Cargo Value"
          value={formatCurrency(stats.totalValue)}
          icon={<DollarIcon className="h-4 w-4" />}
          tone="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <SectionHeader
            title="Module Status"
            subtitle="Click a module to navigate"
            icon={<SparkleIcon className="h-5 w-5" />}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <ModuleCard
              title="Load Creation"
              description={`${stats.pending} pending · ${loads.length} total`}
              icon={<PackageIcon className="h-4 w-4" />}
              tone="info"
              onClick={() => onJump("create")}
            />
            <ModuleCard
              title="Cargo Matching"
              description={`${carriers.length} carriers · ${vehicles.length} vehicles`}
              icon={<TruckIcon className="h-4 w-4" />}
              tone="violet"
              onClick={() => onJump("match")}
            />
            <ModuleCard
              title="Route Optimization"
              description={`${hubs.length} hubs analyzed`}
              icon={<RouteIcon className="h-4 w-4" />}
              tone="success"
              onClick={() => onJump("route")}
            />
            <ModuleCard
              title="Load Consolidation"
              description={`${groups.length} active groups`}
              icon={<LayersIcon className="h-4 w-4" />}
              tone="warn"
              onClick={() => onJump("consolidate")}
            />
            <ModuleCard
              title="Lifecycle Tracking"
              description={`${events.length} lifecycle events`}
              icon={<ActivityIcon className="h-4 w-4" />}
              tone="info"
              onClick={() => onJump("lifecycle")}
            />
            <ModuleCard
              title="Network Health"
              description={`${(stats.utilization * 100).toFixed(0)}% fleet utilization`}
              icon={<NetworkIcon className="h-4 w-4" />}
              tone="success"
              onClick={() => onJump("dashboard")}
            >
              <div className="mt-2">
                <ProgressBar value={stats.utilization} tone="violet" size="sm" />
              </div>
            </ModuleCard>
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader
            title="Recent Activity"
            subtitle="Live event stream"
            icon={<ClockIcon className="h-5 w-5" />}
          />
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {recentEvents.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-4">
                No events yet
              </div>
            )}
            {recentEvents.map((e) => {
              const load = loads.find((l) => l.id === e.loadId);
              return (
                <div
                  key={e.id}
                  className="rounded-lg border border-slate-200/70 bg-white px-2.5 py-2"
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[10px] font-mono font-semibold text-slate-700">
                      {load?.reference ?? e.loadId}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {formatRelative(e.timestamp)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 line-clamp-2">
                    {e.note}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <MapPinIcon className="h-2.5 w-2.5" /> {e.location}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionHeader
          title="Top Carriers"
          subtitle="Ranked by rating, on-time %, and fleet size"
          icon={<TruckIcon className="h-5 w-5" />}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {[...carriers]
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6)
            .map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-slate-200/70 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {c.name}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {c.fleetSize.toLocaleString()} vehicles
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-600">
                    <span className="text-sm font-bold">{c.rating.toFixed(1)}</span>
                    <span className="text-[10px]">★</span>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <div className="text-slate-500">On-time</div>
                    <div className="font-semibold text-slate-800">
                      {(c.onTimeRate * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Safety</div>
                    <div className="font-semibold text-slate-800">
                      {c.safetyScore}/100
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.hazmatCertified && (
                    <Pill tone="warn" size="xs">
                      <AlertIcon className="h-2.5 w-2.5" /> Hazmat
                    </Pill>
                  )}
                  {c.refrigeratedCertified && (
                    <Pill tone="info" size="xs">Reefer</Pill>
                  )}
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}

function KPI({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone: "info" | "success" | "warn" | "violet";
}) {
  const tones: Record<string, string> = {
    info: "from-sky-500/10 to-cyan-500/10 text-sky-700 border-sky-200/60",
    success: "from-emerald-500/10 to-green-500/10 text-emerald-700 border-emerald-200/60",
    warn: "from-amber-500/10 to-orange-500/10 text-amber-700 border-amber-200/60",
    violet: "from-violet-500/10 to-purple-500/10 text-violet-700 border-violet-200/60",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${tones[tone]} p-3`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
          {label}
        </span>
        <span className="opacity-70">{icon}</span>
      </div>
      <div className="text-xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function ModuleCard({
  title,
  description,
  icon,
  tone,
  onClick,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  tone: "info" | "success" | "warn" | "violet";
  onClick: () => void;
  children?: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    info: "from-sky-50 to-white border-sky-200/60 hover:border-sky-400",
    success: "from-emerald-50 to-white border-emerald-200/60 hover:border-emerald-400",
    warn: "from-amber-50 to-white border-amber-200/60 hover:border-amber-400",
    violet: "from-violet-50 to-white border-violet-200/60 hover:border-violet-400",
  };
  const iconTones: Record<string, string> = {
    info: "bg-sky-100 text-sky-700",
    success: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border bg-gradient-to-br ${tones[tone]} p-3 transition-colors`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconTones[tone]}`}>
          {icon}
        </span>
        <span className="text-sm font-semibold text-slate-900">{title}</span>
      </div>
      <div className="text-xs text-slate-600">{description}</div>
      {children}
    </button>
  );
}

function RecentLoads() {
  const { loads } = useApp();
  const recent = loads.slice(0, 5);
  if (recent.length === 0) return null;
  return (
    <Card className="p-5">
      <SectionHeader
        title="Recently Created"
        subtitle="Last 5 loads added to the system"
        icon={<PackageIcon className="h-5 w-5" />}
      />
      <div className="space-y-1.5">
        {recent.map((l) => (
          <div
            key={l.id}
            className="rounded-lg border border-slate-200/70 bg-white px-3 py-2 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-semibold text-slate-700">
                {l.reference}
              </span>
              <span className="text-xs text-slate-600">
                {l.shipper} → {l.consignee}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">
                {l.weight.toLocaleString()} kg
              </span>
              <Pill tone="info" size="xs">
                {l.status.replace("_", " ")}
              </Pill>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DashButton({
  children,
  onClick,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
}) {
  if (variant === "secondary") {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur text-white text-sm font-medium px-3 py-2 border border-white/20 transition-colors"
      >
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white text-indigo-700 hover:bg-indigo-50 text-sm font-semibold px-3 py-2 transition-colors shadow-lg shadow-indigo-900/30"
    >
      {children}
    </button>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/60 backdrop-blur-sm mt-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Cargo Orchestrator · Load Management Platform
        </div>
        <div className="flex items-center gap-3">
          <span>Modules: 5</span>
          <span>·</span>
          <span>Realtime state</span>
          <span>·</span>
          <span>Last sync just now</span>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
