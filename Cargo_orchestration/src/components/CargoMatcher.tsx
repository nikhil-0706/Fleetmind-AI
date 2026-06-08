import { useState, useMemo } from "react";
import { useApp } from "../store";
import { Card, SectionHeader, Button, Pill, ProgressBar } from "./ui";
import { TruckIcon, StarIcon, ClockIcon, SparkleIcon, MapPinIcon } from "./Icons";
import { bestMatches, distanceKm, formatCurrency, formatRelative } from "../lib/logistics";
import type { Load, MatchScore } from "../types";

export function CargoMatcher() {
  const { loads, vehicles, carriers, assignCarrier } = useApp();
  const matchable = loads.filter(
    (l) => l.status === "pending_match" || l.status === "consolidating"
  );
  const [selectedId, setSelectedId] = useState<string>(
    matchable[0]?.id ?? ""
  );

  const selected = matchable.find((l) => l.id === selectedId) ?? matchable[0];

  const matches = useMemo(() => {
    if (!selected) return [];
    return bestMatches(selected, vehicles, carriers);
  }, [selected, vehicles, carriers]);

  if (!selected) {
    return (
      <Card className="p-5">
        <SectionHeader
          title="Cargo Matching"
          subtitle="AI-powered carrier and vehicle assignment"
          icon={<TruckIcon className="h-5 w-5" />}
        />
        <div className="text-sm text-slate-500 py-8 text-center">
          No loads pending match. Create a new load to get started.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <SectionHeader
        title="Cargo Matching Engine"
        subtitle="Score-based assignment across fleet"
        icon={<TruckIcon className="h-5 w-5" />}
        action={
          <Pill tone="violet" size="xs">
            <SparkleIcon className="h-3 w-3" /> Live scoring
          </Pill>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Load list */}
        <div className="lg:col-span-4">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
            Pending Loads ({matchable.length})
          </div>
          <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
            {matchable.map((l) => (
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
                  <PriorityPill priority={l.priority} />
                </div>
                <div className="text-xs text-slate-600 truncate">
                  {l.origin.city} → {l.destination.city}
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                  <span>{l.weight.toLocaleString()} kg</span>
                  <span>·</span>
                  <span>{l.pallets} plt</span>
                  {l.hazmat && <Pill tone="warn" size="xs">Hazmat</Pill>}
                  {l.refrigerated && <Pill tone="info" size="xs">Reefer</Pill>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected load details + match results */}
        <div className="lg:col-span-8 space-y-3">
          <LoadHeader load={selected} />

          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
            Top Carrier Matches ({matches.length})
          </div>
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {matches.map((m, i) => (
              <MatchCard
                key={m.vehicleId + m.carrierId}
                match={m}
                rank={i + 1}
                onAssign={() => assignCarrier(selected.id, m.carrierId, m.vehicleId, m.cost)}
                disabled={m.score < 40}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function LoadHeader({ load }: { load: Load }) {
  const dist = distanceKm(load.origin, load.destination);
  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-semibold text-slate-900">
              {load.reference}
            </span>
            <PriorityPill priority={load.priority} />
            <Pill tone="neutral" size="xs">{load.cargoType}</Pill>
            {load.hazmat && <Pill tone="warn" size="xs">Hazmat</Pill>}
            {load.refrigerated && <Pill tone="info" size="xs">Reefer</Pill>}
            {load.fragile && <Pill tone="violet" size="xs">Fragile</Pill>}
          </div>
          <div className="mt-1 text-sm text-slate-700">
            {load.shipper} <span className="text-slate-400 mx-1">→</span> {load.consignee}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Declared value</div>
          <div className="text-sm font-semibold text-slate-900">{formatCurrency(load.value)}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div>
          <div className="text-[10px] uppercase text-slate-500">Route</div>
          <div className="font-medium text-slate-700 flex items-center gap-1">
            <MapPinIcon className="h-3 w-3 text-slate-400" />
            {load.origin.city}, {load.origin.region} → {load.destination.city}, {load.destination.region}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{dist.toFixed(0)} km</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500">Cargo</div>
          <div className="font-medium text-slate-700">
            {load.weight.toLocaleString()} kg · {load.volume} m³
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{load.pallets} pallets</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500">Pickup window</div>
          <div className="font-medium text-slate-700 flex items-center gap-1">
            <ClockIcon className="h-3 w-3 text-slate-400" />
            {formatRelative(load.pickupWindow.start)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500">Delivery by</div>
          <div className="font-medium text-slate-700 flex items-center gap-1">
            <ClockIcon className="h-3 w-3 text-slate-400" />
            {formatRelative(load.deliveryWindow.end)}
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchCard({
  match,
  rank,
  onAssign,
  disabled,
}: {
  match: MatchScore;
  rank: number;
  onAssign: () => void;
  disabled: boolean;
}) {
  const tone =
    match.score >= 80 ? "success" : match.score >= 60 ? "info" : match.score >= 40 ? "warn" : "danger";
  return (
    <div
      className={`rounded-xl border p-3 transition-colors ${
        disabled
          ? "border-rose-200/60 bg-rose-50/30"
          : "border-slate-200/70 bg-white hover:border-indigo-300 hover:bg-indigo-50/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px] font-bold">
              {rank}
            </span>
            <span className="text-sm font-semibold text-slate-900 truncate">
              {match.carrierName}
            </span>
            <span className="text-[10px] text-slate-500">·</span>
            <span className="text-[10px] text-slate-600 font-mono">
              {match.vehicleId} ({match.vehicleType.replace("_", " ")})
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-600">
            <span className="flex items-center gap-1">
              <StarIcon className="h-3 w-3 text-amber-500" />
              Carrier score
            </span>
            <span>·</span>
            <span>{match.distanceKm.toFixed(0)} km</span>
            <span>·</span>
            <span>{match.transitHours.toFixed(1)}h transit</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {match.reasons.slice(0, 3).map((r, i) => (
              <Pill key={i} tone="neutral" size="xs">{r}</Pill>
            ))}
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1.5 flex-shrink-0">
          <div>
            <div className="text-[10px] uppercase text-slate-500">Score</div>
            <div className={`text-lg font-bold leading-none ${
              match.score >= 80 ? "text-emerald-600" :
              match.score >= 60 ? "text-sky-600" :
              match.score >= 40 ? "text-amber-600" : "text-rose-600"
            }`}>
              {match.score}
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-700">
            {formatCurrency(match.cost)}
          </div>
          <Button
            size="sm"
            onClick={onAssign}
            disabled={disabled}
            variant={disabled ? "secondary" : "primary"}
          >
            {disabled ? "Incompatible" : "Assign"}
          </Button>
        </div>
      </div>
      <div className="mt-2">
        <ProgressBar value={match.score / 100} tone={tone as any} size="sm" />
      </div>
    </div>
  );
}

function PriorityPill({ priority }: { priority: "standard" | "expedited" | "critical" }) {
  const tones = {
    standard: "neutral",
    expedited: "warn",
    critical: "danger",
  } as const;
  return <Pill tone={tones[priority]} size="xs">{priority}</Pill>;
}
