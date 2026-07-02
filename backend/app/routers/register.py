import uuid
import secrets

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import User, BusinessProfile
from app.schemas.schemas import RegisterRequest, RegisterResponse

router = APIRouter(prefix="/register", tags=["register"])


@router.post("", response_model=RegisterResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Si ya existe el email, devolver sesión existente
    result = await db.execute(select(User).where(User.email == body.email))
    existing = result.scalar_one_or_none()

    if existing:
        # Por si el usuario existía antes de crear BusinessProfile
        profile_result = await db.execute(
            select(BusinessProfile).where(BusinessProfile.user_id == existing.id)
        )
        existing_profile = profile_result.scalar_one_or_none()

        if not existing_profile:
            business_profile = BusinessProfile(
                user_id=existing.id,
                tone="profesional, amable y claro",
                description=f"Asistente virtual para {existing.business_name}, negocio del rubro {existing.rubro}.",
                services=[],
                faq=[],
                rules=[
                    "No inventar precios, horarios ni servicios.",
                    "Si falta información, preguntar de forma breve.",
                    "Si no sabes algo, ofrecer derivarlo al negocio.",
                ],
                booking_enabled=True,
                reminders_enabled=False,
                whatsapp_enabled=False,
            )
            db.add(business_profile)
            await db.commit()

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

    business_profile = BusinessProfile(
        user_id=user.id,
        tone="profesional, amable y claro",
        description=f"Asistente virtual para {user.business_name}, negocio del rubro {user.rubro}.",
        services=[],
        faq=[],
        rules=[
            "No inventar precios, horarios ni servicios.",
            "Si falta información, preguntar de forma breve.",
            "Si no sabes algo, ofrecer derivarlo al negocio.",
        ],
        booking_enabled=True,
        reminders_enabled=False,
        whatsapp_enabled=False,
    )

    db.add(user)
    db.add(business_profile)

    await db.commit()
    await db.refresh(user)

    return RegisterResponse(
        session_token=user.session_token,
        user_id=str(user.id),
        welcome_message=f"¡Hola {user.name}! Soy tu asistente para {user.business_name}. ¿En qué te ayudo?",
    )