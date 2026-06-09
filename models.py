from sqlalchemy import Column, Integer, String, Float
from database import Base


class Truck(Base):
    __tablename__ = "trucks"

    id = Column(Integer, primary_key=True, index=True)

    truck_id = Column(String, unique=True, index=True)

    truck_type = Column(String)

    current_location = Column(String)

    capacity_tons = Column(Float)

    fuel_percent = Column(Float)

    maintenance_percent = Column(Float)

    driver_expected_rate_per_km = Column(Float)

    status = Column(String)

    registration_number = Column(String)

    driver_name = Column(String)

    