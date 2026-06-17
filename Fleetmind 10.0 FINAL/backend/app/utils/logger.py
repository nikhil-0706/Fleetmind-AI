from datetime import datetime
from typing import Optional, List
from ..core.database import logs_db
from ..models.domain import LogEntry

def log_event(event_type: str, entity_id: str, details: dict, is_notification: bool = False, user_role: Optional[str] = None, user_id: Optional[str] = None):
    entry = LogEntry(timestamp=datetime.now(), event_type=event_type, entity_id=entity_id, details=details, is_notification=is_notification, user_role=user_role, user_id=user_id)
    logs_db.append(entry)

def get_logs(entity_id: Optional[str] = None, event_type: Optional[str] = None, is_notification: Optional[bool] = None) -> List[dict]:
    result = [log.dict() for log in logs_db]
    if entity_id:
        result = [l for l in result if l['entity_id'] == entity_id]
    if event_type:
        result = [l for l in result if l['event_type'] == event_type]
    if is_notification is not None:
        result = [l for l in result if l['is_notification'] == is_notification]
    result.sort(key=lambda x: x['timestamp'], reverse=True)
    return result