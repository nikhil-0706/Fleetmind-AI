from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, List[WebSocket]]] = {
            "driver": {},   # truck_id -> list
            "shipper": {},
            "warehouse": {},
            "admin": []
        }

    async def connect(self, websocket: WebSocket, role: str, entity_id: str = None):
        await websocket.accept()
        if role == "admin":
            self.active_connections["admin"].append(websocket)
        else:
            if entity_id not in self.active_connections[role]:
                self.active_connections[role][entity_id] = []
            self.active_connections[role][entity_id].append(websocket)

    def disconnect(self, websocket: WebSocket, role: str, entity_id: str = None):
        if role == "admin":
            if websocket in self.active_connections["admin"]:
                self.active_connections["admin"].remove(websocket)
        else:
            if entity_id in self.active_connections[role]:
                if websocket in self.active_connections[role][entity_id]:
                    self.active_connections[role][entity_id].remove(websocket)

    async def send_personal(self, role: str, entity_id: str, message: dict):
        if role == "admin":
            for conn in self.active_connections["admin"]:
                try:
                    await conn.send_json(message)
                except:
                    pass
        else:
            if entity_id in self.active_connections[role]:
                for conn in self.active_connections[role][entity_id]:
                    try:
                        await conn.send_json(message)
                    except:
                        pass

manager = ConnectionManager()