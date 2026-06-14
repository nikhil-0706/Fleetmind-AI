from sqlalchemy.orm import Session
from load_agent import models, schemas


class LoadService:

    def register_load(self, db: Session, load: schemas.LoadCreate):
        db_load = models.Load(
            load_id=load.load_id,
            cargo_type=load.cargo_type,
            pickup_location=load.pickup_location,
            drop_location=load.drop_location,
            load_weight_tons=load.load_weight_tons,
            offered_money=load.offered_money,
            distance_km=load.distance_km,
            pickup_deadline_hours=load.pickup_deadline_hours,
            delivery_deadline_hours=load.delivery_deadline_hours,
            priority=load.priority,
            loading_time_hours=load.loading_time_hours,
            special_handling_required=load.special_handling_required,
            status=load.status
        )

        db.add(db_load)
        db.commit()
        db.refresh(db_load)

        return db_load

    def get_all_loads(self, db: Session):
        return db.query(models.Load).all()

    def get_load_by_id(self, db: Session, load_id: str):
        return (
            db.query(models.Load)
            .filter(models.Load.load_id == load_id)
            .first()
        )

    def update_status(self, db: Session, load_id: str, status: str):
        load = self.get_load_by_id(db, load_id)

        if load:
            load.status = status
            db.commit()
            db.refresh(load)

        return load

    def weight_score(self, weight):
        if weight <= 5:
            return 100
        elif weight <= 10:
            return 85
        elif weight <= 15:
            return 70
        elif weight <= 20:
            return 55
        return 30

    def money_score(self, offered_money, distance_km):
        base_rate_per_km = 50
        expected_money = distance_km * base_rate_per_km

        if expected_money <= 0:
            return 0

        score = (offered_money / expected_money) * 100
        return min(round(score, 2), 100)

    def priority_score(self, priority):
        priority = priority.lower()

        if priority == "urgent":
            return 100
        elif priority == "high":
            return 85
        elif priority == "medium":
            return 65
        elif priority == "low":
            return 45
        return 50

    def deadline_score(self, delivery_deadline_hours):
        if delivery_deadline_hours <= 6:
            return 100
        elif delivery_deadline_hours <= 12:
            return 85
        elif delivery_deadline_hours <= 24:
            return 70
        elif delivery_deadline_hours <= 48:
            return 55
        return 40

    def handling_score(self, special_handling_required):
        if special_handling_required:
            return 60
        return 100

    def loading_time_score(self, loading_time_hours):
        if loading_time_hours <= 1:
            return 100
        elif loading_time_hours <= 3:
            return 80
        elif loading_time_hours <= 5:
            return 60
        return 40

    def final_score(
        self,
        weight_score,
        money_score,
        priority_score,
        deadline_score,
        handling_score,
        loading_time_score
    ):
        score = (
            weight_score * 0.15 +
            money_score * 0.30 +
            priority_score * 0.20 +
            deadline_score * 0.15 +
            handling_score * 0.10 +
            loading_time_score * 0.10
        )

        return round(score, 2)

    def decision(self, final_score):
        if final_score >= 75:
            return "HIGH_VALUE_LOAD"
        elif final_score >= 50:
            return "REVIEW_LOAD"
        return "LOW_VALUE_LOAD"

    def evaluate_load(self, db: Session, request: schemas.LoadEvaluationRequest):
        load = self.get_load_by_id(db, request.load_id)

        if load is None:
            return {"error": "Load not found"}

        w_score = self.weight_score(load.load_weight_tons)
        m_score = self.money_score(load.offered_money, load.distance_km)
        p_score = self.priority_score(load.priority)
        d_score = self.deadline_score(load.delivery_deadline_hours)
        h_score = self.handling_score(load.special_handling_required)
        lt_score = self.loading_time_score(load.loading_time_hours)

        final = self.final_score(
            w_score,
            m_score,
            p_score,
            d_score,
            h_score,
            lt_score
        )

        decision = self.decision(final)

        return {
            "agent": "Load Agent",
            "load_id": load.load_id,
            "subscores": {
                "weight_score": w_score,
                "money_score": m_score,
                "priority_score": p_score,
                "deadline_score": d_score,
                "handling_score": h_score,
                "loading_time_score": lt_score
            },
            "final_load_score": final,
            "decision": decision,
            "send_to": "Coordinator Agent"
        }


load_service = LoadService()