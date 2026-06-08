import { useState } from "react";
import { useApp } from "../store";
import { Card, SectionHeader, Button } from "./ui";
import { PackageIcon, SparkleIcon, PlusIcon, AlertIcon, CheckIcon } from "./Icons";
import type { CargoType, Priority, Location } from "../types";
import { formatCurrency } from "../lib/logistics";

const CARGO_TYPES: { value: CargoType; label: string; tone: "neutral" | "info" | "warn" | "danger" | "violet" | "success" }[] = [
  { value: "general", label: "General", tone: "neutral" },
  { value: "perishable", label: "Perishable", tone: "success" },
  { value: "refrigerated", label: "Refrigerated", tone: "info" },
  { value: "hazmat", label: "Hazmat", tone: "warn" },
  { value: "fragile", label: "Fragile", tone: "violet" },
  { value: "oversized", label: "Oversized", tone: "warn" },
  { value: "liquid", label: "Liquid Bulk", tone: "info" },
  { value: "electronic", label: "Electronics", tone: "violet" },
];

const PRIORITIES: { value: Priority; label: string; tone: "neutral" | "warn" | "danger" }[] = [
  { value: "standard", label: "Standard", tone: "neutral" },
  { value: "expedited", label: "Expedited", tone: "warn" },
  { value: "critical", label: "Critical", tone: "danger" },
];

const CITIES: Location[] = [
  { city: "Los Angeles", region: "CA", lat: 34.0522, lng: -118.2437 },
  { city: "Chicago", region: "IL", lat: 41.8781, lng: -87.6298 },
  { city: "New York", region: "NY", lat: 40.7128, lng: -74.006 },
  { city: "Dallas", region: "TX", lat: 32.7767, lng: -96.797 },
  { city: "Atlanta", region: "GA", lat: 33.749, lng: -84.388 },
  { city: "Denver", region: "CO", lat: 39.7392, lng: -104.9903 },
  { city: "Phoenix", region: "AZ", lat: 33.4484, lng: -112.074 },
  { city: "Houston", region: "TX", lat: 29.7604, lng: -95.3698 },
  { city: "Boston", region: "MA", lat: 42.3601, lng: -71.0589 },
  { city: "Salt Lake City", region: "UT", lat: 40.7608, lng: -111.891 },
];

