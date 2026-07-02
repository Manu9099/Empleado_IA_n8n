from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.models.models import User

router = APIRouter(prefix="/login", tags=["login"])


class LoginRequest(BaseModel):
    email: str


@router.post("")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {
        "session_token": user.session_token,
        "user_id": str(user.id),
        "user_name": user.name,
        "business_name": user.business_name,
        "welcome_message": f"¡Bienvenido de vuelta {user.name}!",
    }
