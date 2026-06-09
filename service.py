from sqlalchemy.orm import Session
import models
import schemas


class TruckService:

    # -----------------------------
    # Register Truck
    # -----------------------------
    def register_truck(self, db: Session, truck: schemas.TruckCreate):

        db_truck = models.Truck(
            truck_id=truck.truck_id,
            truck_type=truck.truck_type,
            current_location=truck.current_location,
            capacity_tons=truck.capacity_tons,
            fuel_percent=truck.fuel_percent,
            maintenance_percent=truck.maintenance_percent,
            driver_expected_rate_per_km=truck.driver_expected_rate_per_km,
            status=truck.status,
            registration_number=truck.registration_number,
            driver_name=truck.driver_name,
            
        )

        db.add(db_truck)
        db.commit()
        db.refresh(db_truck)

        return db_truck

    # -----------------------------
    # Get All Trucks
    # -----------------------------
    def get_all_trucks(self, db: Session):

        return db.query(models.Truck).all()

    # -----------------------------
    # Get Truck By ID
    # -----------------------------
    def get_truck_by_id(self, db: Session, truck_id: str):

        return (
            db.query(models.Truck)
            .filter(models.Truck.truck_id == truck_id)
            .first()
        )

    # -----------------------------
    # Update Truck Status
    # -----------------------------
    def update_status(self, db: Session, truck_id: str, status: str):

        truck = self.get_truck_by_id(db, truck_id)

        if truck:
            truck.status = status
            db.commit()
            db.refresh(truck)

        return truck

    # -----------------------------
    # Scoring Functions
    # -----------------------------

    def capacity_score(self, truck_capacity, load_capacity):

        if load_capacity > truck_capacity:
            return 0

        return round((load_capacity / truck_capacity) * 100, 2)

    def money_score(self,
                    expected_rate_per_km,
                    distance_km,
                    offered_money):

        expected_money = expected_rate_per_km * distance_km

        if expected_money <= 0:
            return 0

        score = (offered_money / expected_money) * 100

        return min(round(score, 2), 100)

    def fuel_score(self, fuel_percent):

        return max(0, min(fuel_percent, 100))

    def maintenance_score(self, maintenance_percent):

        return max(0, min(maintenance_percent, 100))

    # -----------------------------
    # Final Utility Score
    # -----------------------------
    def utility_score(self,
                      capacity_score,
                      money_score,
                      fuel_score,
                      maintenance_score):

        utility = (
            capacity_score * 0.30 +
            money_score * 0.30 +
            fuel_score * 0.20 +
            maintenance_score * 0.20
        )

        return round(utility, 2)

    # -----------------------------
    # Decision Logic
    # -----------------------------
    def decision(self, utility_score):

        if utility_score >= 75:
            return "ACCEPT"

        elif utility_score >= 50:
            return "REVIEW"

        else:
            return "REJECT"

    # -----------------------------
    # Evaluate Truck
    # -----------------------------
    def evaluate_truck(self,
                       db: Session,
                       request: schemas.TruckEvaluationRequest):

        truck = self.get_truck_by_id(
            db,
            request.truck_id
        )

        if truck is None:

            return {
                "error": "Truck not found"
            }

        cap_score = self.capacity_score(
            truck.capacity_tons,
            request.load_capacity
        )

        money_score = self.money_score(
            truck.driver_expected_rate_per_km,
            request.distance_km,
            request.offered_money
        )

        fuel_score = self.fuel_score(
            truck.fuel_percent
        )

        maintenance_score = self.maintenance_score(
            truck.maintenance_percent
        )

        utility = self.utility_score(
            cap_score,
            money_score,
            fuel_score,
            maintenance_score
        )

        decision = self.decision(
            utility
        )

        return {
            "truck_id": truck.truck_id,

            "capacity_score": cap_score,

            "money_score": money_score,

            "fuel_score": fuel_score,

            "maintenance_score": maintenance_score,

            "utility_score": utility,

            "decision": decision
        }


truck_service = TruckService()