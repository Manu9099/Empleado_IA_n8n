import uuid
import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.models.models import User, Message, BusinessProfile
from app.schemas.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


async def get_user(session_token: str, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.session_token == session_token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Sesión inválida")
    return user


@router.post("", response_model=ChatResponse)
async def chat(body: ChatRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user(body.session_token, db)

    # Últimos 10 mensajes como contexto
    hist_result = await db.execute(
        select(Message)
        .where(Message.user_id == user.id)
        .order_by(Message.created_at.desc())
        .limit(10)
    )

    history = [
        {"role": m.role, "content": m.content}
        for m in reversed(hist_result.scalars().all())
    ]

    # Guardar mensaje del usuario
    db.add(Message(
        id=uuid.uuid4(),
        user_id=user.id,
        role="user",
        content=body.message,
        image_url=body.image_url,
    ))
    await db.commit()

    # Agregar mensaje actual al historial que se manda a n8n
    history.append({"role": "user", "content": body.message})

    # Cargar perfil del negocio
    profile_result = await db.execute(
        select(BusinessProfile).where(BusinessProfile.user_id == user.id)
    )
    profile = profile_result.scalar_one_or_none()

    business_profile = {
        "tone": profile.tone if profile else "profesional, amable y claro",
        "description": profile.description if profile else None,
        "address": profile.address if profile else None,
        "opening_hours": profile.opening_hours if profile else None,
        "services": profile.services if profile else [],
        "faq": profile.faq if profile else [],
        "rules": profile.rules if profile else [],
        "booking_enabled": profile.booking_enabled if profile else True,
        "reminders_enabled": profile.reminders_enabled if profile else False,
        "whatsapp_enabled": profile.whatsapp_enabled if profile else False,
    }

    # Enviar a n8n
    payload = {
        "user_id": str(user.id),
        "user_name": user.name,
        "business_name": user.business_name,
        "rubro": user.rubro,
        "message": body.message,
        "image_url": body.image_url,
        "history": history,
        "business_profile": business_profile,
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(settings.N8N_WEBHOOK_URL, json=payload)
            resp.raise_for_status()

        raw = resp.json()

        if isinstance(raw, list) and len(raw) > 0:
            n8n = raw[0]
        elif isinstance(raw, dict):
            n8n = raw
        else:
            n8n = {}

    except httpx.ReadTimeout:
        n8n = {
            "reply": "Estoy procesando tu solicitud, esto tomó más de lo esperado. Intenta de nuevo en un momento."
        }

    except httpx.HTTPStatusError as e:
        n8n = {
            "reply": f"n8n respondió con error {e.response.status_code}. Revisa el workflow."
        }

    except Exception:
        n8n = {
            "reply": "Hubo un problema de conexión con el asistente. Intenta de nuevo."
        }

    reply = n8n.get("reply") or n8n.get("output") or "Sin respuesta del asistente."

    # Guardar respuesta del asistente
    db.add(Message(
        id=uuid.uuid4(),
        user_id=user.id,
        role="assistant",
        content=reply,
        image_url=n8n.get("image_url"),
    ))
    await db.commit()

    return ChatResponse(
        reply=reply,
        image_url=n8n.get("image_url"),
        appointment=n8n.get("appointment"),
    )