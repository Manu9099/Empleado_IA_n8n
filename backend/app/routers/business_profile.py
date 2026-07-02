from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import BusinessProfile, User
from app.schemas.schemas import BusinessProfileRequest, BusinessProfileResponse

router = APIRouter(prefix="/business-profile", tags=["business-profile"])


async def get_user(session_token: str, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.session_token == session_token))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="Sesión inválida")

    return user


async def get_or_create_profile(user: User, db: AsyncSession) -> BusinessProfile:
    result = await db.execute(
        select(BusinessProfile).where(BusinessProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()

    if profile:
        return profile

    profile = BusinessProfile(
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

    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    return profile


@router.get("", response_model=BusinessProfileResponse)
async def read_business_profile(
    session_token: str,
    db: AsyncSession = Depends(get_db),
):
    user = await get_user(session_token, db)
    profile = await get_or_create_profile(user, db)

    return profile


@router.put("", response_model=BusinessProfileResponse)
async def update_business_profile(
    body: BusinessProfileRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await get_user(body.session_token, db)
    profile = await get_or_create_profile(user, db)

    data = body.model_dump(exclude={"session_token"}, exclude_unset=True)

    for key, value in data.items():
        if value is not None:
            setattr(profile, key, value)

    await db.commit()
    await db.refresh(profile)

    return profile