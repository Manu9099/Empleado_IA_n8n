import uuid
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import RegisterRequest, RegisterResponse

router = APIRouter(prefix="/register", tags=["register"])


@router.post("", response_model=RegisterResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Si ya existe el email, devolver sesión existente
    result = await db.execute(select(User).where(User.email == body.email))
    existing = result.scalar_one_or_none()

    if existing:
        return RegisterResponse(
            session_token=existing.session_token,
            user_id=str(existing.id),
            welcome_message=f"¡Bienvenido de vuelta {existing.name}! ¿En qué te ayudo hoy?",
        )

    user = User(
        id=uuid.uuid4(),
        name=body.name,
        phone=body.phone,
        email=body.email,
        business_name=body.business_name,
        rubro=body.rubro,
        session_token=secrets.token_hex(32),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return RegisterResponse(
        session_token=user.session_token,
        user_id=str(user.id),
        welcome_message=f"¡Hola {user.name}! Soy tu asistente para {user.business_name}. ¿En qué te ayudo?",
    )
