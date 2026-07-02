import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.models import User, Appointment
from app.schemas.schemas import AppointmentOut

router = APIRouter(prefix="/appointments", tags=["appointments"])


async def get_user(session_token: str, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.session_token == session_token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Sesión inválida")
    return user


@router.get("", response_model=list[AppointmentOut])
async def list_appointments(session_token: str, db: AsyncSession = Depends(get_db)):
    user = await get_user(session_token, db)
    result = await db.execute(
        select(Appointment)
        .where(Appointment.user_id == user.id)
        .order_by(Appointment.scheduled_at.asc())
    )
    return result.scalars().all()


@router.patch("/{appointment_id}/cancel", response_model=AppointmentOut)
async def cancel(appointment_id: uuid.UUID, session_token: str, db: AsyncSession = Depends(get_db)):
    user = await get_user(session_token, db)
    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id, Appointment.user_id == user.id)
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    appt.status = "cancelled"
    await db.commit()
    await db.refresh(appt)
    return appt
