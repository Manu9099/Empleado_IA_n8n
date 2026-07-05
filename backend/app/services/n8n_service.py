import httpx
from app.core.config import settings


def build_system_prompt(business_name: str, rubro: str, profile: dict, audience: str = "internal") -> str:
    """
    Construye el system prompt que define personalidad, contexto y reglas
    del asistente a partir del perfil del negocio.

    audience:
      - "internal": quien chatea es el dueño del negocio (uso interno, hoy es el único canal).
                    El agente puede usar tools de gestión (Sheets, Calculator, etc.) con confianza.
      - "customer": quien chatea es un cliente externo (futuro canal: WhatsApp/widget web).
                    El agente debe limitarse a la info pública y no tocar tools de gestión interna
                    salvo que las reglas del negocio lo autoricen explícitamente.
    """
    if audience == "customer":
        audience_line = (
            "Estás hablando con un CLIENTE EXTERNO del negocio, no con el dueño. "
            "Solo compartes la información pública de este perfil (servicios, horarios, FAQ). "
            "No uses herramientas de gestión interna (hojas de cálculo, reportes, etc.) a menos "
            "que una regla del negocio lo autorice explícitamente."
        )
    else:
        audience_line = (
            "Estás hablando directamente con el DUEÑO del negocio (uso interno), no con un cliente. "
            "Puedes usar libremente las herramientas de gestión que tengas disponibles "
            "(hojas de cálculo, calculadora, calendario, etc.) cuando te lo pida, y darle "
            "información completa sin los filtros que usarías con un cliente externo."
        )

    lines = [
        f'Eres el asistente virtual de "{business_name}", un negocio del rubro {rubro}.',
        audience_line,
        f"Tono de conversación: {profile.get('tone') or 'profesional, amable y claro'}.",
    ]

    if profile.get("description"):
        lines.append(f"Descripción del negocio: {profile['description']}")

    if profile.get("address"):
        lines.append(f"Dirección: {profile['address']}")

    if profile.get("opening_hours"):
        lines.append(f"Horario de atención: {profile['opening_hours']}")

    services = profile.get("services") or []
    if services:
        names = []
        for s in services:
            if isinstance(s, dict):
                name = s.get("name") or s.get("nombre") or s.get("title")
                if name:
                    names.append(str(name))
            else:
                names.append(str(s))
        if names:
            lines.append("Servicios que ofrece el negocio: " + ", ".join(names))

    faq = profile.get("faq") or []
    if faq:
        faq_lines = []
        for item in faq:
            if isinstance(item, dict):
                q = item.get("question") or item.get("pregunta") or ""
                a = item.get("answer") or item.get("respuesta") or ""
                if q or a:
                    faq_lines.append(f"- P: {q} / R: {a}")
        if faq_lines:
            lines.append("Preguntas frecuentes:\n" + "\n".join(faq_lines))

    rules = profile.get("rules") or []
    if rules:
        lines.append("Reglas que debes seguir siempre:\n" + "\n".join(f"- {r}" for r in rules))

    lines.append(
        "Reservas de citas: "
        + ("habilitadas." if profile.get("booking_enabled") else "deshabilitadas.")
    )

    return "\n\n".join(lines)


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