export function LoadCreator() {
  const { createLoad } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    shipper: "",
    consignee: "",
    originIdx: 0,
    destIdx: 1,
    cargoType: "general" as CargoType,
    weight: 5000,
    volume: 20,
    pallets: 6,
    value: 50000,
    priority: "standard" as Priority,
    hazmat: false,
    refrigerated: false,
    fragile: false,
    pickupOffsetH: 2,
    deliveryOffsetH: 24,
    notes: "",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const valid =
    form.shipper.trim() &&
    form.consignee.trim() &&
    form.weight > 0 &&
    form.originIdx !== form.destIdx;

  const submit = () => {
    if (!valid) return;
    const now = Date.now();
    const origin = CITIES[form.originIdx];
    const destination = CITIES[form.destIdx];
    createLoad({
      shipper: form.shipper,
      consignee: form.consignee,
      origin,
      destination,
      cargoType: form.cargoType,
      weight: form.weight,
      volume: form.volume,
      pallets: form.pallets,
      value: form.value,
      priority: form.priority,
      hazmat: form.hazmat,
      refrigerated: form.refrigerated,
      fragile: form.fragile,
      pickupWindow: {
        start: new Date(now + form.pickupOffsetH * 3600 * 1000).toISOString(),
        end: new Date(now + (form.pickupOffsetH + 4) * 3600 * 1000).toISOString(),
      },
      deliveryWindow: {
        start: new Date(now + form.deliveryOffsetH * 3600 * 1000).toISOString(),
        end: new Date(now + (form.deliveryOffsetH + 8) * 3600 * 1000).toISOString(),
      },
      notes: form.notes || undefined,
    });
    setForm({
      shipper: "",
      consignee: "",
      originIdx: 0,
      destIdx: 1,
      cargoType: "general",
      weight: 5000,
      volume: 20,
      pallets: 6,
      value: 50000,
      priority: "standard",
      hazmat: false,
      refrigerated: false,
      fragile: false,
      pickupOffsetH: 2,
      deliveryOffsetH: 24,
      notes: "",
    });
    setOpen(false);
  };

  if (!open) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <PackageIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Create New Load</h3>
              <p className="text-xs text-slate-500">Book a new shipment into the network</p>
            </div>
          </div>
          <Button onClick={() => setOpen(true)}>
            <PlusIcon className="h-4 w-4" /> New Load
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Avg Booking Value</div>
            <div className="text-sm font-semibold text-slate-900">{formatCurrency(142000)}</div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Active Corridors</div>
            <div className="text-sm font-semibold text-slate-900">LA ↔ CHI · DAL ↔ ATL · NYC ↔ BOS</div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Form Prefill</div>
            <div className="text-sm font-semibold text-slate-900">Auto-validated fields</div>
          </div>
          <div className="rounded-lg bg-indigo-50 border border-indigo-200/70 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-indigo-700 font-medium flex items-center gap-1">
              <SparkleIcon className="h-3 w-3" /> Smart Tips
            </div>
            <div className="text-xs text-indigo-900">Hazmat loads require special handling</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <SectionHeader
        title="Create New Load"
        subtitle="Enter shipment details. Validation runs on every field."
        icon={<PackageIcon className="h-5 w-5" />}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={!valid}>
              <CheckIcon className="h-4 w-4" /> Create Load
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <Field label="Shipper">
          <input
            value={form.shipper}
            onChange={(e) => update("shipper", e.target.value)}
            placeholder="Apex Industrial"
            className="form-input"
          />
        </Field>
        <Field label="Consignee">
          <input
            value={form.consignee}
            onChange={(e) => update("consignee", e.target.value)}
            placeholder="Midwest Mfg Co"
            className="form-input"
          />
        </Field>
        <Field label="Origin">
          <select
            value={form.originIdx}
            onChange={(e) => update("originIdx", +e.target.value)}
            className="form-input"
          >
            {CITIES.map((c, i) => (
              <option key={c.city} value={i}>
                {c.city}, {c.region}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Destination">
          <select
            value={form.destIdx}
            onChange={(e) => update("destIdx", +e.target.value)}
            className="form-input"
          >
            {CITIES.map((c, i) => (
              <option key={c.city} value={i}>
                {c.city}, {c.region}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-5">
        <div className="text-xs font-medium text-slate-700 mb-2">Cargo Type</div>
        <div className="flex flex-wrap gap-1.5">
          {CARGO_TYPES.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                update("cargoType", c.value);
                if (c.value === "hazmat") update("hazmat", true);
                if (c.value === "refrigerated") update("refrigerated", true);
                if (c.value === "fragile") update("fragile", true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                form.cargoType === c.value
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs font-medium text-slate-700 mb-2">Priority</div>
        <div className="flex gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              onClick={() => update("priority", p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                form.priority === p.value
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Weight (kg)">
          <input
            type="number"
            value={form.weight}
            onChange={(e) => update("weight", +e.target.value)}
            className="form-input"
          />
        </Field>
        <Field label="Volume (m³)">
          <input
            type="number"
            value={form.volume}
            onChange={(e) => update("volume", +e.target.value)}
            className="form-input"
          />
        </Field>
        <Field label="Pallets">
          <input
            type="number"
            value={form.pallets}
            onChange={(e) => update("pallets", +e.target.value)}
            className="form-input"
          />
        </Field>
        <Field label="Value (USD)">
          <input
            type="number"
            value={form.value}
            onChange={(e) => update("value", +e.target.value)}
            className="form-input"
          />
        </Field>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Pickup Window (hours from now)">
          <input
            type="number"
            value={form.pickupOffsetH}
            onChange={(e) => update("pickupOffsetH", +e.target.value)}
            className="form-input"
          />
        </Field>
        <Field label="Delivery Window (hours from now)">
          <input
            type="number"
            value={form.deliveryOffsetH}
            onChange={(e) => update("deliveryOffsetH", +e.target.value)}
            className="form-input"
          />
        </Field>
      </div>

      <div className="mt-5">
        <div className="text-xs font-medium text-slate-700 mb-2">Special Requirements</div>
        <div className="flex flex-wrap gap-2">
          <Toggle
            active={form.hazmat}
            onChange={(v) => update("hazmat", v)}
            label="Hazmat"
            tone="warn"
          />
          <Toggle
            active={form.refrigerated}
            onChange={(v) => update("refrigerated", v)}
            label="Refrigerated"
            tone="info"
          />
          <Toggle
            active={form.fragile}
            onChange={(v) => update("fragile", v)}
            label="Fragile"
            tone="violet"
          />
        </div>
      </div>

      <div className="mt-5">
        <Field label="Notes (optional)">
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Special handling instructions, delivery access notes..."
            className="form-input min-h-[60px] resize-none"
            rows={2}
          />
        </Field>
      </div>

      {form.hazmat && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <AlertIcon className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-800">
            <span className="font-semibold">Hazmat Notice:</span> Only HAZMAT-certified carriers and equipped vehicles will be considered for this load. Placcard display and driver endorsements required.
          </div>
        </div>
      )}

      <style>{`
        .form-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          font-size: 0.8125rem;
          color: rgb(15 23 42);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-input:focus {
          outline: none;
          border-color: rgb(99 102 241);
          box-shadow: 0 0 0 3px rgb(199 210 254 / 0.4);
        }
      `}</style>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  active,
  onChange,
  label,
  tone,
}: {
  active: boolean;
  onChange: (v: boolean) => void;
  label: string;
  tone: "warn" | "info" | "violet";
}) {
  const tones = {
    warn: "border-amber-300 bg-amber-50 text-amber-700",
    info: "border-sky-300 bg-sky-50 text-sky-700",
    violet: "border-violet-300 bg-violet-50 text-violet-700",
  };
  return (
    <button
      onClick={() => onChange(!active)}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
        active
          ? tones[tone]
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {active ? "✓ " : ""}
      {label}
    </button>
  );
}


