import cloudinary
import cloudinary.uploader
from app.core.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


async def upload_and_enhance(file_bytes: bytes, filename: str) -> dict:
    """
    Sube la imagen original y genera una versión mejorada
    usando las transformaciones automáticas de Cloudinary.
    Retorna { original_url, enhanced_url }
    """
    result = cloudinary.uploader.upload(
        file_bytes,
        folder="empleado-ia",
        public_id=filename,
        overwrite=True,
        resource_type="image",
    )

    original_url: str = result["secure_url"]

    # Transformación automática: mejora de calidad + nitidez + auto-color
    public_id: str = result["public_id"]
    enhanced_url = cloudinary.CloudinaryImage(public_id).build_url(
        transformation=[
            {"quality": "auto:best"},
            {"fetch_format": "auto"},
            {"effect": "sharpen:80"},
            {"effect": "improve"},
        ]
    )

    return {"original_url": original_url, "enhanced_url": enhanced_url}
