from datetime import datetime


class WarehouseAgent:

    def __init__(self):

        self.total_docks = 5

        self.docks = {
            "D1": None,
            "D2": None,
            "D3": None,
            "D4": None,
            "D5": None
        }

        self.avg_unload_time = 60

        self.incoming_trucks = []

    def register_truck(self, truck):

        self.incoming_trucks.append({
            "truck_id": truck["truck_id"],
            "eta": truck["eta"]
        })

        return {
            "message": f"Truck {truck['truck_id']} registered",
            "eta": truck["eta"]
        }

    def get_arrival_schedule(self):

        return sorted(
            self.incoming_trucks,
            key=lambda x: x["eta"]
        )

    def generate_slots(self):

        schedule = self.get_arrival_schedule()

        slots = []

        current_hour = 9

        for truck in schedule:

            slots.append({
                "truck_id": truck["truck_id"],
                "slot": f"{current_hour}:00"
            })

            current_hour += 1

        return slots

    def assign_dock(self, truck_id):

        for dock in self.docks:

            if self.docks[dock] is None:

                self.docks[dock] = truck_id

                return {
                    "truck_id": truck_id,
                    "assigned_dock": dock,
                    "status": "reserved"
                }

        return {
            "truck_id": truck_id,
            "assigned_dock": None,
            "status": "waiting"
        }

    def predict_congestion(self):

        hourly_arrivals = {}

        for truck in self.incoming_trucks:

            hour = truck["eta"][:2]

            hourly_arrivals[hour] = (
                hourly_arrivals.get(hour, 0) + 1
            )

        congested_hours = []

        for hour, count in hourly_arrivals.items():

            if count > self.total_docks:

                congested_hours.append(hour)

        return {
            "congested_hours": congested_hours,
            "arrival_distribution": hourly_arrivals
        }

    def recommend_schedule(self):

        congestion = self.predict_congestion()

        if congestion["congested_hours"]:

            return {
                "recommendation":
                "Reschedule incoming trucks to avoid congestion",
                "affected_hours":
                congestion["congested_hours"]
            }

        return {
            "recommendation":
            "Schedule looks healthy"
        }

    def estimate_wait_time(self):

        queue = max(
            0,
            len(self.incoming_trucks) - self.total_docks
        )

        wait = queue * self.avg_unload_time

        return {
            "queue_length": queue,
            "estimated_wait_minutes": wait
        }

    def warehouse_status(self):

        active = sum(
            1 for dock in self.docks.values()
            if dock is not None
        )

        return {
            "total_docks": self.total_docks,
            "active_docks": active,
            "free_docks": self.total_docks - active,
            "incoming_trucks": len(self.incoming_trucks)
        }