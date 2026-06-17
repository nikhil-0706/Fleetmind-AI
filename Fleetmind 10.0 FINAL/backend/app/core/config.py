from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PORT: int = 8005
    MIN_RATE: float = 0.0
    MAX_RATE: float = 200.0

    # --- CHANGED: Increased thresholds for realistic distances ---
    DETOUR_THRESHOLD_KM: float = 80.0      # was 20
    NEARBY_RADIUS_KM: float = 80.0         # was 60
    # ---

    DEFAULT_SPEED_KMPH: float = 50.0
    DEADLINE_BUFFER_MIN: int = 15
    WAREHOUSE_DOCK_COUNT: int = 5
    MAP_FILE_PATH: str = "data/map_data.json"
    MAX_PROPOSALS_PER_TRUCK: int = 5
    PROPOSAL_LOCK_SECONDS: int = 60

settings = Settings()