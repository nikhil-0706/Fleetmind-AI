import type { Location, Load, Vehicle, Hub, MatchScore } from "../types";

// Haversine distance in km
export function distanceKm(a: Location, b: Location): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function nearestHub(loc: Location, hubs: Hub[]): Hub {
  let best = hubs[0];
  let bestD = Infinity;
  for (const h of hubs) {
    const d = distanceKm(loc, h);
    if (d < bestD) {
      bestD = d;
      best = h;
    }
  }
  return best;
}

// Estimate transit hours assuming 75 km/h average
export function estimateTransitHours(distanceKm: number): number {
  return distanceKm / 75;
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelative(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const hours = abs / 3.6e6;
  if (hours < 1) {
    const m = Math.round(abs / 6e4);
    return diff >= 0 ? `in ${m}m` : `${m}m ago`;
  }
  if (hours < 24) {
    return diff >= 0 ? `in ${Math.round(hours)}h` : `${Math.round(hours)}h ago`;
  }
  const days = hours / 24;
  return diff >= 0 ? `in ${days.toFixed(1)}d` : `${days.toFixed(1)}d ago`;
}

const CARGO_HAZMAT_VEHICLES = ["tanker", "flatbed"];

export function scoreMatch(
  load: Load,
  vehicle: Vehicle,
  carrier: { id: string; name: string; rating: number; baseRate: number; surgeMultiplier: number; onTimeRate: number; hazmatCertified: boolean; refrigeratedCertified: boolean; coverageRegions: string[] }
): MatchScore {
  const reasons: string[] = [];
  let score = 50;

  // Capacity fit
  const weightFit = load.weight / vehicle.capacityKg;
  const volumeFit = vehicle.capacityM3 ? load.volume / vehicle.capacityM3 : 0;
  const palletFit = vehicle.palletSlots ? load.pallets / vehicle.palletSlots : 0;
  const capUtil = Math.max(weightFit, volumeFit, palletFit);
  if (capUtil > 1) {
    score -= 40;
    reasons.push("Exceeds vehicle capacity");
  } else if (capUtil < 0.4) {
    score -= 10;
    reasons.push("Low capacity utilization");
  } else if (capUtil > 0.7) {
    score += 15;
    reasons.push("Excellent capacity utilization");
  } else {
    score += 5;
    reasons.push("Acceptable capacity fit");
  }

  // Specialty requirements
  if (load.hazmat) {
    if (!vehicle.hazmatReady || !carrier.hazmatCertified) {
      score -= 100;
      reasons.push("Hazmat certification missing");
    } else {
      score += 10;
      reasons.push("Hazmat certified");
    }
  }
  if (load.refrigerated) {
    if (!vehicle.refrigerated || !carrier.refrigeratedCertified) {
      score -= 100;
      reasons.push("Refrigeration missing");
    } else {
      score += 10;
      reasons.push("Refrigerated capable");
    }
  }

  // Vehicle type compatibility
  if (load.cargoType === "liquid" && !CARGO_HAZMAT_VEHICLES.includes(vehicle.type) && vehicle.type !== "tanker") {
    score -= 25;
    reasons.push("Vehicle type sub-optimal for liquid cargo");
  }
  if (load.cargoType === "oversized" && vehicle.type !== "flatbed") {
    score -= 20;
    reasons.push("Flatbed recommended for oversized cargo");
  }

  // Proximity: from vehicle current location to origin
  const vehLoc: Location = {
    city: "",
    region: "",
    lat: vehicle.currentLat,
    lng: vehicle.currentLng,
  };
  const distToOrigin = distanceKm(vehLoc, load.origin);
  const distToDest = distanceKm(load.origin, load.destination);
  const totalKm = distToOrigin + distToDest;
  if (distToOrigin < 200) {
    score += 12;
    reasons.push("Vehicle nearby");
  } else if (distToOrigin < 500) {
    score += 5;
    reasons.push("Vehicle in region");
  } else {
    score -= 5;
    reasons.push("Long repositioning required");
  }

  // Region coverage
  if (carrier.coverageRegions.includes(load.origin.region)) {
    score += 8;
    reasons.push("Origin in coverage zone");
  }
  if (carrier.coverageRegions.includes(load.destination.region)) {
    score += 5;
    reasons.push("Destination in coverage zone");
  }

  // Carrier quality
  score += Math.round(carrier.rating * 4);
  score += Math.round((carrier.onTimeRate - 0.85) * 50);
  reasons.push(`Rating ${carrier.rating.toFixed(1)}★, ${(carrier.onTimeRate * 100).toFixed(0)}% on-time`);

  // Priority boost - critical shipments favor higher-rated carriers
  if (load.priority === "critical" && carrier.rating >= 4.6) {
    score += 8;
    reasons.push("Top-tier carrier for critical load");
  }

  // Cost estimate
  const cost = Math.round(
    totalKm * load.weight * carrier.baseRate * carrier.surgeMultiplier + 250
  );

  const transitHours = estimateTransitHours(totalKm);

  return {
    carrierId: carrier.id,
    carrierName: carrier.name,
    vehicleId: vehicle.id,
    vehicleType: vehicle.type,
    score: Math.max(0, Math.min(100, score)),
    cost,
    transitHours,
    distanceKm: totalKm,
    reasons,
  };
}

export function bestMatches(
  load: Load,
  vehicles: Vehicle[],
  carriers: { id: string; name: string; rating: number; baseRate: number; surgeMultiplier: number; onTimeRate: number; hazmatCertified: boolean; refrigeratedCertified: boolean; coverageRegions: string[] }[]
): MatchScore[] {
  const out: MatchScore[] = [];
  for (const v of vehicles) {
    const c = carriers.find((x) => x.id === v.carrierId);
    if (!c) continue;
    out.push(scoreMatch(load, v, c));
  }
  return out.sort((a, b) => b.score - a.score);
}

// Greedy bin-packing by 3D capacity for consolidation
export interface ConsolidationCandidate {
  load: Load;
  vehicle: Vehicle;
  fitScore: number;
  savings: number;
}

export function findConsolidationCandidates(
  loads: Load[],
  vehicles: Vehicle[]
): ConsolidationCandidate[] {
  const eligibleLoads = loads.filter(
    (l) =>
      (l.status === "pending_match" || l.status === "consolidating") &&
      !l.consolidatedGroupId
  );
  const candidates: ConsolidationCandidate[] = [];

  for (const load of eligibleLoads) {
    for (const vehicle of vehicles) {
      if (vehicle.capacityM3 === 0) continue;
      const weightFit = load.weight / vehicle.capacityKg;
      const volumeFit = load.volume / vehicle.capacityM3;
      if (weightFit > 1 || volumeFit > 1) continue;
      const fitScore = 1 - Math.max(weightFit, volumeFit);
      // Estimate savings vs solo trip
      const solo = load.weight * 0.003 * 1500;
      const savings = solo * fitScore * 0.55;
      candidates.push({ load, vehicle, fitScore, savings });
    }
  }
  return candidates.sort((a, b) => b.savings - a.savings);
}

// Group loads into consolidated shipments using a greedy algorithm
export function buildConsolidatedGroups(
  loads: Load[],
  vehicles: Vehicle[]
): { groups: { vehicleId: string; loadIds: string[]; util: number }[]; ungrouped: string[] } {
  const eligible = loads.filter(
    (l) =>
      (l.status === "pending_match" || l.status === "consolidating") &&
      !l.consolidatedGroupId
  );
  const assigned = new Set<string>();
  const groups: { vehicleId: string; loadIds: string[]; util: number }[] = [];

  // Sort loads by priority then by size desc for better packing
  const priorityOrder = { critical: 0, expedited: 1, standard: 2 };
  const sortedLoads = [...eligible].sort((a, b) => {
    const p = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (p !== 0) return p;
    return b.weight - a.weight;
  });

  for (const load of sortedLoads) {
    if (assigned.has(load.id)) continue;
    let bestGroup: { vehicleId: string; loadIds: string[]; util: number } | null = null;
    let bestImprovement = 0;

    // Try to add to existing group
    for (const g of groups) {
      const v = vehicles.find((x) => x.id === g.vehicleId);
      if (!v) continue;
      // Region compatibility - same origin region preferred
      const existingLoads = g.loadIds
        .map((id) => sortedLoads.find((l) => l.id === id)!)
        .filter(Boolean);
      const sameOrigin = existingLoads.every(
        (el) => el.origin.region === load.origin.region
      );
      const newWeight =
        existingLoads.reduce((s, l) => s + l.weight, 0) + load.weight;
      const newVolume =
        existingLoads.reduce((s, l) => s + l.volume, 0) + load.volume;
      if (newWeight > v.capacityKg || newVolume > v.capacityM3) continue;
      // Speciality compatibility
      const needsReefer = existingLoads.some((l) => l.refrigerated) || load.refrigerated;
      const needsHazmat = existingLoads.some((l) => l.hazmat) || load.hazmat;
      if (needsReefer && !v.refrigerated) continue;
      if (needsHazmat && !v.hazmatReady) continue;
      const utilImprovement = sameOrigin ? 0.35 : 0.15;
      if (utilImprovement > bestImprovement) {
        bestImprovement = utilImprovement;
        bestGroup = g;
      }
    }

    if (bestGroup) {
      bestGroup.loadIds.push(load.id);
      const v = vehicles.find((x) => x.id === bestGroup!.vehicleId)!;
      const totW = bestGroup.loadIds.reduce((s, id) => {
        const l = sortedLoads.find((x) => x.id === id)!;
        return s + l.weight;
      }, 0);
      bestGroup.util = Math.max(
        totW / v.capacityKg,
        v.capacityM3
          ? bestGroup.loadIds.reduce((s, id) => {
              const l = sortedLoads.find((x) => x.id === id)!;
              return s + l.volume;
            }, 0) / v.capacityM3
          : 0
      );
      assigned.add(load.id);
    } else {
      // Try to start a new group
      for (const v of vehicles) {
        if (v.capacityM3 === 0) continue;
        if (load.weight > v.capacityKg) continue;
        if (v.capacityM3 && load.volume > v.capacityM3) continue;
        if (load.hazmat && !v.hazmatReady) continue;
        if (load.refrigerated && !v.refrigerated) continue;
        const util = Math.max(
          load.weight / v.capacityKg,
          v.capacityM3 ? load.volume / v.capacityM3 : 0
        );
        if (util < 0.4) continue; // Only start groups with decent fit
        groups.push({ vehicleId: v.id, loadIds: [load.id], util });
        assigned.add(load.id);
        break;
      }
    }
  }

  return { groups, ungrouped: eligible.filter((l) => !assigned.has(l.id)).map((l) => l.id) };
}

// Intermediate hub route optimization
export interface HubRoute {
  direct: { distanceKm: number; cost: number; hours: number };
  viaHub: { hub: Hub; distanceKm: number; cost: number; hours: number } | null;
  savings: number;
  recommendation: "direct" | "via_hub";
}

export function optimizeIntermediateRoute(
  load: Load,
  hubs: Hub[]
): HubRoute {
  const directDist = distanceKm(load.origin, load.destination);
  const directCost = directDist * load.weight * 0.0028;
  const directHours = estimateTransitHours(directDist);

  let best: { hub: Hub; distanceKm: number; cost: number; hours: number } | null = null;
  for (const h of hubs) {
    if (load.hazmat && !h.hasHazmat) continue;
    if (load.refrigerated && !h.hasRefrigeration) continue;
    const leg1 = distanceKm(load.origin, h);
    const leg2 = distanceKm(h, load.destination);
    const totalDist = leg1 + leg2;
    // Only consider if route is reasonable (not >40% longer)
    if (totalDist > directDist * 1.4) continue;
    const transitCost = totalDist * load.weight * 0.0024; // Slightly cheaper per km
    const hubCost = h.operatingCost;
    const totalCost = transitCost + hubCost;
    const totalHours = estimateTransitHours(totalDist) + 4; // 4h hub transfer
    if (!best || totalCost < best.cost) {
      best = { hub: h, distanceKm: totalDist, cost: totalCost, hours: totalHours };
    }
  }

  if (!best) {
    return {
      direct: { distanceKm: directDist, cost: directCost, hours: directHours },
      viaHub: null,
      savings: 0,
      recommendation: "direct",
    };
  }

  const savings = directCost - best.cost;
  return {
    direct: { distanceKm: directDist, cost: directCost, hours: directHours },
    viaHub: best,
    savings,
    recommendation: savings > 0 ? "via_hub" : "direct",
  };
}
