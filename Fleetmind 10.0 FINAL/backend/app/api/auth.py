from fastapi import APIRouter, HTTPException
from ..core.database import users_db
from ..models.requests import RegisterRequest, LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
async def register(request: RegisterRequest):
    key = f"{request.role}_{request.id}"
    if key in users_db:
        raise HTTPException(400, "User already exists")
    users_db[key] = request
    return {"status": "registered"}

@router.post("/login")
async def login(request: LoginRequest):
    key = f"{request.role}_{request.id}"
    user = users_db.get(key)
    if not user or user.password != request.password:
        raise HTTPException(401, "Invalid credentials")
    return LoginResponse(token=f"{request.role}_{request.id}", role=request.role, id=request.id)