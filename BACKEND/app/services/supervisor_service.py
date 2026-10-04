from sqlalchemy.orm import Session
from datetime import timedelta
from app.models.supervisor import Supervisor
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.exceptions import AuthenticationError, DuplicateEntityError
from app.schemas.supervisor import SupervisorLogin, Token, SupervisorCreate, SupervisorOut

def authenticate_supervisor(db: Session, login_data: SupervisorLogin) -> Token:
    supervisor = db.query(Supervisor).filter(Supervisor.username == login_data.username).first()
    if not supervisor or not supervisor.is_active:
        raise AuthenticationError("Incorrect username or password")
    
    if not verify_password(login_data.password, supervisor.password_hash):
        raise AuthenticationError("Incorrect username or password")
    
    access_token = create_access_token(data={"sub": supervisor.username})
    return Token(access_token=access_token, token_type="bearer")

def create_supervisor(db: Session, supervisor_in: SupervisorCreate) -> Supervisor:
    existing = db.query(Supervisor).filter(Supervisor.username == supervisor_in.username).first()
    if existing:
        raise DuplicateEntityError("Supervisor username already exists")
    
    hashed_password = get_password_hash(supervisor_in.password)
    supervisor = Supervisor(username=supervisor_in.username, password_hash=hashed_password)
    
    db.add(supervisor)
    db.commit()
    db.refresh(supervisor)
    return supervisor
