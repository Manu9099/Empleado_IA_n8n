import uuid
import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.models.models import User, Message
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

    # Enviar a n8n
    payload = {
        "user_id": str(user.id),
        "user_name": user.name,
        "business_name": user.business_name,
        "rubro": user.rubro,
        "message": body.message,
        "image_url": body.image_url,
        "history": history,
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(settings.N8N_WEBHOOK_URL, json=payload)
        raw = resp.json()
        # n8n puede devolver array u objeto
        n8n = raw[0] if isinstance(raw, list) and len(raw) > 0 else raw if isinstance(raw, dict) else {}
    except httpx.ReadTimeout:
        n8n = {"reply": "Estoy procesando tu solicitud, esto tomó más de lo esperado. Intenta de nuevo en un momento."}
    except Exception as e:
        n8n = {"reply": "Hubo un problema de conexión. Intenta de nuevo."}

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


@router.post("/upload-image")
async def upload_image(
    session_token: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user(session_token, db)
    file_bytes = await file.read()

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.nanobana.na/enhance",
            headers={"Authorization": f"Bearer {settings.NANO_BANANA_API_KEY}"},
            files={"image": (file.filename, file_bytes, file.content_type)},
        )
        resp.raise_for_status()
        result = resp.json()

    return {"original_url": result.get("original_url"), "enhanced_url": result.get("enhanced_url")}


@router.get("/history")
async def history(session_token: str, db: AsyncSession = Depends(get_db)):
    user = await get_user(session_token, db)
    result = await db.execute(
        select(Message).where(Message.user_id == user.id).order_by(Message.created_at.asc())
    )
    return [
        {"role": m.role, "content": m.content, "image_url": m.image_url, "created_at": m.created_at.isoformat()}
        for m in result.scalars().all()
    ]
