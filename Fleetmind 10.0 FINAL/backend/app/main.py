import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import router
from .core.config import settings
from .core.database import trucks_db
from .services.matching_service import match_for_truck

async def background_matching_loop():
    while True:
        try:
            await asyncio.sleep(30)
            for truck in trucks_db.values():
                if truck.status == "TRAVELING" and truck.remaining_capacity > 0:
                    asyncio.create_task(match_for_truck(truck.truck_id))
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Error in background matching loop: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(background_matching_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="FleetMind 7.0",
    version="7.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
async def root():
    return {"message": "FleetMind 7.0 is running", "version": "7.0.0"}

@app.get("/health")
async def health():
    return {"status": "ok", "version": "7.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)