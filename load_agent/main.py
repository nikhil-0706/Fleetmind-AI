from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from load_agent import models, schemas
from load_agent.database import engine, get_db
from load_agent.service import load_service

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Load Agent API",
    description="Independent Load Agent microservice for multi-agent logistics system",
    version="1.0.0"
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "agent": "Load Agent"
    }


@app.post("/register-load", response_model=schemas.LoadResponse)
def register_load(
    load: schemas.LoadCreate,
    db: Session = Depends(get_db)
):
    existing_load = load_service.get_load_by_id(db, load.load_id)

    if existing_load:
        raise HTTPException(
            status_code=400,
            detail="Load with this ID already exists"
        )

    return load_service.register_load(db, load)


@app.get("/loads", response_model=list[schemas.LoadResponse])
def get_all_loads(db: Session = Depends(get_db)):
    return load_service.get_all_loads(db)


@app.get("/load/{load_id}", response_model=schemas.LoadResponse)
def get_load_by_id(
    load_id: str,
    db: Session = Depends(get_db)
):
    load = load_service.get_load_by_id(db, load_id)

    if load is None:
        raise HTTPException(
            status_code=404,
            detail="Load not found"
        )

    return load


@app.patch("/load/{load_id}/status", response_model=schemas.LoadResponse)
def update_load_status(
    load_id: str,
    status: str,
    db: Session = Depends(get_db)
):
    allowed_status = ["pending", "assigned", "in_transit", "delivered", "cancelled"]

    if status not in allowed_status:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    load = load_service.update_status(db, load_id, status)

    if load is None:
        raise HTTPException(
            status_code=404,
            detail="Load not found"
        )

    return load


@app.post("/evaluate-load")
def evaluate_load(
    request: schemas.LoadEvaluationRequest,
    db: Session = Depends(get_db)
):
    result = load_service.evaluate_load(db, request)

    if "error" in result:
        raise HTTPException(
            status_code=404,
            detail=result["error"]
        )

    return result