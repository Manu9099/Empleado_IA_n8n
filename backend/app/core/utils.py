import re
import unicodedata


def slugify(text: str) -> str:
    """
    Convierte un texto (ej. nombre de negocio) en un slug URL-safe.
    "Café Don José" -> "cafe-don-jose"
    """
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "negocio"