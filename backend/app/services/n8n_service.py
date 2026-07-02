import httpx
from app.core.config import settings


async def call_n8n(
    *,
    business_slug: str,
    client_id: str,
    client_name: str,
    business_id: str,
    system_prompt: str,
    message: str,
    image_url: str | None,
    history: list[dict],
) -> dict:
    """
    Llama al webhook de n8n del negocio y retorna la respuesta.
    n8n espera: { client_id, business_id, system_prompt, message, image_url, history }
    n8n responde: { reply, image_url?, appointment? }
    """
    payload = {
        "client_id": client_id,
        "client_name": client_name,
        "business_id": business_id,
        "system_prompt": system_prompt,
        "message": message,
        "image_url": image_url,
        "history": history,
    }

    webhook_url = f"{settings.N8N_WEBHOOK_BASE_URL}/{business_slug}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(webhook_url, json=payload)
        response.raise_for_status()
        return response.json()
