const trucks = [
  {
    truck_id: "T101",
    location: "Mumbai",
    destination: "Pune",
    capacity: 20,
    available_capacity: 20,
    status: "available",
    available_at: "14:00",
    fuel_efficiency: 4.8,
    current_load: 0,
    loaded_distance: 240,
    empty_distance: 40,
    idle_time: 2,
    driver: "Rajesh Kumar"
  },
  {
    truck_id: "T102",
    location: "Navi Mumbai",
    destination: "Pune",
    capacity: 16,
    available_capacity: 8,
    status: "busy",
    available_at: "17:15",
    fuel_efficiency: 5.2,
    current_load: 8,
    loaded_distance: 180,
    empty_distance: 60,
    idle_time: 3,
    driver: "Amit Sharma"
  }
];

module.exports = trucks;