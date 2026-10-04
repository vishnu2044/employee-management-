from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import AuthenticationError
from app.models.supervisor import Supervisor
from app.schemas.supervisor import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/supervisor/login")

def get_current_supervisor(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> Supervisor:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            raise AuthenticationError("Could not validate credentials")
        token_data = TokenData(username=username)
    except JWTError:
        raise AuthenticationError("Could not validate credentials")
    
    supervisor = db.query(Supervisor).filter(Supervisor.username == token_data.username).first()
    if supervisor is None or not supervisor.is_active:
        raise AuthenticationError("Could not validate credentials")
    return supervisor
