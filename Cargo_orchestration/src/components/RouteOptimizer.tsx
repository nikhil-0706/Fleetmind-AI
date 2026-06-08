import { useState, useMemo } from "react";
import { useApp } from "../store";
import { Card, SectionHeader, Pill, Button } from "./ui";
import { RouteIcon, MapPinIcon, ClockIcon, DollarIcon, ArrowRightIcon, NetworkIcon, SparkleIcon } from "./Icons";
import { optimizeIntermediateRoute, formatCurrency, distanceKm, formatRelative } from "../lib/logistics";

export function RouteOptimizer() {
  const { loads, hubs, advanceLoad, updateLoad } = useApp();
  const eligible = loads.filter(
    (l) =>
      (l.status === "matched" || l.status === "in_transit") &&
      l.origin.region !== l.destination.region
  );
  const [selectedId, setSelectedId] = useState<string>(eligible[0]?.id ?? "");
  const selected = eligible.find((l) => l.id === selectedId) ?? eligible[0];

  const route = useMemo(() => {
    if (!selected) return null;
    return optimizeIntermediateRoute(selected, hubs);
  }, [selected, hubs]);

  if (!selected || !route) {
    return (
      <Card className="p-5">
        <SectionHeader
          title="Intermediate Shipment Optimization"
          subtitle="Hub routing & cost reduction analysis"
          icon={<RouteIcon className="h-5 w-5" />}
        />
        <div className="text-sm text-slate-500 py-8 text-center">
          No active shipments across multiple regions. Match loads to carriers to enable route optimization.
        </div>
      </Card>
    );
  }

  const accept = () => {
    if (!route.viaHub) return;
    // Add a note to the load and trigger at_hub status
    updateLoad(selected.id, {
      notes: `${selected.notes ? selected.notes + " | " : ""}Routed via ${route.viaHub.hub.name}`,
    });
    advanceLoad(selected.id, `Re-routed via ${route.viaHub.hub.name} (saving ${formatCurrency(route.savings)})`, "Route Optimizer");
  };

  return (
    <Card className="p-5">
      <SectionHeader
        title="Intermediate Shipment Optimization"
        subtitle="Identify hub-based routing for cost & time savings"
        icon={<RouteIcon className="h-5 w-5" />}
        action={
          <Pill tone="violet" size="xs">
            <SparkleIcon className="h-3 w-3" /> 6 hubs analyzed
          </Pill>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
            Cross-region loads ({eligible.length})
          </div>
          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {eligible.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedId(l.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selected.id === l.id
                    ? "border-indigo-300 bg-indigo-50/60"
                    : "border-slate-200/70 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-semibold text-slate-700">
                    {l.reference}
                  </span>
                  <Pill tone="info" size="xs">{l.status.replace("_", " ")}</Pill>
                </div>
                <div className="text-xs text-slate-600 truncate">
                  {l.origin.city} → {l.destination.city}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {distanceKm(l.origin, l.destination).toFixed(0)} km · {l.weight.toLocaleString()} kg
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-3">
          <RouteMap
            origin={selected.origin}
            destination={selected.destination}
            viaHub={route.viaHub?.hub}
            recommendation={route.recommendation}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <RouteOption
              title="Direct Route"
              distanceKm={route.direct.distanceKm}
              cost={route.direct.cost}
              hours={route.direct.hours}
              selected={route.recommendation === "direct"}
              icon={<ArrowRightIcon className="h-4 w-4" />}
            />
            {route.viaHub && (
              <RouteOption
                title={`Via ${route.viaHub.hub.name}`}
                distanceKm={route.viaHub.distanceKm}
                cost={route.viaHub.cost}
                hours={route.viaHub.hours}
                selected={route.recommendation === "via_hub"}
                icon={<NetworkIcon className="h-4 w-4" />}
                savings={route.savings}
              />
            )}
          </div>

          {route.viaHub && route.recommendation === "via_hub" && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                  <SparkleIcon className="h-3.5 w-3.5" />
                  Recommended: {route.viaHub.hub.name}
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  {formatCurrency(route.savings)} saved vs direct · transfer time ~4h at hub
                </div>
              </div>
              <Button size="sm" onClick={accept}>
                Apply Route
              </Button>
            </div>
          )}

          <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
              Load Details
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-slate-500">Shipper</div>
                <div className="font-medium text-slate-800">{selected.shipper}</div>
              </div>
              <div>
                <div className="text-slate-500">Consignee</div>
                <div className="font-medium text-slate-800">{selected.consignee}</div>
              </div>
              <div>
                <div className="text-slate-500">Delivery by</div>
                <div className="font-medium text-slate-800">
                  {formatRelative(selected.deliveryWindow.end)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function RouteOption({
  title,
  distanceKm,
  cost,
  hours,
  selected,
  icon,
  savings,
}: {
  title: string;
  distanceKm: number;
  cost: number;
  hours: number;
  selected: boolean;
  icon: React.ReactNode;
  savings?: number;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        selected
          ? "border-indigo-300 bg-indigo-50/50 ring-2 ring-indigo-200"
          : "border-slate-200/70 bg-white"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-2 text-sm font-semibold ${
          selected ? "text-indigo-700" : "text-slate-700"
        }`}>
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            selected ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
          }`}>
            {icon}
          </span>
          {title}
        </div>
        {selected && <Pill tone="violet" size="xs">Recommended</Pill>}
        {savings !== undefined && savings > 0 && !selected && (
          <Pill tone="success" size="xs">-{formatCurrency(savings)}</Pill>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <MapPinIcon className="h-3 w-3" /> Distance
          </div>
          <div className="font-semibold text-slate-800">{distanceKm.toFixed(0)} km</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <ClockIcon className="h-3 w-3" /> Transit
          </div>
          <div className="font-semibold text-slate-800">{hours.toFixed(1)}h</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <DollarIcon className="h-3 w-3" /> Cost
          </div>
          <div className="font-semibold text-slate-800">{formatCurrency(cost)}</div>
        </div>
      </div>
    </div>
  );
}

// A simple SVG map of continental US with the route drawn
function RouteMap({
  origin,
  destination,
  viaHub,
  recommendation,
}: {
  origin: { city: string; lat: number; lng: number };
  destination: { city: string; lat: number; lng: number };
  viaHub: { name: string; city: string; lat: number; lng: number } | undefined;
  recommendation: "direct" | "via_hub";
}) {
  // US bounds approx: lng -125 to -66, lat 24 to 50
  const project = (lat: number, lng: number) => {
    const x = ((lng - -125) / (-66 - -125)) * 100;
    const y = 100 - ((lat - 24) / (50 - 24)) * 100;
    return { x, y };
  };
  const o = project(origin.lat, origin.lng);
  const d = project(destination.lat, destination.lng);
  // viaHub is a hub object with lat/lng, projected below
  const hubProj = viaHub
    ? { ...project(viaHub.lat, viaHub.lng), city: viaHub.city }
    : null;

  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/70 p-3">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2 flex items-center gap-1">
        <RouteIcon className="h-3 w-3" /> Route Map
      </div>
      <div className="relative w-full" style={{ paddingBottom: "50%" }}>
        <svg
          viewBox="0 0 100 50"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="direct-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="hub-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {/* Grid */}
          <g stroke="#e2e8f0" strokeWidth="0.15">
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2="50" />
            ))}
            {[0, 10, 20, 30, 40, 50].map((y) => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} />
            ))}
          </g>
          {/* Outline approximation of contiguous US */}
          <path
            d="M 5 18 L 15 16 L 25 14 L 35 12 L 50 10 L 70 12 L 85 14 L 92 18 L 90 25 L 88 32 L 82 38 L 72 42 L 60 43 L 50 42 L 40 40 L 30 38 L 22 35 L 15 30 L 10 24 Z"
            fill="#f1f5f9"
            stroke="#cbd5e1"
            strokeWidth="0.2"
          />
          {/* Direct route (dimmed) */}
          {recommendation === "direct" ? (
            <line
              x1={o.x}
              y1={o.y * 0.5}
              x2={d.x}
              y2={d.y * 0.5}
              stroke="url(#hub-grad)"
              strokeWidth="0.7"
              strokeDasharray="0"
            />
          ) : (
            <line
              x1={o.x}
              y1={o.y * 0.5}
              x2={d.x}
              y2={d.y * 0.5}
              stroke="url(#direct-grad)"
              strokeWidth="0.4"
              strokeDasharray="0.6 0.6"
            />
          )}
          {/* Via hub route */}
          {hubProj && (
            <>
              <line
                x1={o.x}
                y1={o.y * 0.5}
                x2={hubProj.x}
                y2={hubProj.y * 0.5}
                stroke={recommendation === "via_hub" ? "url(#hub-grad)" : "url(#direct-grad)"}
                strokeWidth={recommendation === "via_hub" ? 0.7 : 0.4}
              />
              <line
                x1={hubProj.x}
                y1={hubProj.y * 0.5}
                x2={d.x}
                y2={d.y * 0.5}
                stroke={recommendation === "via_hub" ? "url(#hub-grad)" : "url(#direct-grad)"}
                strokeWidth={recommendation === "via_hub" ? 0.7 : 0.4}
              />
            </>
          )}
          {/* Hub marker */}
          {hubProj && (
            <g>
              <circle
                cx={hubProj.x}
                cy={hubProj.y * 0.5}
                r={1.2}
                fill="#fff"
                stroke="#6366f1"
                strokeWidth="0.4"
              />
              <circle
                cx={hubProj.x}
                cy={hubProj.y * 0.5}
                r={2.5}
                fill="#6366f1"
                opacity="0.15"
              />
            </g>
          )}
          {/* Origin */}
          <g>
            <circle cx={o.x} cy={o.y * 0.5} r={1.5} fill="#10b981" />
            <circle cx={o.x} cy={o.y * 0.5} r={3} fill="#10b981" opacity="0.2" />
          </g>
          {/* Destination */}
          <g>
            <circle cx={d.x} cy={d.y * 0.5} r={1.5} fill="#f43f5e" />
            <circle cx={d.x} cy={d.y * 0.5} r={3} fill="#f43f5e" opacity="0.2" />
          </g>
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-600">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Origin
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-500" /> Destination
        </span>
        {hubProj && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-indigo-500" /> Hub
          </span>
        )}
        <span className="ml-auto text-slate-500 truncate">
          {origin.city} → {destination.city}
          {hubProj && recommendation === "via_hub" && ` (via ${hubProj.city})`}
        </span>
      </div>
    </div>
  );
}
