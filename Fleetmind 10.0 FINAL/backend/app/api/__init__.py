from fastapi import APIRouter
from .auth import router as auth_router
from .driver import router as driver_router
from .shipper import router as shipper_router
from .warehouse import router as warehouse_router
from .admin import router as admin_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(driver_router)
router.include_router(shipper_router)
router.include_router(warehouse_router)
router.include_router(admin_router)
