from sqlalchemy import Column, Integer, String, Float, Boolean
from load_agent.database import Base


class Load(Base):
    __tablename__ = "loads"

    id = Column(Integer, primary_key=True, index=True)

    load_id = Column(String, unique=True, index=True)
    cargo_type = Column(String)
    pickup_location = Column(String)
    drop_location = Column(String)

    load_weight_tons = Column(Float)
    offered_money = Column(Float)
    distance_km = Column(Float)

    pickup_deadline_hours = Column(Float)
    delivery_deadline_hours = Column(Float)

    priority = Column(String)
    loading_time_hours = Column(Float)
    special_handling_required = Column(Boolean)

    status = Column(String)