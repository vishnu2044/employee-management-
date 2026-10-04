from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class SupervisorLogin(BaseModel):
    username: str
    password: str

class SupervisorCreate(SupervisorLogin):
    pass

class SupervisorOut(BaseModel):
    id: UUID
    username: str
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
