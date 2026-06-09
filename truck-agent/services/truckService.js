const trucks = require("../data/trucks");

function getAllTrucks() {
  return trucks;
}

function getTruckById(truckId) {
  return trucks.find(truck => truck.truck_id === truckId);
}

function maintainTruckState(truckId) {
  const truck = getTruckById(truckId);

  if (!truck) {
    return { error: "Truck not found" };
  }

  return {
    truck_id: truck.truck_id,
    location: truck.location,
    capacity: truck.capacity,
    available_capacity: truck.available_capacity,
    status: truck.status,
    available_at: truck.available_at
  };
}

function validateTruckCapability(truckId, load) {
  const truck = getTruckById(truckId);

  if (!truck) {
    return { error: "Truck not found" };
  }

  const eligible =
    truck.available_capacity >= load.weight &&
    truck.location === load.origin &&
    truck.status === "available";

  let capacityScore = 0;

  if (eligible) {
    capacityScore = Math.round((load.weight / truck.capacity) * 100);
  }

  return {
    truck_id: truck.truck_id,
    eligible,
    capacity_score: capacityScore
  };
}

function findEligibleTrucks(load) {
  const eligibleTrucks = trucks
    .filter(truck =>
      truck.available_capacity >= load.weight &&
      truck.location === load.origin &&
      truck.status === "available"
    )
    .map(truck => ({
      truck_id: truck.truck_id,
      capacity_score: Math.round((load.weight / truck.capacity) * 100),
      location: truck.location,
      available_capacity: truck.available_capacity
    }));

  return {
    load,
    eligible_trucks: eligibleTrucks
  };
}

function predictAvailability(truckId, tripEndTime, unloadMinutes, restMinutes) {
  const truck = getTruckById(truckId);

  if (!truck) {
    return { error: "Truck not found" };
  }

  const [hours, minutes] = tripEndTime.split(":").map(Number);

  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes + unloadMinutes + restMinutes);

  const availableAt = date.toTimeString().slice(0, 5);

  truck.available_at = availableAt;

  return {
    truck_id: truck.truck_id,
    available_at: availableAt
  };
}

function calculateUtilization(truckId) {
  const truck = getTruckById(truckId);

  if (!truck) {
    return { error: "Truck not found" };
  }

  const totalDistance = truck.loaded_distance + truck.empty_distance;

  const distanceUtilization =
    totalDistance === 0 ? 0 : truck.loaded_distance / totalDistance;

  const idlePenalty = truck.idle_time * 2;

  let utilization = Math.round(distanceUtilization * 100 - idlePenalty);

  if (utilization < 0) utilization = 0;
  if (utilization > 100) utilization = 100;

  return {
    truck_id: truck.truck_id,
    utilization
  };
}

function broadcastTruckState() {
  return trucks.map(truck => {
    const utilizationData = calculateUtilization(truck.truck_id);

    return {
      truck_id: truck.truck_id,
      location: truck.location,
      status: truck.status,
      capacity: truck.capacity,
      available_capacity: truck.available_capacity,
      utilization: utilizationData.utilization
    };
  });
}

function estimateArrival(truckId, destination) {
  const truck = getTruckById(truckId);

  if (!truck) {
    return { error: "Truck not found" };
  }

  const demoArrivalTimes = {
    "Mumbai-Pune": "16:45",
    "Navi Mumbai-Pune": "17:30",
    "Pune-Mumbai": "20:00"
  };

  const key = `${truck.location}-${destination}`;

  return {
    truck_id: truck.truck_id,
    from: truck.location,
    to: destination,
    estimated_arrival: demoArrivalTimes[key] || "Unknown"
  };
}

function provideRouteInfo(truckId) {
  const truck = getTruckById(truckId);

  if (!truck) {
    return { error: "Truck not found" };
  }

  return {
    truck_id: truck.truck_id,
    weight: truck.current_load,
    capacity: truck.capacity,
    fuel_efficiency: truck.fuel_efficiency
  };
}

function getTrucksCompletingDeliveries() {
  return trucks
    .filter(truck => truck.status === "busy")
    .map(truck => ({
      truck_id: truck.truck_id,
      delivery_completion: truck.available_at,
      location: truck.destination
    }));
}

function updateTruckState(truckId, newData) {
  const truck = getTruckById(truckId);

  if (!truck) {
    return { error: "Truck not found" };
  }

  Object.assign(truck, newData);

  return {
    message: "Truck state updated successfully",
    truck
  };
}

module.exports = {
  getAllTrucks,
  getTruckById,
  maintainTruckState,
  validateTruckCapability,
  findEligibleTrucks,
  predictAvailability,
  calculateUtilization,
  broadcastTruckState,
  estimateArrival,
  provideRouteInfo,
  getTrucksCompletingDeliveries,
  updateTruckState
};