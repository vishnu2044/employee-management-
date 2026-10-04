from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.supervisor import Token, SupervisorCreate, SupervisorOut, SupervisorLogin
from app.services import supervisor_service

router = APIRouter()

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    login_data = SupervisorLogin(username=form_data.username, password=form_data.password)
    return supervisor_service.authenticate_supervisor(db, login_data)

@router.post("/signup", response_model=SupervisorOut, status_code=status.HTTP_201_CREATED)
def signup(supervisor_in: SupervisorCreate, db: Session = Depends(get_db)):
    return supervisor_service.create_supervisor(db, supervisor_in)
