import { useState, useMemo } from "react";
import { useApp } from "../store";
import { Card, SectionHeader, Pill, Button } from "./ui";
import {
  ActivityIcon,
  MapPinIcon,
  CheckIcon,
  ChevronIcon,
  SparkleIcon,
  XIcon,
  LayersIcon,
} from "./Icons";
import {
  formatRelative,
  formatDateTime,
  formatCurrency,
  distanceKm,
} from "../lib/logistics";
import type { Load, LoadStatus } from "../types";

const STATUS_FLOW: LoadStatus[] = [
  "draft",
  "pending_match",
  "matched",
  "consolidating",
  "in_transit",
  "at_hub",
  "out_for_delivery",
  "delivered",
];

const STATUS_LABELS: Record<LoadStatus, string> = {
  draft: "Draft",
  pending_match: "Pending Match",
  matched: "Matched",
  consolidating: "Consolidating",
  in_transit: "In Transit",
  at_hub: "At Hub",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_TONES: Record<LoadStatus, "neutral" | "info" | "success" | "warn" | "danger" | "violet"> = {
  draft: "neutral",
  pending_match: "warn",
  matched: "info",
  consolidating: "violet",
  in_transit: "info",
  at_hub: "violet",
  out_for_delivery: "info",
  delivered: "success",
  cancelled: "danger",
};

export function LifecycleTracker() {
  const { loads, events, carriers, vehicles, advanceLoad, cancelLoad, updateLoad } = useApp();
  const [selectedId, setSelectedId] = useState<string>(loads[0]?.id ?? "");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const filteredLoads = useMemo(() => {
    if (filter === "active")
      return loads.filter(
        (l) => l.status !== "delivered" && l.status !== "cancelled"
      );
    if (filter === "completed")
      return loads.filter(
        (l) => l.status === "delivered" || l.status === "cancelled"
      );
    return loads;
  }, [loads, filter]);

  const selected = loads.find((l) => l.id === selectedId) ?? filteredLoads[0] ?? loads[0];
  const selectedEvents = useMemo(
    () => events.filter((e) => e.loadId === selected?.id).sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp)),
    [events, selected]
  );
  const carrier = selected?.carrierId
    ? carriers.find((c) => c.id === selected.carrierId)
    : null;
  const vehicle = selected?.vehicleId
    ? vehicles.find((v) => v.id === selected.vehicleId)
    : null;

  if (!selected) {
    return (
      <Card className="p-5">
        <SectionHeader
          title="Load Lifecycle Tracking"
          subtitle="End-to-end status visibility & audit trail"
          icon={<ActivityIcon className="h-5 w-5" />}
        />
        <div className="text-sm text-slate-500 py-8 text-center">No loads in the system yet.</div>
      </Card>
    );
  }

  const dist = distanceKm(selected.origin, selected.destination);
  const currentStepIdx = STATUS_FLOW.indexOf(selected.status);
  const isTerminal = selected.status === "delivered" || selected.status === "cancelled";

  return (
    <Card className="p-5">
      <SectionHeader
        title="Load Lifecycle Tracking"
        subtitle="Real-time status timeline with full audit trail"
        icon={<ActivityIcon className="h-5 w-5" />}
        action={
          <Pill tone="violet" size="xs">
            <SparkleIcon className="h-3 w-3" /> {events.length} events tracked
          </Pill>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-1.5 mb-2">
            {(["all", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  filter === f
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {f === "all" ? "All" : f === "active" ? "Active" : "Completed"} ({f === "all" ? loads.length : f === "active" ? loads.filter(l => l.status !== "delivered" && l.status !== "cancelled").length : loads.filter(l => l.status === "delivered" || l.status === "cancelled").length})
              </button>
            ))}
          </div>
          <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
            {filteredLoads.map((l) => (
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
                  <Pill tone={STATUS_TONES[l.status]} size="xs">
                    {STATUS_LABELS[l.status]}
                  </Pill>
                </div>
                <div className="text-xs text-slate-600 truncate">
                  {l.origin.city} → {l.destination.city}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {l.shipper}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-3">
          <LoadSummary
            load={selected}
            distanceKm={dist}
            carrierName={carrier?.name}
            vehicleLabel={vehicle ? `${vehicle.id} (${vehicle.type.replace("_", " ")})` : undefined}
          />

          {/* Status flow */}
          <div className="rounded-xl bg-white border border-slate-200/70 p-4">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-3">
              Status Pipeline
            </div>
            {selected.status === "cancelled" ? (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-3 flex items-center gap-2">
                <XIcon className="h-4 w-4 text-rose-600" />
                <div>
                  <div className="text-sm font-semibold text-rose-800">Load Cancelled</div>
                  <div className="text-xs text-rose-700">No further status transitions will occur.</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {STATUS_FLOW.map((s, i) => {
                  const reached = i <= currentStepIdx;
                  const isCurrent = i === currentStepIdx;
                  return (
                    <div key={s} className="flex items-center gap-1 flex-shrink-0">
                      <div
                        className={`flex flex-col items-center gap-1 ${
                          reached ? "" : "opacity-40"
                        }`}
                      >
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                            isCurrent
                              ? "bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-100"
                              : reached
                                ? "bg-emerald-500 text-white border-emerald-500"
                                : "bg-white text-slate-400 border-slate-200"
                          }`}
                        >
                          {reached && !isCurrent ? <CheckIcon className="h-3 w-3" /> : i + 1}
                        </div>
                        <div className={`text-[10px] font-medium text-center whitespace-nowrap ${
                          isCurrent ? "text-indigo-700" : reached ? "text-slate-600" : "text-slate-400"
                        }`}>
                          {STATUS_LABELS[s]}
                        </div>
                      </div>
                      {i < STATUS_FLOW.length - 1 && (
                        <div
                          className={`h-0.5 w-4 -mt-3 ${
                            i < currentStepIdx ? "bg-emerald-500" : "bg-slate-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!isTerminal && (
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={() =>
                  advanceLoad(
                    selected.id,
                    "",
                    selected.priority === "critical" ? "Priority Ops" : "Operations"
                  )
                }
              >
                <ChevronIcon className="h-4 w-4" /> Advance to{" "}
                {STATUS_LABELS[STATUS_FLOW[Math.min(currentStepIdx + 1, STATUS_FLOW.length - 1)]]}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  updateLoad(selected.id, {
                    notes: `${selected.notes ? selected.notes + " | " : ""}Manual milestone added at ${new Date().toLocaleTimeString()}`,
                  })
                }
              >
                Add Note
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => cancelLoad(selected.id, "Cancelled from lifecycle view")}
              >
                <XIcon className="h-3.5 w-3.5" /> Cancel Load
              </Button>
            </div>
          )}

          {/* Timeline */}
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
              Audit Trail ({selectedEvents.length} events)
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white p-3 max-h-[280px] overflow-y-auto">
              <div className="relative pl-5">
                <div className="absolute left-1.5 top-1 bottom-1 w-px bg-slate-200" />
                {selectedEvents.map((e) => (
                  <div key={e.id} className="relative pb-3 last:pb-0">
                    <div className={`absolute -left-3.5 top-0.5 h-3 w-3 rounded-full border-2 border-white ${
                      e.status === "delivered" ? "bg-emerald-500" :
                      e.status === "cancelled" ? "bg-rose-500" :
                      e.status === "in_transit" ? "bg-sky-500" :
                      e.status === "at_hub" ? "bg-violet-500" :
                      e.status === "matched" ? "bg-indigo-500" :
                      "bg-slate-400"
                    }`} />
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Pill tone={STATUS_TONES[e.status]} size="xs">
                            {STATUS_LABELS[e.status]}
                          </Pill>
                          <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                            <MapPinIcon className="h-3 w-3" /> {e.location}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 mt-1">{e.note}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          by {e.actor}
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-slate-500 flex-shrink-0">
                        <div>{formatRelative(e.timestamp)}</div>
                        <div className="text-slate-400">{formatDateTime(e.timestamp)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function LoadSummary({
  load,
  distanceKm,
  carrierName,
  vehicleLabel,
}: {
  load: Load;
  distanceKm: number;
  carrierName?: string;
  vehicleLabel?: string;
}) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/70 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-semibold text-slate-900">
              {load.reference}
            </span>
            <Pill tone={STATUS_TONES[load.status]} size="xs">
              {STATUS_LABELS[load.status]}
            </Pill>
            {load.priority === "critical" && <Pill tone="danger" size="xs">Critical</Pill>}
            {load.consolidatedGroupId && (
              <Pill tone="violet" size="xs">
                <LayersIcon className="h-3 w-3" /> Consolidated
              </Pill>
            )}
          </div>
          <div className="mt-1 text-sm text-slate-700">
            {load.shipper} <span className="text-slate-400 mx-1">→</span> {load.consignee}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Value</div>
          <div className="text-base font-semibold text-slate-900">{formatCurrency(load.value)}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <Field label="Route" value={`${load.origin.city}, ${load.origin.region} → ${load.destination.city}, ${load.destination.region}`} sub={`${distanceKm.toFixed(0)} km`} />
        <Field label="Cargo" value={`${load.weight.toLocaleString()} kg · ${load.volume} m³`} sub={`${load.pallets} pallets`} />
        <Field label="Pickup" value={formatRelative(load.pickupWindow.start)} sub="window start" />
        <Field
          label="Carrier"
          value={carrierName ?? "—"}
          sub={vehicleLabel ?? "not assigned"}
        />
      </div>
      {load.notes && (
        <div className="mt-2 text-[11px] text-slate-600 bg-amber-50 border border-amber-200/70 rounded-lg px-2 py-1.5">
          📝 {load.notes}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
        {label}
      </div>
      <div className="font-semibold text-slate-800 text-xs">{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
