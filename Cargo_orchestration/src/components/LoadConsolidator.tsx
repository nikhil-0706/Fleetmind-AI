import { useState, useMemo } from "react";
import { useApp } from "../store";
import { Card, SectionHeader, Pill, Button, ProgressBar } from "./ui";
import { LayersIcon, MergeIcon, SparkleIcon, TruckIcon, PackageIcon } from "./Icons";
import { buildConsolidatedGroups, formatCurrency, distanceKm } from "../lib/logistics";
import type { Load, Vehicle, ConsolidatedGroup } from "../types";

export function LoadConsolidator() {
  const { loads, vehicles, carriers, groups, addGroup, removeGroup } = useApp();
  const [previewKey, setPreviewKey] = useState(0);

  const eligible = useMemo(
    () =>
      loads.filter(
        (l) =>
          (l.status === "pending_match" || l.status === "consolidating") &&
          !l.consolidatedGroupId
      ),
    [loads]
  );

  const proposal = useMemo(
    () => buildConsolidatedGroups(eligible, vehicles),
    [eligible, vehicles]
  );

  const commitAll = () => {
    for (const g of proposal.groups) {
      const vehicle = vehicles.find((v) => v.id === g.vehicleId);
      if (!vehicle) continue;
      const carrier = carriers.find((c) => c.id === vehicle.carrierId);
      if (!carrier) continue;
      const groupLoads = g.loadIds
        .map((id) => eligible.find((l) => l.id === id)!)
        .filter(Boolean);
      const totalWeight = groupLoads.reduce((s, l) => s + l.weight, 0);
      const totalVolume = groupLoads.reduce((s, l) => s + l.volume, 0);
      const dist =
        groupLoads.length > 0
          ? distanceKm(groupLoads[0].origin, groupLoads[0].destination)
          : 1000;
      const soloCost = groupLoads.reduce(
        (s, l) => s + l.weight * 0.003 * dist,
        0
      );
      const consolidatedCost = soloCost * (0.55 + g.util * 0.3);
      addGroup({
        name: `${groupLoads[0].origin.city} → ${groupLoads[0].destination.city} (${groupLoads.length} loads)`,
        loadIds: g.loadIds,
        vehicleId: vehicle.id,
        carrierId: carrier.id,
        route: [groupLoads[0].origin, groupLoads[0].destination],
        totalWeight,
        totalVolume,
        utilization: g.util,
        cost: consolidatedCost,
        savedCost: soloCost - consolidatedCost,
      });
    }
    setPreviewKey((k) => k + 1);
  };

  return (
    <Card className="p-5">
      <SectionHeader
        title="Dynamic Load Consolidation"
        subtitle="Pack multiple shipments into single vehicles"
        icon={<LayersIcon className="h-5 w-5" />}
        action={
          <Pill tone="violet" size="xs">
            <SparkleIcon className="h-3 w-3" /> Greedy 3D bin-packing
          </Pill>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat
          label="Eligible loads"
          value={eligible.length}
          tone="info"
        />
        <Stat
          label="Proposed groups"
          value={proposal.groups.length}
          tone="violet"
        />
        <Stat
          label="Projected savings"
          value={formatCurrency(estimateSavings(proposal.groups, eligible))}
          tone="success"
        />
        <Stat
          label="Avg fill rate"
          value={`${proposal.groups.length ? Math.round((proposal.groups.reduce((s, g) => s + g.util, 0) / proposal.groups.length) * 100) : 0}%`}
          tone="warn"
        />
      </div>

      {groups.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
            Active Consolidated Groups ({groups.length})
          </div>
          <div className="space-y-2">
            {groups.map((g) => (
              <ActiveGroupCard
                key={g.id}
                group={g}
                loads={loads}
                vehicles={vehicles}
                onRemove={() => removeGroup(g.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
            AI-Proposed Grouping ({proposal.groups.length} groups ·{" "}
            {proposal.ungrouped.length} unmatched)
          </div>
          {proposal.groups.length > 0 && (
            <Button size="sm" onClick={commitAll}>
              <MergeIcon className="h-3.5 w-3.5" /> Consolidate All
            </Button>
          )}
        </div>
        {proposal.groups.length === 0 ? (
          <div className="text-sm text-slate-500 py-6 text-center rounded-lg border border-dashed border-slate-200">
            No consolidation opportunities detected. Loads may be too small or incompatible.
          </div>
        ) : (
          <div className="space-y-2">
            {proposal.groups.map((g, i) => {
              const vehicle = vehicles.find((v) => v.id === g.vehicleId);
              const groupLoads = g.loadIds
                .map((id) => eligible.find((l) => l.id === id)!)
                .filter(Boolean);
              if (!vehicle || groupLoads.length === 0) return null;
              const carrier = carriers.find((c) => c.id === vehicle.carrierId);
              const tw = groupLoads.reduce((s, l) => s + l.weight, 0);
              const tv = groupLoads.reduce((s, l) => s + l.volume, 0);
              const dist =
                distanceKm(groupLoads[0].origin, groupLoads[0].destination);
              const soloCost = groupLoads.reduce(
                (s, l) => s + l.weight * 0.003 * dist,
                0
              );
              const newCost = soloCost * (0.55 + g.util * 0.3);
              const saved = soloCost - newCost;
              return (
                <div
                  key={`${g.vehicleId}-${i}-${previewKey}`}
                  className="rounded-xl border border-slate-200/70 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                          {groupLoads.length}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          {groupLoads[0].origin.city} → {groupLoads[0].destination.city}
                        </span>
                        <Pill tone="violet" size="xs">
                          <TruckIcon className="h-3 w-3" /> {vehicle.type.replace("_", " ")}
                        </Pill>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {carrier?.name} · {groupLoads.map((l) => l.reference).join(", ")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase text-slate-500">Saves</div>
                      <div className="text-sm font-bold text-emerald-600">
                        {formatCurrency(saved)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs mb-2">
                    <div>
                      <div className="text-[10px] text-slate-500">Weight</div>
                      <div className="font-semibold text-slate-800">
                        {tw.toLocaleString()} / {vehicle.capacityKg.toLocaleString()} kg
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Volume</div>
                      <div className="font-semibold text-slate-800">
                        {tv} / {vehicle.capacityM3} m³
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Cost</div>
                      <div className="font-semibold text-slate-800">
                        {formatCurrency(newCost)} <span className="text-slate-400 line-through text-[10px]">{formatCurrency(soloCost)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Fill rate</span>
                      <span>{Math.round(g.util * 100)}%</span>
                    </div>
                    <ProgressBar
                      value={g.util}
                      tone={g.util >= 0.7 ? "success" : g.util >= 0.4 ? "info" : "warn"}
                      size="sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {proposal.ungrouped.length > 0 && (
          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">
              Ungrouped (no fit found)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {proposal.ungrouped.map((id) => {
                const l = eligible.find((x) => x.id === id);
                if (!l) return null;
                return (
                  <Pill key={id} tone="neutral" size="xs">
                    {l.reference} · {l.weight.toLocaleString()}kg
                  </Pill>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function estimateSavings(
  groups: { loadIds: string[]; util: number }[],
  loads: Load[]
): number {
  let total = 0;
  for (const g of groups) {
    const groupLoads = g.loadIds
      .map((id) => loads.find((l) => l.id === id)!)
      .filter(Boolean);
    if (groupLoads.length === 0) continue;
    const dist = distanceKm(groupLoads[0].origin, groupLoads[0].destination);
    const soloCost = groupLoads.reduce((s, l) => s + l.weight * 0.003 * dist, 0);
    const newCost = soloCost * (0.55 + g.util * 0.3);
    total += soloCost - newCost;
  }
  return total;
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "info" | "success" | "warn" | "danger" | "violet";
}) {
  const tones: Record<string, string> = {
    info: "bg-sky-50 border-sky-200/70 text-sky-900",
    success: "bg-emerald-50 border-emerald-200/70 text-emerald-900",
    warn: "bg-amber-50 border-amber-200/70 text-amber-900",
    danger: "bg-rose-50 border-rose-200/70 text-rose-900",
    violet: "bg-violet-50 border-violet-200/70 text-violet-900",
  };
  return (
    <div className={`rounded-xl border px-3 py-2 ${tones[tone]}`}>
      <div className="text-[10px] uppercase tracking-wider font-medium opacity-80">
        {label}
      </div>
      <div className="text-base font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function ActiveGroupCard({
  group,
  loads,
  vehicles,
  onRemove,
}: {
  group: ConsolidatedGroup;
  loads: Load[];
  vehicles: Vehicle[];
  onRemove: () => void;
}) {
  const vehicle = vehicles.find((v) => v.id === group.vehicleId);
  const groupLoads = group.loadIds
    .map((id) => loads.find((l) => l.id === id)!)
    .filter(Boolean);
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <PackageIcon className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-900">
              {group.name}
            </span>
            <Pill tone="success" size="xs">Active</Pill>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">
            {vehicle?.type.replace("_", " ")} · {groupLoads.length} loads consolidated
          </div>
          <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-[10px] text-emerald-700">Saved</div>
              <div className="font-bold text-emerald-900">{formatCurrency(group.savedCost)}</div>
            </div>
            <div>
              <div className="text-[10px] text-emerald-700">Fill rate</div>
              <div className="font-bold text-emerald-900">{Math.round(group.utilization * 100)}%</div>
            </div>
            <div>
              <div className="text-[10px] text-emerald-700">Total cost</div>
              <div className="font-bold text-emerald-900">{formatCurrency(group.cost)}</div>
            </div>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={onRemove}>
          Undo
        </Button>
      </div>
    </div>
  );
}
